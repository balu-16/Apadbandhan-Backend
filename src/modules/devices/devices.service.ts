import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Device, DeviceDocument } from './schemas/device.schema';
import { CreateDeviceDto, UpdateDeviceDto, UpdateDeviceLocationDto } from './dto/create-device.dto';

@Injectable()
export class DevicesService {
  constructor(
    @InjectModel(Device.name)
    private deviceModel: Model<DeviceDocument>,
  ) {}

  /**
   * Create a new device with all associated data
   */
  async create(userId: string, createDeviceDto: CreateDeviceDto): Promise<DeviceDocument> {
    // Check if device code already exists
    const existingDevice = await this.deviceModel.findOne({ code: createDeviceDto.code }).exec();
    if (existingDevice) {
      throw new BadRequestException('Device with this code already exists');
    }

    // Build device document with proper structure
    const deviceData = {
      name: createDeviceDto.name,
      code: createDeviceDto.code,
      type: createDeviceDto.type || 'Vehicle',
      userId: new Types.ObjectId(userId),
      emergencyContacts: createDeviceDto.emergencyContacts || [],
      insurance: {
        healthInsuranceNumber: createDeviceDto.healthInsurance || null,
        vehicleInsuranceNumber: createDeviceDto.vehicleInsurance || null,
        termInsuranceNumber: createDeviceDto.termInsurance || null,
      },
      registeredAt: new Date(),
      status: 'offline',
    };

    const device = new this.deviceModel(deviceData);
    return device.save();
  }

  /**
   * Get all devices for a user
   */
  async findAll(userId: string): Promise<DeviceDocument[]> {
    return this.deviceModel
      .find({ userId: new Types.ObjectId(userId), isActive: true })
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Get a single device by ID
   */
  async findOne(id: string): Promise<DeviceDocument> {
    const device = await this.deviceModel.findById(id).exec();
    if (!device) {
      throw new NotFoundException(`Device with ID ${id} not found`);
    }
    return device;
  }

  /**
   * Find device by 16-digit code
   */
  async findByCode(code: string): Promise<DeviceDocument | null> {
    return this.deviceModel.findOne({ code }).exec();
  }

  /**
   * Update device information
   */
  async update(id: string, updateDeviceDto: UpdateDeviceDto): Promise<DeviceDocument> {
    const updateData: any = { ...updateDeviceDto };
    
    // Handle status updates - set lastOnlineAt when going online
    if (updateDeviceDto.status === 'online') {
      updateData.lastOnlineAt = new Date();
    }
    
    // Handle insurance updates
    if (updateDeviceDto.healthInsurance || updateDeviceDto.vehicleInsurance || updateDeviceDto.termInsurance) {
      updateData['insurance.healthInsuranceNumber'] = updateDeviceDto.healthInsurance;
      updateData['insurance.vehicleInsuranceNumber'] = updateDeviceDto.vehicleInsurance;
      updateData['insurance.termInsuranceNumber'] = updateDeviceDto.termInsurance;
      delete updateData.healthInsurance;
      delete updateData.vehicleInsurance;
      delete updateData.termInsurance;
    }

    const device = await this.deviceModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
    if (!device) {
      throw new NotFoundException(`Device with ID ${id} not found`);
    }
    return device;
  }

  /**
   * Update device location from AIoT sensor
   */
  async updateLocation(id: string, locationDto: UpdateDeviceLocationDto): Promise<DeviceDocument> {
    const device = await this.deviceModel
      .findByIdAndUpdate(
        id,
        {
          'location.latitude': locationDto.latitude,
          'location.longitude': locationDto.longitude,
          'location.address': locationDto.address || null,
          'location.lastUpdatedAt': new Date(),
          status: 'online',
          lastOnlineAt: new Date(),
        },
        { new: true },
      )
      .exec();
    if (!device) {
      throw new NotFoundException(`Device with ID ${id} not found`);
    }
    return device;
  }

  /**
   * Update device status
   */
  async updateStatus(id: string, status: 'online' | 'offline' | 'maintenance'): Promise<DeviceDocument> {
    const updateData: any = { status };
    if (status === 'online') {
      updateData.lastOnlineAt = new Date();
    }
    
    const device = await this.deviceModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
    if (!device) {
      throw new NotFoundException(`Device with ID ${id} not found`);
    }
    return device;
  }

  /**
   * Soft delete a device
   */
  async remove(id: string): Promise<void> {
    const result = await this.deviceModel
      .findByIdAndUpdate(id, { isActive: false }, { new: true })
      .exec();
    if (!result) {
      throw new NotFoundException(`Device with ID ${id} not found`);
    }
  }

  /**
   * Get device count for a user
   */
  async getDeviceCount(userId: string): Promise<{ total: number; online: number; offline: number }> {
    const devices = await this.findAll(userId);
    return {
      total: devices.length,
      online: devices.filter(d => d.status === 'online').length,
      offline: devices.filter(d => d.status === 'offline').length,
    };
  }
}
