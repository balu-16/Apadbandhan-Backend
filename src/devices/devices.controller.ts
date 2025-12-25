import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DevicesService } from './devices.service';
import { CreateDeviceDto, UpdateDeviceDto, UpdateDeviceLocationDto } from './dto/create-device.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('devices')
@Controller('devices')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post()
  @ApiOperation({ summary: 'Register a new device' })
  create(@Request() req, @Body() createDeviceDto: CreateDeviceDto) {
    return this.devicesService.create(req.user.userId, createDeviceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all devices for current user' })
  findAll(@Request() req) {
    return this.devicesService.findAll(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get device by ID' })
  findOne(@Param('id') id: string) {
    return this.devicesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update device' })
  update(@Param('id') id: string, @Body() updateDeviceDto: UpdateDeviceDto) {
    return this.devicesService.update(id, updateDeviceDto);
  }

  @Patch(':id/location')
  @ApiOperation({ summary: 'Update device location (from AIoT sensor)' })
  updateLocation(@Param('id') id: string, @Body() locationDto: UpdateDeviceLocationDto) {
    return this.devicesService.updateLocation(id, locationDto);
  }

  @Patch(':id/status/:status')
  @ApiOperation({ summary: 'Update device status' })
  updateStatus(@Param('id') id: string, @Param('status') status: 'online' | 'offline') {
    return this.devicesService.updateStatus(id, status);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete device' })
  remove(@Param('id') id: string) {
    return this.devicesService.remove(id);
  }
}
