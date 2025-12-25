import { IsString, IsOptional, IsArray, ValidateNested, IsNumber, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum DeviceStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  MAINTENANCE = 'maintenance',
}

export class EmergencyContactDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Father' })
  @IsString()
  relation: string;

  @ApiProperty({ example: '9876543210' })
  @IsString()
  phone: string;
}

export class CreateDeviceDto {
  @ApiProperty({ example: 'My Car' })
  @IsString()
  name: string;

  @ApiProperty({ example: '1234567890123456' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ example: 'Vehicle' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ type: [EmergencyContactDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmergencyContactDto)
  emergencyContacts?: EmergencyContactDto[];

  @ApiPropertyOptional({ example: 'HLTH-2024-001234' })
  @IsOptional()
  @IsString()
  healthInsurance?: string;

  @ApiPropertyOptional({ example: 'VEH-2024-005678' })
  @IsOptional()
  @IsString()
  vehicleInsurance?: string;

  @ApiPropertyOptional({ example: 'TERM-2024-009012' })
  @IsOptional()
  @IsString()
  termInsurance?: string;
}

export class UpdateDeviceDto {
  @ApiPropertyOptional({ example: 'My Car' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Vehicle' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ enum: DeviceStatus, example: 'online' })
  @IsOptional()
  @IsEnum(DeviceStatus)
  status?: DeviceStatus;

  @ApiPropertyOptional({ type: [EmergencyContactDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmergencyContactDto)
  emergencyContacts?: EmergencyContactDto[];

  @ApiPropertyOptional({ example: 'HLTH-2024-001234' })
  @IsOptional()
  @IsString()
  healthInsurance?: string;

  @ApiPropertyOptional({ example: 'VEH-2024-005678' })
  @IsOptional()
  @IsString()
  vehicleInsurance?: string;

  @ApiPropertyOptional({ example: 'TERM-2024-009012' })
  @IsOptional()
  @IsString()
  termInsurance?: string;
}

export class UpdateDeviceLocationDto {
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
}
