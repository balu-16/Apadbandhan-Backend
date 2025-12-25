/**
 * WebSocket Gateway - TEMPORARILY DISABLED
 * 
 * This file has been commented out because MQTT connection is currently disabled.
 * To re-enable:
 * 1. Uncomment all code in this file
 * 2. Uncomment MqttModule and EventsModule imports in app.module.ts
 * 3. Ensure MQTT environment variables are configured
 */

/*
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger, OnModuleInit } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { MqttService, AccidentEventPayload, DeviceTelemetryPayload, MqttMessage } from '../mqtt/mqtt.service';
import { WS_EVENTS } from '../mqtt/mqtt.constants';

/**
 * WebSocket Gateway for Real-time Events
 * 
 * Bridges MQTT events to frontend clients via WebSockets.
 * Handles:
 * - Client connections
 * - Real-time accident alerts
 * - Device telemetry updates
 * - Device status changes
 *\/
@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:8080'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  namespace: '/events',
  transports: ['websocket', 'polling'],
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
  private readonly logger = new Logger(EventsGateway.name);
  private connectedClients = new Map<string, Socket>();

  @WebSocketServer()
  server: Server;

  constructor(private readonly mqttService: MqttService) { }

  /**
   * Subscribe to MQTT events and forward to WebSocket clients
   *\/
  onModuleInit() {
    this.logger.log('🔌 Initializing WebSocket-MQTT bridge...');

    // Forward all MQTT messages to WebSocket clients
    this.mqttService.messages$.subscribe((message: MqttMessage) => {
      this.broadcastDeviceEvent(message);
    });

    // Forward accident alerts with high priority
    this.mqttService.accidents$.subscribe((accident: AccidentEventPayload) => {
      this.broadcastAccidentAlert(accident);
    });

    // Forward telemetry data
    this.mqttService.telemetry$.subscribe((telemetry: DeviceTelemetryPayload) => {
      this.broadcastTelemetry(telemetry);
    });

    this.logger.log('✅ WebSocket-MQTT bridge initialized');
  }

  /**
   * Gateway initialization
   *\/
  afterInit(server: Server) {
    this.logger.log('🌐 WebSocket Gateway initialized');
    this.logger.log(`   Namespace: /events`);
  }

  /**
   * Handle new client connection
   *\/
  handleConnection(client: Socket) {
    const clientId = client.id;
    this.connectedClients.set(clientId, client);

    this.logger.log(`👤 Client connected: ${clientId}`);
    this.logger.log(`   Total clients: ${this.connectedClients.size}`);

    // Send connection confirmation
    client.emit(WS_EVENTS.CONNECTION_STATUS, {
      status: 'connected',
      clientId,
      timestamp: new Date().toISOString(),
      mqttConnected: this.mqttService.connected,
    });
  }

  /**
   * Handle client disconnection
   *\/
  handleDisconnect(client: Socket) {
    const clientId = client.id;
    this.connectedClients.delete(clientId);

    this.logger.log(`👤 Client disconnected: ${clientId}`);
    this.logger.log(`   Total clients: ${this.connectedClients.size}`);
  }

  /**
   * Broadcast device event to all connected clients
   *\/
  private broadcastDeviceEvent(message: MqttMessage) {
    this.server.emit(WS_EVENTS.DEVICE_EVENT, {
      ...message,
      receivedAt: new Date().toISOString(),
    });
  }

  /**
   * Broadcast accident alert to all connected clients
   * This is a high-priority event that should trigger immediate UI updates
   *\/
  private broadcastAccidentAlert(accident: AccidentEventPayload) {
    this.logger.warn(`🚨 Broadcasting accident alert for device: ${accident.deviceId}`);

    this.server.emit(WS_EVENTS.DEVICE_ACCIDENT, {
      type: 'accident',
      priority: 'critical',
      data: accident,
      receivedAt: new Date().toISOString(),
    });
  }

  /**
   * Broadcast telemetry data to all connected clients
   *\/
  private broadcastTelemetry(telemetry: DeviceTelemetryPayload) {
    this.server.emit(WS_EVENTS.DEVICE_TELEMETRY, {
      type: 'telemetry',
      data: telemetry,
      receivedAt: new Date().toISOString(),
    });
  }

  /**
   * Broadcast device status change
   *\/
  broadcastDeviceStatus(deviceId: string, status: 'online' | 'offline') {
    this.server.emit(WS_EVENTS.DEVICE_STATUS, {
      deviceId,
      status,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Broadcast new alert created
   *\/
  broadcastAlertCreated(alert: any) {
    this.server.emit(WS_EVENTS.ALERT_CREATED, {
      type: 'alert_created',
      data: alert,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Send message to specific client
   *\/
  sendToClient(clientId: string, event: string, data: any) {
    const client = this.connectedClients.get(clientId);
    if (client) {
      client.emit(event, data);
    }
  }

  /**
   * Handle client subscribing to specific device updates
   *\/
  @SubscribeMessage('subscribe_device')
  handleSubscribeDevice(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { deviceId: string },
  ) {
    const room = `device:${data.deviceId}`;
    client.join(room);

    this.logger.log(`📥 Client ${client.id} subscribed to device: ${data.deviceId}`);

    return {
      event: 'subscribed',
      data: { deviceId: data.deviceId, room },
    };
  }

  /**
   * Handle client unsubscribing from device updates
   *\/
  @SubscribeMessage('unsubscribe_device')
  handleUnsubscribeDevice(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { deviceId: string },
  ) {
    const room = `device:${data.deviceId}`;
    client.leave(room);

    this.logger.log(`📤 Client ${client.id} unsubscribed from device: ${data.deviceId}`);

    return {
      event: 'unsubscribed',
      data: { deviceId: data.deviceId },
    };
  }

  /**
   * Handle ping from client (keep-alive)
   *\/
  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    return {
      event: 'pong',
      data: { timestamp: new Date().toISOString() },
    };
  }

  /**
   * Get gateway statistics
   *\/
  getStats() {
    return {
      connectedClients: this.connectedClients.size,
      mqttConnected: this.mqttService.connected,
    };
  }
}
*/
