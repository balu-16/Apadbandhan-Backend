import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as mqtt from 'mqtt';
import { Subject, Observable, Subscription } from 'rxjs';
import { 
  MQTT_TOPICS, 
  DEFAULT_SUBSCRIPTIONS, 
  MQTT_RECONNECT_SETTINGS,
  MqttQoS,
  MqttEventType 
} from './mqtt.constants';

/**
 * MQTT Message Interface
 */
export interface MqttMessage {
  topic: string;
  deviceId: string;
  payload: any;
  timestamp: Date;
  eventType: MqttEventType;
}

/**
 * Device Telemetry Payload Interface
 */
export interface DeviceTelemetryPayload {
  deviceId: string;
  timestamp: string;
  location: {
    lat: number;
    lng: number;
  };
  speed?: number;
  altitude?: number;
  heading?: number;
  batteryLevel?: number;
  signalStrength?: number;
}

/**
 * Accident Event Payload Interface
 */
export interface AccidentEventPayload {
  deviceId: string;
  timestamp: string;
  location: {
    lat: number;
    lng: number;
  };
  speed: number;
  impact: number;
  event: 'accident';
  severity?: 'low' | 'medium' | 'high' | 'critical';
  sensorData?: {
    accelerometer?: { x: number; y: number; z: number };
    gyroscope?: { x: number; y: number; z: number };
  };
}

/**
 * MQTT Service - MQTT over TLS (MQTTS)
 * 
 * Production-grade MQTT client for IoT device communication.
 * Supports MQTTS (port 8883) and WSS (port 8084) protocols.
 * Handles connection, reconnection, subscriptions, and message routing.
 */
@Injectable()
export class MqttService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MqttService.name);
  private client: mqtt.MqttClient | null = null;
  private isConnected = false;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  
  // RxJS Subject for message streaming
  private messageSubject = new Subject<MqttMessage>();
  private accidentSubject = new Subject<AccidentEventPayload>();
  private telemetrySubject = new Subject<DeviceTelemetryPayload>();
  private errorSubject = new Subject<{ topic: string; error: Error; rawPayload: string }>();
  
  // Subscription tracking for cleanup
  private subscriptions: Subscription[] = [];
  
  // Mutex for connection state
  private connectionMutex = false;
  
  // Last ping time for monitoring
  private lastPingTime: Date | null = null;
  
  constructor(private configService: ConfigService) {}

  /**
   * Initialize MQTT connection on module startup
   */
  async onModuleInit() {
    this.logger.log('🔌 Initializing MQTT Service...');
    await this.connect();
  }

  /**
   * Cleanup on module destroy
   */
  async onModuleDestroy() {
    this.logger.log('🔌 Shutting down MQTT Service...');
    
    // Unsubscribe all RxJS subscriptions to prevent memory leaks
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
    
    // Complete all subjects
    this.messageSubject.complete();
    this.accidentSubject.complete();
    this.telemetrySubject.complete();
    this.errorSubject.complete();
    
    await this.disconnect();
  }

  /**
   * Get connection status
   */
  get connected(): boolean {
    return this.isConnected;
  }

  /**
   * Observable stream of all MQTT messages
   */
  get messages$(): Observable<MqttMessage> {
    return this.messageSubject.asObservable();
  }

  /**
   * Observable stream of accident events
   */
  get accidents$(): Observable<AccidentEventPayload> {
    return this.accidentSubject.asObservable();
  }

  /**
   * Observable stream of telemetry data
   */
  get telemetry$(): Observable<DeviceTelemetryPayload> {
    return this.telemetrySubject.asObservable();
  }

  /**
   * Observable stream of parse/processing errors
   */
  get errors$(): Observable<{ topic: string; error: Error; rawPayload: string }> {
    return this.errorSubject.asObservable();
  }

  /**
   * Get last ping time for health monitoring
   */
  get lastPing(): Date | null {
    return this.lastPingTime;
  }

  /**
   * Validate MQTT broker URL format
   */
  private validateBrokerUrl(url: string): boolean {
    const validProtocols = ['mqtt://', 'mqtts://', 'ws://', 'wss://'];
    return validProtocols.some(protocol => url.startsWith(protocol));
  }

  /**
   * Connect to MQTT broker
   * Supports mqtts://, wss://, mqtt://, ws:// protocols
   */
  private async connect(): Promise<void> {
    // Mutex to prevent race conditions
    if (this.connectionMutex) {
      this.logger.debug('Connection mutex locked, skipping');
      return;
    }
    
    // Prevent multiple simultaneous connections
    if (this.isConnecting || this.isConnected) {
      this.logger.debug('Connection already in progress or established');
      return;
    }

    this.connectionMutex = true;
    this.isConnecting = true;

    try {
      const brokerUrl = this.configService.get<string>('MQTT_BROKER_URL');
      const username = this.configService.get<string>('MQTT_USERNAME');
      const password = this.configService.get<string>('MQTT_PASSWORD');
      const clientId = this.configService.get<string>('MQTT_CLIENT_ID', 'apadbandhav-backend');

      if (!brokerUrl || !username || !password) {
        this.logger.warn('⚠️ MQTT configuration incomplete. Skipping MQTT connection.');
        this.logger.warn('   Required: MQTT_BROKER_URL, MQTT_USERNAME, MQTT_PASSWORD');
        this.isConnecting = false;
        this.connectionMutex = false;
        return;
      }

      // Validate broker URL format
      if (!this.validateBrokerUrl(brokerUrl)) {
        this.logger.error(`❌ Invalid MQTT broker URL format: ${brokerUrl}`);
        this.logger.error('   Must start with: mqtt://, mqtts://, ws://, or wss://');
        this.isConnecting = false;
        this.connectionMutex = false;
        return;
      }

      const uniqueClientId = `${clientId}-${Date.now()}`;
      
      this.logger.log(`📡 Connecting to MQTT Broker...`);
      this.logger.log(`   URL: ${brokerUrl}`);
      this.logger.log(`   Client ID: ${uniqueClientId}`);

      // Simple connection options - matching working test script
      const options: mqtt.IClientOptions = {
        username,
        password,
        clientId: uniqueClientId,
      };

      // Disconnect existing client if any
      if (this.client) {
        this.client.removeAllListeners();
        this.client.end(true);
        this.client = null;
      }

      // Connect using broker URL
      this.client = mqtt.connect(brokerUrl, options);
      this.setupEventHandlers();
    } catch (error) {
      this.logger.error(`❌ Failed to create MQTT client: ${error.message}`);
      this.isConnecting = false;
      this.scheduleReconnect();
    } finally {
      this.connectionMutex = false;
    }
  }

  /**
   * Setup MQTT event handlers
  */
  private setupEventHandlers(): void {
    if (!this.client) return;

    // Connection established
    this.client.on('connect', () => {
      this.isConnected = true;
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.clearReconnectTimer();
      this.logger.log('✅ MQTT Connected successfully!');
      this.subscribeToTopics();
    });

    // Connection lost
    this.client.on('close', () => {
      if (this.isConnected) {
        this.isConnected = false;
        this.isConnecting = false;
        this.logger.warn('🔌 MQTT Connection closed');
        this.scheduleReconnect();
      }
    });

    // Connection error
    this.client.on('error', (error: any) => {
      this.isConnecting = false;
      this.logger.error(`❌ MQTT Error: ${error.message}`);
      this.logger.error(`   Error Code: ${error.code || 'N/A'}`);
      this.logger.error(`   Error Stack: ${error.stack?.split('\n')[1] || 'N/A'}`);
      
      // Schedule reconnect only if not already scheduled
      if (!this.reconnectTimer && !this.isConnected) {
        this.scheduleReconnect();
      }
    });

    // Offline
    this.client.on('offline', () => {
      if (this.isConnected) {
        this.isConnected = false;
        this.isConnecting = false;
        this.logger.warn('📴 MQTT Client offline');
        this.scheduleReconnect();
      }
    });

    // Message received
    this.client.on('message', (topic: string, payload: Buffer) => {
      this.handleMessage(topic, payload);
    });

    // Ping/Pong for connection health monitoring
    this.client.on('packetreceive', (packet: any) => {
      if (packet.cmd === 'pingresp') {
        this.lastPingTime = new Date();
        this.logger.debug('🏓 Ping response received');
      }
    });
  }

  /**
   * Clear reconnect timer
   */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Subscribe to default topics
   */
  private subscribeToTopics(): void {
    if (!this.client || !this.isConnected) return;

    DEFAULT_SUBSCRIPTIONS.forEach(({ topic, qos }) => {
      this.client!.subscribe(topic, { qos }, (error) => {
        if (error) {
          this.logger.error(`❌ Failed to subscribe to ${topic}: ${error.message}`);
        } else {
          this.logger.log(`📥 Subscribed to: ${topic}`);
        }
      });
    });
  }

  /**
   * Handle incoming MQTT message
   */
  private handleMessage(topic: string, payload: Buffer): void {
    try {
      const payloadStr = payload.toString();
      const data = JSON.parse(payloadStr);
      
      // Extract device ID from topic (devices/{deviceId}/...)
      const topicParts = topic.split('/');
      const deviceId = topicParts[1] || data.deviceId;
      const eventType = this.getEventType(topic);

      this.logger.debug(`📨 Message received on ${topic}`);
      this.logger.debug(`   Device ID: ${deviceId}`);
      this.logger.debug(`   Event Type: ${eventType}`);

      // Create message object
      const message: MqttMessage = {
        topic,
        deviceId,
        payload: data,
        timestamp: new Date(),
        eventType,
      };

      // Emit to general message stream
      this.messageSubject.next(message);

      // Route to specific streams based on topic
      if (topic.includes('/accident')) {
        this.logger.warn(`🚨 ACCIDENT DETECTED from device: ${deviceId}`);
        this.accidentSubject.next(data as AccidentEventPayload);
      } else if (topic.includes('/telemetry')) {
        this.telemetrySubject.next(data as DeviceTelemetryPayload);
      }

    } catch (error) {
      const rawPayload = payload.toString();
      this.logger.error(`❌ Failed to parse MQTT message: ${error.message}`);
      this.logger.error(`   Topic: ${topic}`);
      this.logger.error(`   Payload: ${rawPayload}`);
      
      // Emit to error stream for monitoring
      this.errorSubject.next({
        topic,
        error: error as Error,
        rawPayload,
      });
    }
  }

  /**
   * Get event type from topic
   */
  private getEventType(topic: string): MqttEventType {
    if (topic.includes('/accident')) return MqttEventType.ACCIDENT;
    if (topic.includes('/telemetry')) return MqttEventType.TELEMETRY;
    if (topic.includes('/health')) return MqttEventType.HEALTH;
    if (topic.includes('/events')) return MqttEventType.STATUS;
    return MqttEventType.STATUS;
  }

  /**
   * Schedule reconnection with exponential backoff and jitter
   */
  private scheduleReconnect(): void {
    // Prevent multiple timers
    if (this.reconnectTimer || this.isConnecting) {
      return;
    }

    // Check max attempts (-1 means infinite)
    const maxAttempts = MQTT_RECONNECT_SETTINGS.MAX_ATTEMPTS;
    if (maxAttempts !== -1 && this.reconnectAttempts >= maxAttempts) {
      this.logger.error(`❌ Max reconnection attempts (${maxAttempts}) reached. Giving up.`);
      return;
    }

    // Calculate delay with exponential backoff
    let delay = Math.min(
      MQTT_RECONNECT_SETTINGS.INITIAL_DELAY * 
        Math.pow(MQTT_RECONNECT_SETTINGS.MULTIPLIER, this.reconnectAttempts),
      MQTT_RECONNECT_SETTINGS.MAX_DELAY
    );
    
    // Add jitter to prevent thundering herd
    const jitter = MQTT_RECONNECT_SETTINGS.JITTER || 0.1;
    const jitterAmount = delay * jitter * (Math.random() * 2 - 1); // +/- jitter%
    delay = Math.round(delay + jitterAmount);
    
    this.reconnectAttempts++;
    const attemptsDisplay = maxAttempts === -1 ? '∞' : maxAttempts;
    this.logger.log(`⏰ Scheduling reconnect in ${delay}ms... (Attempt ${this.reconnectAttempts}/${attemptsDisplay})`);
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.isConnected && !this.isConnecting) {
        this.connect();
      }
    }, delay);
  }

  /**
   * Publish message to a topic
   * @param topic - MQTT topic
   * @param message - Message payload (will be JSON stringified)
   * @param qos - Quality of Service level (default: 1)
   */
  publish(topic: string, message: any, qos: MqttQoS = MqttQoS.AT_LEAST_ONCE): void {
    if (!this.client || !this.isConnected) {
      this.logger.warn(`⚠️ Cannot publish - MQTT not connected`);
      return;
    }

    const payload = typeof message === 'string' ? message : JSON.stringify(message);
    
    this.client.publish(topic, payload, { qos }, (error) => {
      if (error) {
        this.logger.error(`❌ Failed to publish to ${topic}: ${error.message}`);
      } else {
        this.logger.debug(`📤 Published to ${topic}`);
      }
    });
  }

  /**
   * Send command to a specific device
   * @param deviceId - Target device ID
   * @param command - Command payload
   */
  sendCommand(deviceId: string, command: any): void {
    const topic = MQTT_TOPICS.buildBackendCommandTopic(deviceId);
    this.publish(topic, {
      command,
      timestamp: new Date().toISOString(),
      from: 'backend',
    });
  }

  /**
   * Subscribe to a specific topic
   * @param topic - Topic to subscribe
   * @param qos - Quality of Service level
   */
  subscribe(topic: string, qos: MqttQoS = MqttQoS.AT_LEAST_ONCE): void {
    if (!this.client || !this.isConnected) {
      this.logger.warn(`⚠️ Cannot subscribe - MQTT not connected`);
      return;
    }

    this.client.subscribe(topic, { qos }, (error) => {
      if (error) {
        this.logger.error(`❌ Failed to subscribe to ${topic}: ${error.message}`);
      } else {
        this.logger.log(`📥 Subscribed to: ${topic}`);
      }
    });
  }

  /**
   * Unsubscribe from a topic
   * @param topic - Topic to unsubscribe
   */
  unsubscribe(topic: string): void {
    if (!this.client) return;

    this.client.unsubscribe(topic, (error) => {
      if (error) {
        this.logger.error(`❌ Failed to unsubscribe from ${topic}: ${error.message}`);
      } else {
        this.logger.log(`📤 Unsubscribed from: ${topic}`);
      }
    });
  }

  /**
   * Disconnect from MQTT broker
   */
  private async disconnect(): Promise<void> {
    this.clearReconnectTimer();
    this.isConnecting = false;
    
    if (this.client) {
      return new Promise((resolve) => {
        this.client!.removeAllListeners();
        this.client!.end(true, {}, () => {
          this.isConnected = false;
          this.client = null;
          this.logger.log('🔌 MQTT Disconnected');
          resolve();
        });
      });
    }
  }

  /**
   * Get connection statistics and health info
   */
  getStats(): {
    connected: boolean;
    connecting: boolean;
    reconnectAttempts: number;
    clientId: string | null;
    lastPingTime: Date | null;
    lastPingAgeMs: number | null;
    healthy: boolean;
  } {
    const lastPingAgeMs = this.lastPingTime 
      ? Date.now() - this.lastPingTime.getTime() 
      : null;
    
    // Consider unhealthy if no ping received in last 2 minutes (2x keepalive)
    const healthy = this.isConnected && 
      (lastPingAgeMs === null || lastPingAgeMs < 120000);
    
    return {
      connected: this.isConnected,
      connecting: this.isConnecting,
      reconnectAttempts: this.reconnectAttempts,
      clientId: this.client ? (this.client as any).options?.clientId : null,
      lastPingTime: this.lastPingTime,
      lastPingAgeMs,
      healthy,
    };
  }

  /**
   * Force reconnection (useful for health check recovery)
   */
  async forceReconnect(): Promise<void> {
    this.logger.warn('⚠️ Force reconnect requested');
    await this.disconnect();
    this.reconnectAttempts = 0;
    await this.connect();
  }
}
