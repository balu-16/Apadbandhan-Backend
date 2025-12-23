import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AlertsService } from './alerts.service';
import { CreateAlertDto, UpdateAlertStatusDto } from './dto/create-alert.dto';

@ApiTags('alerts')
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new alert (from AIoT device)' })
  create(@Body() createAlertDto: CreateAlertDto) {
    return this.alertsService.create(createAlertDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all alerts' })
  findAll() {
    return this.alertsService.findAll();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get alert statistics' })
  getStats() {
    return this.alertsService.getStats();
  }

  @Get('device/:deviceId')
  @ApiOperation({ summary: 'Get alerts for a specific device' })
  findByDevice(@Param('deviceId') deviceId: string) {
    return this.alertsService.findByDevice(deviceId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get alert by ID' })
  findOne(@Param('id') id: string) {
    return this.alertsService.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update alert status' })
  updateStatus(@Param('id') id: string, @Body() updateDto: UpdateAlertStatusDto) {
    return this.alertsService.updateStatus(id, updateDto);
  }
}
