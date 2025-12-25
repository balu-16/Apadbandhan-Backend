import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AlertDocument = Alert & Document;

/**
 * Alert Location Sub-Schema
 * Stores exact location where alert was triggered
 */
@Schema({ _id: false })
export class AlertLocation {
  @Prop({ type: Number, required: true })
  latitude: number;

  @Prop({ type: Number, required: true })
  longitude: number;

  @Prop({ default: null })
  address: string;

  @Prop({ default: null })
  city: string;

  @Prop({ default: null })
  state: string;

  @Prop({ default: null })
  pincode: string;

  @Prop({ default: null })
  landmark: string;
}

export const AlertLocationSchema = SchemaFactory.createForClass(AlertLocation);

/**
 * Notification Log Sub-Schema
 * Tracks all notifications sent for this alert
 */
@Schema({ _id: false })
export class NotificationLog {
  @Prop({ required: true })
  contactName: string;

  @Prop({ required: true })
  contactPhone: string;

  @Prop({ required: true })
  relation: string;

  @Prop({ default: false })
  smsSent: boolean;

  @Prop({ default: null })
  sentAt: Date;

  @Prop({ default: null })
  deliveredAt: Date;

  @Prop({ default: null })
  failureReason: string;
}

export const NotificationLogSchema = SchemaFactory.createForClass(NotificationLog);

/**
 * Alert Schema - Stores all emergency alerts
 * 
 * Collection: alerts
 * Indexes: deviceId, userId, status, createdAt
 * 
 * Relationships:
 * - belongsTo: Device (via deviceId)
 * - belongsTo: User (via userId)
 */
@Schema({ 
  timestamps: true,
  collection: 'alerts',
  toJSON: {
    virtuals: true,
    transform: (_, ret: any) => {
      ret.id = ret._id;
      delete ret.__v;
      return ret;
    }
  }
})
export class Alert {
  // ==================== ALERT TYPE & STATUS ====================
  @Prop({ 
    default: 'accident', 
    enum: ['accident', 'sos', 'fall_detection', 'impact', 'manual', 'test'],
    index: true
  })
  type: string;

  @Prop({ 
    default: 'pending', 
    enum: ['pending', 'notifying', 'dispatched', 'responding', 'resolved', 'false_alarm', 'cancelled'],
    index: true
  })
  status: string;

  @Prop({ 
    default: 'medium',
    enum: ['low', 'medium', 'high', 'critical']
  })
  severity: string;

  // ==================== LOCATION ====================
  @Prop({ type: AlertLocationSchema, required: true })
  location: AlertLocation;

  // ==================== DEVICE & USER REFERENCES ====================
  @Prop({ 
    type: Types.ObjectId, 
    ref: 'Device', 
    required: true,
    index: true
  })
  deviceId: Types.ObjectId;

  @Prop({ 
    type: Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  })
  userId: Types.ObjectId;

  // ==================== SENSOR DATA ====================
  @Prop({ default: null })
  impactForce: number; // G-force reading

  @Prop({ default: null })
  speed: number; // km/h at time of alert

  @Prop({ default: null })
  sensorData: string; // JSON string of raw sensor readings

  // ==================== NOTIFICATION TRACKING ====================
  @Prop({ type: [NotificationLogSchema], default: [] })
  notificationsSent: NotificationLog[];

  @Prop({ default: 0 })
  notificationCount: number;

  // ==================== RESPONSE TRACKING ====================
  @Prop({ default: null })
  acknowledgedAt: Date;

  @Prop({ default: null })
  acknowledgedBy: string;

  @Prop({ default: null })
  dispatchedAt: Date;

  @Prop({ default: null })
  resolvedAt: Date;

  @Prop({ default: null })
  resolvedBy: string;

  @Prop({ default: null })
  resolutionNotes: string;

  // ==================== METADATA ====================
  @Prop({ default: null })
  notes: string;

  @Prop({ default: null })
  falseAlarmReason: string;
}

export const AlertSchema = SchemaFactory.createForClass(Alert);

// Indexes for efficient queries
AlertSchema.index({ userId: 1, createdAt: -1 });
AlertSchema.index({ deviceId: 1, createdAt: -1 });
AlertSchema.index({ status: 1, createdAt: -1 });
AlertSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });
AlertSchema.index({ createdAt: -1 });
