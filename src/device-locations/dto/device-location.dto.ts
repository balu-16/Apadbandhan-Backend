import { IsString, IsOptional, IsNumber, IsEnum, IsDateString, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum LocationSource {
  GPS = 'gps',
  NETWORK = 'network',
  MANUAL = 'manual',
  SENSOR = 'sensor',
}

export class CreateDeviceLocationDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsString()
  deviceId: string;

  @ApiProperty({ example: 28.6139 })
  @IsNumber()
  latitude: number;

  @ApiProperty({ example: 77.2090 })
  @IsNumber()
  longitude: number;

  @ApiPropertyOptional({ example: 216 })
  @IsOptional()
  @IsNumber()
  altitude?: number;

  @ApiPropertyOptional({ example: 45.5 })
  @IsOptional()
  @IsNumber()
  speed?: number;

  @ApiPropertyOptional({ example: 180 })
  @IsOptional()
  @IsNumber()
  heading?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  accuracy?: number;

  @ApiPropertyOptional({ example: 'Connaught Place, New Delhi' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'New Delhi' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'Delhi' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: '110001' })
  @IsOptional()
  @IsString()
  pincode?: string;

  @ApiPropertyOptional({ example: 'India' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ example: '2024-01-15T10:30:00Z' })
  @IsOptional()
  @IsDateString()
  recordedAt?: string;

  @ApiPropertyOptional({ enum: LocationSource, example: 'gps' })
  @IsOptional()
  @IsEnum(LocationSource)
  source?: LocationSource;

  @ApiPropertyOptional({ example: { batteryLevel: 85, signalStrength: -65 } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class LocationQueryDto {
  @ApiPropertyOptional({ example: '2024-01-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2024-01-31T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  limit?: string | number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  skip?: string | number;
}

export class DeviceLocationResponseDto {
  id: string;
  deviceId: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  recordedAt: Date;
  source: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
