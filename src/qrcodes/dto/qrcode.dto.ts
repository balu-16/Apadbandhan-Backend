import { IsString, IsOptional, Length, Matches, IsMongoId } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for creating a new QR code entry
 */
export class CreateQrCodeDto {
  @ApiProperty({ 
    example: '1234567890123456',
    description: 'Unique 16-digit device code'
  })
  @IsString()
  @Length(16, 16, { message: 'Device code must be exactly 16 digits' })
  @Matches(/^\d{16}$/, { message: 'Device code must contain only digits' })
  deviceCode: string;

  @ApiPropertyOptional({ 
    example: 'Apadbandhav Smart Helmet',
    description: 'Human-readable device name'
  })
  @IsOptional()
  @IsString()
  deviceName?: string;
}

/**
 * DTO for uploading QR code image
 */
export class UploadQrImageDto {
  @ApiProperty({ 
    example: '507f1f77bcf86cd799439011',
    description: 'MongoDB ObjectId of the QR code document'
  })
  @IsString()
  @IsMongoId({ message: 'Invalid device ID format' })
  deviceId: string;
}

/**
 * DTO for uploading QR image by device code
 */
export class UploadQrByCodeDto {
  @ApiProperty({ 
    example: '1234567890123456',
    description: '16-digit device code'
  })
  @IsString()
  @Length(16, 16)
  @Matches(/^\d{16}$/)
  deviceCode: string;
}

/**
 * Response DTO for QR code operations
 */
export class QrCodeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  deviceCode: string;

  @ApiProperty()
  deviceName: string;

  @ApiProperty()
  qrImageType: string;

  @ApiProperty()
  imageSize: number;

  @ApiProperty()
  isAssigned: boolean;

  @ApiProperty()
  status: string;

  @ApiProperty()
  createdAt: Date;
}

/**
 * Response DTO for image upload
 */
export class UploadResponseDto {
  @ApiProperty()
  deviceId: string;

  @ApiProperty()
  deviceCode: string;

  @ApiProperty()
  size: number;

  @ApiProperty()
  mimeType: string;

  @ApiProperty()
  message: string;
}

/**
 * DTO for assigning QR code to a user
 */
export class AssignQrCodeDto {
  @ApiProperty({ description: 'Device code to assign' })
  @IsString()
  @Length(16, 16)
  @Matches(/^\d{16}$/)
  deviceCode: string;

  @ApiProperty({ description: 'User ID to assign to' })
  @IsString()
  @IsMongoId()
  userId: string;
}
