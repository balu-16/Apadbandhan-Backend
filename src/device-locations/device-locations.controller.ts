import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Delete,
  UseGuards,
  Headers,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiHeader } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { DeviceLocationsService } from './device-locations.service';
import { CreateDeviceLocationDto, LocationQueryDto } from './dto/device-location.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// Maximum batch size to prevent DoS attacks
const MAX_BATCH_SIZE = 100;

@ApiTags('device-locations')
@Controller('device-locations')
export class DeviceLocationsController {
  constructor(
    private readonly locationsService: DeviceLocationsService,
    private readonly configService: ConfigService,
  ) { }

  /**
   * Validate API key for IoT device endpoints
   */
  private validateApiKey(apiKey: string): void {
    const validApiKey = this.configService.get<string>('DEVICE_API_KEY');
    if (!validApiKey) {
      throw new UnauthorizedException('Device API key not configured on server');
    }
    if (apiKey !== validApiKey) {
      throw new UnauthorizedException('Invalid device API key');
    }
  }

  /**
   * Record a new location - This endpoint is protected by API key for IoT devices
   */
  @Post()
  @ApiOperation({ summary: 'Record a new device location (requires API key)' })
  @ApiHeader({ name: 'x-device-api-key', description: 'API key for device authentication', required: true })
  create(
    @Headers('x-device-api-key') apiKey: string,
    @Body() createLocationDto: CreateDeviceLocationDto,
  ) {
    this.validateApiKey(apiKey);
    return this.locationsService.create(createLocationDto);
  }

  /**
   * Record a new location using device code (16-digit code)
   * This is the preferred endpoint for IoT devices that only know their device code
   */
  @Post('by-code/:deviceCode')
  @ApiOperation({ summary: 'Record a new location using device code (requires API key)' })
  @ApiHeader({ name: 'x-device-api-key', description: 'API key for device authentication', required: true })
  createByDeviceCode(
    @Headers('x-device-api-key') apiKey: string,
    @Param('deviceCode') deviceCode: string,
    @Body() locationData: Omit<CreateDeviceLocationDto, 'deviceId'>,
  ) {
    this.validateApiKey(apiKey);
    return this.locationsService.createByDeviceCode(deviceCode, locationData);
  }

  /**
   * Record multiple locations in batch using device code
   */
  @Post('by-code/:deviceCode/batch')
  @ApiOperation({ summary: 'Record multiple locations using device code (requires API key)' })
  @ApiHeader({ name: 'x-device-api-key', description: 'API key for device authentication', required: true })
  createBatchByDeviceCode(
    @Headers('x-device-api-key') apiKey: string,
    @Param('deviceCode') deviceCode: string,
    @Body() locations: Omit<CreateDeviceLocationDto, 'deviceId'>[],
  ) {
    this.validateApiKey(apiKey);
    if (!Array.isArray(locations) || locations.length === 0) {
      throw new BadRequestException('Locations array is required and cannot be empty');
    }
    if (locations.length > MAX_BATCH_SIZE) {
      throw new BadRequestException(`Batch size exceeds maximum limit of ${MAX_BATCH_SIZE}`);
    }
    return this.locationsService.createBatchByDeviceCode(deviceCode, locations);
  }

  /**
   * Record multiple locations in batch - For AIoT sensor data uploads
   * Protected by API key and limited batch size
   */
  @Post('batch')
  @ApiOperation({ summary: 'Record multiple device locations in batch (requires API key)' })
  @ApiHeader({ name: 'x-device-api-key', description: 'API key for device authentication', required: true })
  createBatch(
    @Headers('x-device-api-key') apiKey: string,
    @Body() locations: CreateDeviceLocationDto[],
  ) {
    this.validateApiKey(apiKey);
    if (!Array.isArray(locations) || locations.length === 0) {
      throw new BadRequestException('Locations array is required and cannot be empty');
    }
    if (locations.length > MAX_BATCH_SIZE) {
      throw new BadRequestException(`Batch size exceeds maximum limit of ${MAX_BATCH_SIZE}`);
    }
    return this.locationsService.createBatch(locations);
  }

  /**
   * Record a new location from browser (JWT protected)
   * This endpoint is for web app users to update their device locations
   */
  @Post('browser')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Record a new device location from browser (requires JWT)' })
  createFromBrowser(@Body() createLocationDto: CreateDeviceLocationDto) {
    return this.locationsService.create(createLocationDto);
  }

  /**
   * Get all locations for a device
   */
  @Get('device/:deviceId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all locations for a device' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'skip', required: false })
  findByDevice(
    @Param('deviceId') deviceId: string,
    @Query() query: LocationQueryDto,
  ) {
    return this.locationsService.findByDevice(deviceId, query);
  }

  /**
   * Get the latest location for a device
   */
  @Get('device/:deviceId/latest')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the latest location for a device' })
  findLatest(@Param('deviceId') deviceId: string) {
    return this.locationsService.findLatest(deviceId);
  }

  /**
   * Get location statistics for a device
   */
  @Get('device/:deviceId/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get location statistics for a device' })
  getStats(@Param('deviceId') deviceId: string) {
    return this.locationsService.getStats(deviceId);
  }

  /**
   * Get a specific location by ID
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a location by ID' })
  findOne(@Param('id') id: string) {
    return this.locationsService.findOne(id);
  }

  /**
   * Delete all locations for a device
   */
  @Delete('device/:deviceId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete all locations for a device' })
  deleteByDevice(@Param('deviceId') deviceId: string) {
    return this.locationsService.deleteByDevice(deviceId);
  }
}
