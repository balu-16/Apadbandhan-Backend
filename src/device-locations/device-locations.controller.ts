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
