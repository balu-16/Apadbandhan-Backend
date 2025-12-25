import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DeviceDocument = Device & Document;

/**
 * Emergency Contact Sub-Schema
 * Embedded within Device document
 * Stores family members who will be notified during emergencies
 */
@Schema({ _id: false })
export class EmergencyContact {
  @Prop({ 
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  })
  name: string;

  @Prop({ 
    required: true,
    enum: ['Father', 'Mother', 'Brother', 'Sister', 'Spouse', 'Son', 'Daughter', 'Friend', 'Other']
  })
  relation: string;

  @Prop({ 
    required: true,
    minlength: 10,
    maxlength: 15
  })
  phone: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const EmergencyContactSchema = SchemaFactory.createForClass(EmergencyContact);

/**
 * Insurance Details Sub-Schema
 * Embedded within Device document
 * Stores insurance policy information for quick access during emergencies
 */
@Schema({ _id: false })
export class InsuranceDetails {
  @Prop({ default: null })
  healthInsuranceNumber: string;

  @Prop({ default: null })
  healthInsuranceProvider: string;

  @Prop({ default: null })
  vehicleInsuranceNumber: string;

  @Prop({ default: null })
  vehicleInsuranceProvider: string;

  @Prop({ default: null })
  termInsuranceNumber: string;

  @Prop({ default: null })
  termInsuranceProvider: string;
}

export const InsuranceDetailsSchema = SchemaFactory.createForClass(InsuranceDetails);

/**
 * Location Sub-Schema
 * Stores GPS coordinates and address information
 */
@Schema({ _id: false })
export class Location {
  @Prop({ type: Number, default: null })
  latitude: number;

  @Prop({ type: Number, default: null })
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
  lastUpdatedAt: Date;
}

export const LocationSchema = SchemaFactory.createForClass(Location);

/**
 * Device Schema - Main collection for AIoT devices
 * 
 * Collection: devices
 * Indexes: code (unique), userId, status
 * 
 * Relationships:
 * - belongsTo: User (via userId)
 * - hasMany: Alerts (via deviceId in alerts collection)
 */
@Schema({ 
  timestamps: true,
  collection: 'devices',
  toJSON: {
    virtuals: true,
    transform: (_, ret: any) => {
      ret.id = ret._id;
      delete ret.__v;
      return ret;
    }
  }
})
export class Device {
  // ==================== DEVICE IDENTIFICATION ====================
  @Prop({ 
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  })
  name: string;

  @Prop({ 
    required: true, 
    unique: true,
    minlength: 16,
    maxlength: 16
  })
  code: string; // 16-digit QR code scanned from device

  @Prop({ 
    default: 'Vehicle',
    enum: ['Vehicle', 'Bike', 'Car', 'Truck', 'Smart Helmet', 'Wearable', 'Other']
  })
  type: string;

  // ==================== DEVICE STATUS ====================
  @Prop({ 
    default: 'offline', 
    enum: ['online', 'offline', 'maintenance']
  })
  status: string;

  @Prop({ default: null })
  lastOnlineAt: Date;

  @Prop({ default: 0 })
  batteryLevel: number;

  @Prop({ default: null })
  firmwareVersion: string;

  // ==================== LOCATION DATA ====================
  @Prop({ type: LocationSchema, default: () => ({}) })
  location: Location;

  // ==================== EMERGENCY CONTACTS ====================
  @Prop({ 
    type: [EmergencyContactSchema], 
    default: []
  })
  emergencyContacts: EmergencyContact[];

  // ==================== INSURANCE INFORMATION ====================
  @Prop({ type: InsuranceDetailsSchema, default: () => ({}) })
  insurance: InsuranceDetails;

  // ==================== OWNER REFERENCE ====================
  @Prop({ 
    type: Types.ObjectId, 
    ref: 'User', 
    required: true
  })
  userId: Types.ObjectId;

  // ==================== METADATA ====================
  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: null })
  registeredAt: Date;

  @Prop({ default: null })
  notes: string;
}

export const DeviceSchema = SchemaFactory.createForClass(Device);

// Compound indexes for efficient queries (code index created by unique: true)
DeviceSchema.index({ userId: 1, status: 1 });
DeviceSchema.index({ userId: 1, createdAt: -1 });
DeviceSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });
