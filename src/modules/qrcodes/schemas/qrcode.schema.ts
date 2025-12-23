import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type QrCodeDocument = QrCode & Document;

/**
 * QrCode Schema - Stores device QR codes with images
 * 
 * Collection: qrcodes
 * 
 * This collection stores pre-generated QR codes that can be
 * assigned to devices during registration. Each QR code has
 * a unique 16-digit code and stores the QR image as a Buffer.
 */
@Schema({ 
  timestamps: true,
  collection: 'qrcodes',
  toJSON: {
    virtuals: true,
    transform: (_, ret: any) => {
      ret.id = ret._id;
      delete ret.__v;
      // Don't send buffer in JSON responses
      delete ret.qrImage;
      return ret;
    }
  }
})
export class QrCode {
  /**
   * Unique 16-digit device code
   * Format: 16 numeric digits (e.g., "1234567890123456")
   */
  @Prop({ 
    required: true, 
    unique: true,
    minlength: 16,
    maxlength: 16
  })
  deviceCode: string;

  /**
   * Human-readable device name/label
   */
  @Prop({ 
    required: true,
    trim: true,
    default: 'Apadbandhav Device'
  })
  deviceName: string;

  /**
   * QR code image stored as binary Buffer
   * Max size: 16MB (MongoDB document limit consideration)
   */
  @Prop({ 
    type: Buffer,
    required: true
  })
  qrImage: Buffer;

  /**
   * MIME type of the stored image
   * Allowed: image/png, image/jpeg
   */
  @Prop({ 
    required: true,
    enum: ['image/png', 'image/jpeg', 'image/jpg']
  })
  qrImageType: string;

  /**
   * Size of the image in bytes
   */
  @Prop({ default: 0 })
  imageSize: number;

  /**
   * Whether this QR code has been assigned to a user's device
   */
  @Prop({ default: false })
  isAssigned: boolean;

  /**
   * User ID if assigned (null if not assigned)
   */
  @Prop({ default: null })
  assignedToUserId: string;

  /**
   * Date when QR code was assigned to a device
   */
  @Prop({ default: null })
  assignedAt: Date;

  /**
   * Status of the QR code
   */
  @Prop({ 
    default: 'available',
    enum: ['available', 'assigned', 'disabled']
  })
  status: string;
}

export const QrCodeSchema = SchemaFactory.createForClass(QrCode);

// Indexes for efficient queries (deviceCode index created by unique: true)
QrCodeSchema.index({ isAssigned: 1, status: 1 });
QrCodeSchema.index({ createdAt: -1 });
