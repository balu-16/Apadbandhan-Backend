import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DeviceLocationsService } from './device-locations.service';
import { CreateDeviceLocationDto, LocationQueryDto } from './dto/device-location.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('device-locations')
@Controller('device-locations')
export class DeviceLocationsController {
  constructor(private readonly locationsService: DeviceLocationsService) {}

  /**
   * Record a new location - This endpoint can be called by AIoT devices
   * Consider making this endpoint public or using API key auth for devices
   */
  @Post()
  @ApiOperation({ summary: 'Record a new device location' })
  create(@Body() createLocationDto: CreateDeviceLocationDto) {
    return this.locationsService.create(createLocationDto);
  }

  /**
   * Record multiple locations in batch - For AIoT sensor data uploads
   */
  @Post('batch')
  @ApiOperation({ summary: 'Record multiple device locations in batch' })
  createBatch(@Body() locations: CreateDeviceLocationDto[]) {
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
