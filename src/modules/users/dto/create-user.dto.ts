import { IsString, IsEmail, IsOptional, IsBoolean, IsIn, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export type UserRole = 'user' | 'admin' | 'superadmin';

export class CreateUserDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  fullName: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '9876543210' })
  @IsString()
  phone: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  profilePhoto?: string;

  @ApiPropertyOptional({ enum: ['user', 'admin', 'superadmin'], default: 'user' })
  @IsOptional()
  @IsEnum(['user', 'admin', 'superadmin'])
  role?: UserRole;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '9876543210' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  profilePhoto?: string;

  @ApiPropertyOptional({ enum: ['government', 'private'] })
  @IsOptional()
  @IsIn(['government', 'private'])
  hospitalPreference?: 'government' | 'private';

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  accidentAlerts?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  smsNotifications?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  locationTracking?: boolean;

  @ApiPropertyOptional({ enum: ['user', 'admin', 'superadmin'] })
  @IsOptional()
  @IsEnum(['user', 'admin', 'superadmin'])
  role?: UserRole;
}
