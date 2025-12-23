import { IsString, IsNumber, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAlertDto {
  @ApiProperty({ example: '1234567890123456' })
  @IsString()
  deviceCode: string;

  @ApiProperty({ example: 28.6139 })
  @IsNumber()
  latitude: number;

  @ApiProperty({ example: 77.2090 })
  @IsNumber()
  longitude: number;

  @ApiPropertyOptional({ example: 'Connaught Place, New Delhi' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ enum: ['accident', 'sos', 'fall_detection', 'impact', 'manual', 'test'] })
  @IsOptional()
  @IsIn(['accident', 'sos', 'fall_detection', 'impact', 'manual', 'test'])
  type?: 'accident' | 'sos' | 'fall_detection' | 'impact' | 'manual' | 'test';

  @ApiPropertyOptional({ enum: ['low', 'medium', 'high', 'critical'] })
  @IsOptional()
  @IsIn(['low', 'medium', 'high', 'critical'])
  severity?: 'low' | 'medium' | 'high' | 'critical';

  @ApiPropertyOptional({ example: 45.5, description: 'Speed at time of alert (km/h)' })
  @IsOptional()
  @IsNumber()
  speed?: number;

  @ApiPropertyOptional({ example: 5.2, description: 'Impact force (G-force)' })
  @IsOptional()
  @IsNumber()
  impactForce?: number;

  @ApiPropertyOptional({ description: 'Raw sensor data as JSON string' })
  @IsOptional()
  @IsString()
  sensorData?: string;
}

export class UpdateAlertStatusDto {
  @ApiProperty({ enum: ['pending', 'dispatched', 'resolved', 'false_alarm'] })
  @IsIn(['pending', 'dispatched', 'resolved', 'false_alarm'])
  status: 'pending' | 'dispatched' | 'resolved' | 'false_alarm';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
