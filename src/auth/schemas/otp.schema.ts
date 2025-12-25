import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OtpDocument = Otp & Document;

/**
 * OTP Schema - Stores One-Time Passwords for authentication
 * 
 * Collection: otps
 * Indexes: phone, expiresAt (TTL)
 * 
 * Note: Documents are automatically deleted after expiration via TTL index
 */
@Schema({ 
  timestamps: true,
  collection: 'otps'
})
export class Otp {
  @Prop({ 
    required: true,
    index: true,
    match: /^[6-9]\d{9}$/
  })
  phone: string;

  @Prop({ 
    required: true,
    match: /^\d{6}$/  // 6-digit OTP
  })
  otp: string;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ default: false })
  verified: boolean;

  @Prop({ default: 0 })
  attempts: number;

  @Prop({ default: null })
  verifiedAt: Date;

  @Prop({ default: null })
  ipAddress: string;
}

export const OtpSchema = SchemaFactory.createForClass(Otp);

// TTL index - automatically delete expired OTPs
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for faster lookups
OtpSchema.index({ phone: 1, verified: 1 });
