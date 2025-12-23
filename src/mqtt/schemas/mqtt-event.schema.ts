import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type MqttEventDocument = MqttEvent & Document;

/**
 * Location sub-schema
 */
@Schema({ _id: false })
export class EventLocation {
  @Prop({ required: true })
  lat: number;

  @Prop({ required: true })
  lng: number;

  @Prop()
  altitude?: number;

  @Prop()
  address?: string;
}

/**
 * Sensor data sub-schema
 */
@Schema({ _id: false })
export class SensorData {
  @Prop({ type: Object })
  accelerometer?: { x: number; y: number; z: number };

  @Prop({ type: Object })
  gyroscope?: { x: number; y: number; z: number };

  @Prop()
  temperature?: number;

  @Prop()
  humidity?: number;
}

/**
 * MQTT Event Schema
 * 
 * Stores all MQTT events from IoT devices including:
 * - Accident events
 * - Telemetry data
 * - Health checks
 * - Status updates
 */
@Schema({
  timestamps: true,
  collection: 'mqtt_events',
  toJSON: {
    virtuals: true,
    transform: (_, ret: any) => {
      ret.id = ret._id.toString();
      delete ret.__v;
      return ret;
    },
  },
})
export class MqttEvent {
  @Prop({ required: true, index: true })
  deviceId: string;

  @Prop({ 
    type: MongooseSchema.Types.ObjectId, 
    ref: 'Device',
    index: true 
  })
  deviceObjectId?: Types.ObjectId;

  @Prop({ 
    type: String, 
    enum: ['accident', 'telemetry', 'health', 'status', 'alert'],
    required: true,
    index: true
  })
  eventType: string;

  @Prop({ required: true })
  topic: string;

  @Prop({ type: EventLocation, required: true })
  location: EventLocation;

  @Prop()
  speed?: number;

  @Prop()
  heading?: number;

  @Prop()
  impact?: number;

  @Prop({ 
    type: String, 
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  })
  severity?: string;

  @Prop()
  batteryLevel?: number;

  @Prop()
  signalStrength?: number;

  @Prop({ type: SensorData })
  sensorData?: SensorData;

  @Prop({ type: Object })
  rawPayload?: Record<string, any>;

  @Prop({ required: true })
  deviceTimestamp: Date;

  @Prop({ default: false })
  processed: boolean;

  @Prop({ 
    type: MongooseSchema.Types.ObjectId, 
    ref: 'Alert' 
  })
  alertId?: Types.ObjectId;
}

export const MqttEventSchema = SchemaFactory.createForClass(MqttEvent);

// Indexes for efficient querying
MqttEventSchema.index({ deviceId: 1, eventType: 1, createdAt: -1 });
MqttEventSchema.index({ eventType: 1, createdAt: -1 });
MqttEventSchema.index({ createdAt: -1 });

// TTL index to auto-delete old telemetry data after 30 days
// MqttEventSchema.index(
//   { createdAt: 1 }, 
//   { expireAfterSeconds: 30 * 24 * 60 * 60, partialFilterExpression: { eventType: 'telemetry' } }
// );
