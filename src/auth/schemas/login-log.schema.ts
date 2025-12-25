import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// ==================== USER LOGIN LOG ====================
export type UserLoginLogDocument = UserLoginLog & Document;

@Schema({
  timestamps: true,
  collection: 'user_login_logs',
  toJSON: {
    virtuals: true,
    transform: (_, ret: any) => {
      ret.id = ret._id;
      delete ret.__v;
      return ret;
    }
  }
})
export class UserLoginLog {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  phone: string;

  @Prop({ default: null })
  email: string;

  @Prop({ default: null })
  fullName: string;

  @Prop({ default: null })
  ipAddress: string;

  @Prop({ default: null })
  userAgent: string;

  @Prop({ default: null })
  deviceInfo: string;

  @Prop({ default: 'otp' })
  loginMethod: string;

  @Prop({ default: true })
  success: boolean;

  @Prop({ default: null })
  failureReason: string;

  @Prop({ default: Date.now })
  loginAt: Date;
}

export const UserLoginLogSchema = SchemaFactory.createForClass(UserLoginLog);
UserLoginLogSchema.index({ userId: 1, loginAt: -1 });
UserLoginLogSchema.index({ phone: 1 });

// ==================== ADMIN LOGIN LOG ====================
export type AdminLoginLogDocument = AdminLoginLog & Document;

@Schema({
  timestamps: true,
  collection: 'admin_login_logs',
  toJSON: {
    virtuals: true,
    transform: (_, ret: any) => {
      ret.id = ret._id;
      delete ret.__v;
      return ret;
    }
  }
})
export class AdminLoginLog {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  phone: string;

  @Prop({ default: null })
  email: string;

  @Prop({ default: null })
  fullName: string;

  @Prop({ default: null })
  ipAddress: string;

  @Prop({ default: null })
  userAgent: string;

  @Prop({ default: null })
  deviceInfo: string;

  @Prop({ default: 'otp' })
  loginMethod: string;

  @Prop({ default: true })
  success: boolean;

  @Prop({ default: null })
  failureReason: string;

  @Prop({ default: Date.now })
  loginAt: Date;
}

export const AdminLoginLogSchema = SchemaFactory.createForClass(AdminLoginLog);
AdminLoginLogSchema.index({ userId: 1, loginAt: -1 });
AdminLoginLogSchema.index({ phone: 1 });

// ==================== SUPERADMIN LOGIN LOG ====================
export type SuperadminLoginLogDocument = SuperadminLoginLog & Document;

@Schema({
  timestamps: true,
  collection: 'superadmin_login_logs',
  toJSON: {
    virtuals: true,
    transform: (_, ret: any) => {
      ret.id = ret._id;
      delete ret.__v;
      return ret;
    }
  }
})
export class SuperadminLoginLog {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  phone: string;

  @Prop({ default: null })
  email: string;

  @Prop({ default: null })
  fullName: string;

  @Prop({ default: null })
  ipAddress: string;

  @Prop({ default: null })
  userAgent: string;

  @Prop({ default: null })
  deviceInfo: string;

  @Prop({ default: 'otp' })
  loginMethod: string;

  @Prop({ default: true })
  success: boolean;

  @Prop({ default: null })
  failureReason: string;

  @Prop({ default: Date.now })
  loginAt: Date;
}

export const SuperadminLoginLogSchema = SchemaFactory.createForClass(SuperadminLoginLog);
SuperadminLoginLogSchema.index({ userId: 1, loginAt: -1 });
SuperadminLoginLogSchema.index({ phone: 1 });

