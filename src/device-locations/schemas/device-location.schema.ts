import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type DeviceLocationDocument = DeviceLocation & Document;

@Schema({
  timestamps: true,
  collection: 'device_locations',
  toJSON: {
    virtuals: true,
    transform: (_, ret: any) => {
      ret.id = ret._id.toString();
      delete ret.__v;
      return ret;
    },
  },
})
export class DeviceLocation {
  @Prop({ 
    type: MongooseSchema.Types.ObjectId, 
    ref: 'Device', 
    required: true,
    index: true 
  })
  deviceId: Types.ObjectId;

  @Prop({ required: true })
  latitude: number;

  @Prop({ required: true })
  longitude: number;

  @Prop()
  altitude?: number;

  @Prop()
  speed?: number; // in km/h

  @Prop()
  heading?: number; // direction in degrees (0-360)

  @Prop()
  accuracy?: number; // GPS accuracy in meters

  @Prop()
  address?: string;

  @Prop()
  city?: string;

  @Prop()
  state?: string;

  @Prop()
  pincode?: string;

  @Prop()
  country?: string;

  @Prop({ default: Date.now })
  recordedAt: Date;

  @Prop({ 
    type: String, 
    enum: ['gps', 'network', 'manual', 'sensor', 'browser'],
    default: 'gps'
  })
  source: string;

  @Prop({ type: Object })
  metadata?: Record<string, any>; // Additional sensor data
}

export const DeviceLocationSchema = SchemaFactory.createForClass(DeviceLocation);

// Compound indexes for efficient querying
DeviceLocationSchema.index({ deviceId: 1, recordedAt: -1 });
DeviceLocationSchema.index({ deviceId: 1, createdAt: -1 });
DeviceLocationSchema.index({ latitude: 1, longitude: 1 });

// TTL index to automatically delete old location data after 90 days (optional)
// DeviceLocationSchema.index({ recordedAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
