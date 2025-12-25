import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

/**
 * User Schema - Stores all user account information
 * 
 * Collections: users
 * Indexes: phone (unique), email (unique)
*/
@Schema({ 
  timestamps: true,
  collection: 'users',
  toJSON: {
    virtuals: true,
    transform: (_, ret: any) => {
      ret.id = ret._id;
      delete ret.__v;
      return ret;
    }
  }
})
export class User {
  // ==================== BASIC INFO ====================
  @Prop({ 
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  })
  fullName: string;

  @Prop({ 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  })
  email: string;

  @Prop({ 
    required: true, 
    unique: true,
    match: /^[6-9]\d{9}$/,
    index: true
  })
  phone: string;

  @Prop({ default: null })
  profilePhoto: string;

  // ==================== PREFERENCES ====================
  @Prop({ default: null })
  hospitalPreference: string;

  @Prop({ default: true })
  accidentAlerts: boolean;

  @Prop({ default: true })
  smsNotifications: boolean;

  @Prop({ default: true })
  locationTracking: boolean;

  // ==================== ROLE ====================
  @Prop({ 
    type: String,
    enum: ['user', 'admin', 'superadmin'],
    default: 'user'
  })
  role: 'user' | 'admin' | 'superadmin';

  // ==================== ACCOUNT STATUS ====================
  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ default: null })
  lastLoginAt: Date;

  @Prop({ default: null })
  lastLoginIp: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Indexes for faster queries
UserSchema.index({ email: 1 });
UserSchema.index({ createdAt: -1 });
