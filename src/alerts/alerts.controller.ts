import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AlertsService } from './alerts.service';
import { CreateAlertDto, UpdateAlertStatusDto } from './dto/create-alert.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('alerts')
@Controller('alerts')
export class AlertsController {
  constructor(
    private readonly alertsService: AlertsService,
    private readonly configService: ConfigService,
  ) { }

  /**
   * Validate API key for IoT device alert creation
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

  @Post()
  @ApiOperation({ summary: 'Create a new alert (from AIoT device, requires API key)' })
  @ApiHeader({ name: 'x-device-api-key', description: 'API key for device authentication', required: true })
  create(
    @Headers('x-device-api-key') apiKey: string,
    @Body() createAlertDto: CreateAlertDto,
  ) {
    this.validateApiKey(apiKey);
    return this.alertsService.create(createAlertDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all alerts' })
  findAll() {
    return this.alertsService.findAll();
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get alert statistics' })
  getStats() {
    return this.alertsService.getStats();
  }

  @Get('device/:deviceId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get alerts for a specific device' })
  findByDevice(@Param('deviceId') deviceId: string) {
    return this.alertsService.findByDevice(deviceId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get alert by ID' })
  findOne(@Param('id') id: string) {
    return this.alertsService.findOne(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update alert status' })
  updateStatus(@Param('id') id: string, @Body() updateDto: UpdateAlertStatusDto) {
    return this.alertsService.updateStatus(id, updateDto);
  }
}
