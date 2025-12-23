import { Injectable, Logger, OnModuleInit, OnModuleDestroy, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Subscription } from 'rxjs';
import { MqttService, AccidentEventPayload, DeviceTelemetryPayload, MqttMessage } from './mqtt.service';
import { MqttEvent, MqttEventDocument } from './schemas/mqtt-event.schema';
import { EventsGateway } from '../events/events.gateway';
import { MqttEventType } from './mqtt.constants';
import { AlertsService } from '../modules/alerts/alerts.service';
import { DevicesService } from '../modules/devices/devices.service';
import { DeviceLocationsService } from '../modules/device-locations/device-locations.service';
import { LocationSource } from '../modules/device-locations/dto/device-location.dto';

/**
 * MQTT Events Service
 * 
 * Handles processing and storage of MQTT events from IoT devices.
 * Integrates with:
 * - MongoDB for event persistence
 * - Alerts service for accident notifications
 * - WebSocket gateway for real-time updates
 */
@Injectable()
export class MqttEventsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MqttEventsService.name);
  
  // Track subscriptions for cleanup
  private subscriptions: Subscription[] = [];

  constructor(
    @InjectModel(MqttEvent.name)
    private mqttEventModel: Model<MqttEventDocument>,
    private mqttService: MqttService,
    @Inject(forwardRef(() => EventsGateway))
    private eventsGateway: EventsGateway,
    @Inject(forwardRef(() => AlertsService))
    private alertsService: AlertsService,
    @Inject(forwardRef(() => DevicesService))
    private devicesService: DevicesService,
    @Inject(forwardRef(() => DeviceLocationsService))
    private deviceLocationsService: DeviceLocationsService,
  ) {}

  /**
   * Subscribe to MQTT events on module initialization
   */
  onModuleInit() {
    this.logger.log('🔌 Initializing MQTT Events processing...');
    this.subscribeToEvents();
  }

  /**
   * Cleanup subscriptions on module destroy to prevent memory leaks
   */
  onModuleDestroy() {
    this.logger.log('🔌 Shutting down MQTT Events processing...');
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  /**
   * Subscribe to MQTT message streams
   */
  private subscribeToEvents() {
    // Handle all MQTT messages (excluding accidents to prevent duplicate processing)
    const messagesSub = this.mqttService.messages$.subscribe(async (message: MqttMessage) => {
      try {
        // Skip accident messages here - they're handled by accidents$ subscriber
        if (message.eventType === MqttEventType.ACCIDENT) {
          return;
        }
        await this.processMessage(message);
      } catch (error) {
        this.logger.error(`Failed to process message: ${error.message}`);
      }
    });
    this.subscriptions.push(messagesSub);

    // Handle accident events with priority
    const accidentsSub = this.mqttService.accidents$.subscribe(async (accident: AccidentEventPayload) => {
      try {
        await this.processAccident(accident);
      } catch (error) {
        this.logger.error(`Failed to process accident: ${error.message}`);
      }
    });
    this.subscriptions.push(accidentsSub);

    // Handle telemetry data
    const telemetrySub = this.mqttService.telemetry$.subscribe(async (telemetry: DeviceTelemetryPayload) => {
      try {
        await this.processTelemetry(telemetry);
      } catch (error) {
        this.logger.error(`Failed to process telemetry: ${error.message}`);
      }
    });
    this.subscriptions.push(telemetrySub);

    // Handle parse errors
    const errorsSub = this.mqttService.errors$.subscribe(async (error) => {
      this.logger.error(`MQTT parse error on ${error.topic}: ${error.error.message}`);
      // Could store errors in DB for monitoring if needed
    });
    this.subscriptions.push(errorsSub);

    this.logger.log('✅ MQTT Events processing initialized');
  }

  /**
   * Process generic MQTT message
   */
  private async processMessage(message: MqttMessage): Promise<void> {
    this.logger.debug(`Processing message from device: ${message.deviceId}`);
    
    // Store event in database
    await this.storeEvent({
      deviceId: message.deviceId,
      eventType: message.eventType,
      topic: message.topic,
      location: message.payload.location || null,
      speed: message.payload.speed,
      impact: message.payload.impact,
      batteryLevel: message.payload.batteryLevel,
      signalStrength: message.payload.signalStrength,
      rawPayload: message.payload,
      deviceTimestamp: new Date(message.payload.timestamp || message.timestamp),
    });
  }

  /**
   * Process accident event - High Priority
   */
  private async processAccident(accident: AccidentEventPayload): Promise<void> {
    this.logger.warn(`🚨 Processing ACCIDENT from device: ${accident.deviceId}`);
    this.logger.warn(`   Location: ${accident.location.lat}, ${accident.location.lng}`);
    this.logger.warn(`   Impact: ${accident.impact}`);
    this.logger.warn(`   Speed: ${accident.speed} km/h`);

    // Determine severity based on impact
    const severity = this.calculateSeverity(accident.impact, accident.speed);

    // Store accident event
    const event = await this.storeEvent({
      deviceId: accident.deviceId,
      eventType: MqttEventType.ACCIDENT,
      topic: `devices/${accident.deviceId}/accident`,
      location: accident.location,
      speed: accident.speed,
      impact: accident.impact,
      severity,
      sensorData: accident.sensorData,
      rawPayload: accident,
      deviceTimestamp: new Date(accident.timestamp),
    });

    // Trigger emergency alert workflow
    await this.triggerEmergencyAlert(accident, severity, event._id);

    this.logger.warn(`✅ Accident processed and alert triggered for device: ${accident.deviceId}`);
  }

  /**
   * Process telemetry data
   */
  private async processTelemetry(telemetry: DeviceTelemetryPayload): Promise<void> {
    this.logger.debug(`Processing telemetry from device: ${telemetry.deviceId}`);

    // Store telemetry event
    await this.storeEvent({
      deviceId: telemetry.deviceId,
      eventType: MqttEventType.TELEMETRY,
      topic: `devices/${telemetry.deviceId}/telemetry`,
      location: telemetry.location,
      speed: telemetry.speed,
      heading: telemetry.heading,
      batteryLevel: telemetry.batteryLevel,
      signalStrength: telemetry.signalStrength,
      rawPayload: telemetry,
      deviceTimestamp: new Date(telemetry.timestamp),
    });

    // Update device location in devices collection
    await this.updateDeviceLocation(telemetry);
  }

  /**
   * Store event in MongoDB
   */
  private async storeEvent(eventData: Partial<MqttEvent>): Promise<MqttEventDocument> {
    const event = new this.mqttEventModel(eventData);
    return event.save();
  }

  /**
   * Calculate accident severity based on impact and speed
   */
  private calculateSeverity(impact: number, speed: number): 'low' | 'medium' | 'high' | 'critical' {
    const severityScore = (impact * 0.6) + (speed / 100 * 0.4);
    
    if (severityScore >= 8) return 'critical';
    if (severityScore >= 5) return 'high';
    if (severityScore >= 3) return 'medium';
    return 'low';
  }

  /**
   * Trigger emergency alert workflow
   */
  private async triggerEmergencyAlert(
    accident: AccidentEventPayload,
    severity: string,
    eventId: Types.ObjectId,
  ): Promise<void> {
    try {
      // 1. Create alert in database using AlertsService
      const alert = await this.alertsService.create({
        deviceCode: accident.deviceId,
        type: 'accident',
        severity: severity as 'low' | 'medium' | 'high' | 'critical',
        latitude: accident.location.lat,
        longitude: accident.location.lng,
        speed: accident.speed,
        impactForce: accident.impact,
      });

      // 2. Update MQTT event with alert reference
      await this.mqttEventModel.findByIdAndUpdate(eventId, {
        alertId: alert._id,
        processed: true,
      });

      // 3. Prepare alert data for WebSocket broadcast
      const alertData = {
        alertId: alert._id.toString(),
        deviceId: accident.deviceId,
        type: 'accident',
        severity,
        location: accident.location,
        speed: accident.speed,
        impact: accident.impact,
        timestamp: accident.timestamp,
        eventId: eventId.toString(),
        status: 'pending',
      };

      // 4. Broadcast to all connected WebSocket clients
      this.eventsGateway.broadcastAlertCreated(alertData);

      this.logger.log(`✅ Alert created and broadcasted: ${alert._id}`);
    } catch (error) {
      this.logger.error(`❌ Failed to create alert: ${error.message}`);
      
      // Still broadcast to WebSocket even if DB save fails
      this.eventsGateway.broadcastAlertCreated({
        deviceId: accident.deviceId,
        type: 'accident',
        severity,
        location: accident.location,
        timestamp: accident.timestamp,
        error: 'Failed to persist alert',
      });
    }
  }

  /**
   * Update device location from telemetry
   */
  private async updateDeviceLocation(telemetry: DeviceTelemetryPayload): Promise<void> {
    try {
      // 1. Store location in device_locations collection
      await this.deviceLocationsService.create({
        deviceId: telemetry.deviceId,
        latitude: telemetry.location.lat,
        longitude: telemetry.location.lng,
        altitude: telemetry.altitude,
        speed: telemetry.speed,
        heading: telemetry.heading,
        source: LocationSource.SENSOR,
      });

      // 2. Find device by code and update its current location
      const device = await this.devicesService.findByCode(telemetry.deviceId);
      if (device) {
        await this.devicesService.updateLocation(device._id.toString(), {
          latitude: telemetry.location.lat,
          longitude: telemetry.location.lng,
        });
      }

      // 3. Broadcast device status update
      this.eventsGateway.broadcastDeviceStatus(telemetry.deviceId, 'online');
    } catch (error) {
      this.logger.error(`❌ Failed to update device location: ${error.message}`);
    }
  }

  /**
   * Get events by device ID
   */
  async getEventsByDevice(
    deviceId: string,
    options?: {
      eventType?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      skip?: number;
    },
  ): Promise<MqttEventDocument[]> {
    const query: any = { deviceId };

    if (options?.eventType) {
      query.eventType = options.eventType;
    }

    if (options?.startDate || options?.endDate) {
      query.createdAt = {};
      if (options.startDate) query.createdAt.$gte = options.startDate;
      if (options.endDate) query.createdAt.$lte = options.endDate;
    }

    return this.mqttEventModel
      .find(query)
      .sort({ createdAt: -1 })
      .skip(options?.skip || 0)
      .limit(options?.limit || 100)
      .exec();
  }

  /**
   * Get recent accidents
   */
  async getRecentAccidents(limit: number = 10): Promise<MqttEventDocument[]> {
    return this.mqttEventModel
      .find({ eventType: MqttEventType.ACCIDENT })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  /**
   * Get event statistics
   */
  async getStats(): Promise<{
    totalEvents: number;
    accidents: number;
    telemetryCount: number;
    deviceCount: number;
  }> {
    const [totalEvents, accidents, telemetryCount, deviceCount] = await Promise.all([
      this.mqttEventModel.countDocuments(),
      this.mqttEventModel.countDocuments({ eventType: MqttEventType.ACCIDENT }),
      this.mqttEventModel.countDocuments({ eventType: MqttEventType.TELEMETRY }),
      this.mqttEventModel.distinct('deviceId').then(ids => ids.length),
    ]);

    return { totalEvents, accidents, telemetryCount, deviceCount };
  }
}
