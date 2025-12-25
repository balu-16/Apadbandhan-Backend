import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DeviceLocation, DeviceLocationDocument } from './schemas/device-location.schema';
import { CreateDeviceLocationDto, LocationQueryDto } from './dto/device-location.dto';
import { Device, DeviceDocument } from '../devices/schemas/device.schema';

@Injectable()
export class DeviceLocationsService {
  constructor(
    @InjectModel(DeviceLocation.name)
    private locationModel: Model<DeviceLocationDocument>,
    @InjectModel(Device.name)
    private deviceModel: Model<DeviceDocument>,
  ) {}

  /**
   * Find device ID by device code
   */
  async findDeviceIdByCode(deviceCode: string): Promise<string> {
    const device = await this.deviceModel.findOne({ code: deviceCode }).exec();
    if (!device) {
      throw new NotFoundException(`Device with code ${deviceCode} not found`);
    }
    return device._id.toString();
  }

  /**
   * Record a new location using device code (for IoT devices)
   */
  async createByDeviceCode(
    deviceCode: string,
    locationData: Omit<CreateDeviceLocationDto, 'deviceId'>,
  ): Promise<DeviceLocationDocument> {
    const deviceId = await this.findDeviceIdByCode(deviceCode);
    return this.create({ ...locationData, deviceId });
  }

  /**
   * Record multiple locations using device code (batch)
   */
  async createBatchByDeviceCode(
    deviceCode: string,
    locations: Omit<CreateDeviceLocationDto, 'deviceId'>[],
  ): Promise<DeviceLocationDocument[]> {
    const deviceId = await this.findDeviceIdByCode(deviceCode);
    const locationsWithDeviceId = locations.map(loc => ({ ...loc, deviceId }));
    return this.createBatch(locationsWithDeviceId);
  }

  /**
   * Record a new location for a device
   */
  async create(createLocationDto: CreateDeviceLocationDto): Promise<DeviceLocationDocument> {
    const locationData = {
      ...createLocationDto,
      deviceId: new Types.ObjectId(createLocationDto.deviceId),
      recordedAt: createLocationDto.recordedAt 
        ? new Date(createLocationDto.recordedAt) 
        : new Date(),
    };

    const location = new this.locationModel(locationData);
    return location.save();
  }

  /**
   * Record multiple locations in batch (for AIoT sensor data)
   */
  async createBatch(locations: CreateDeviceLocationDto[]): Promise<DeviceLocationDocument[]> {
    const locationDocs = locations.map(loc => ({
      ...loc,
      deviceId: new Types.ObjectId(loc.deviceId),
      recordedAt: loc.recordedAt ? new Date(loc.recordedAt) : new Date(),
    }));

    const result = await this.locationModel.insertMany(locationDocs);
    return result as unknown as DeviceLocationDocument[];
  }

  /**
   * Get all locations for a device
   */
  async findByDevice(
    deviceId: string,
    query?: LocationQueryDto,
  ): Promise<DeviceLocationDocument[]> {
    console.log('[DeviceLocations] findByDevice called with deviceId:', deviceId);
    
    const objectId = new Types.ObjectId(deviceId);
    console.log('[DeviceLocations] Converted to ObjectId:', objectId.toString());
    
    const filter: any = { deviceId: objectId };

    if (query?.startDate || query?.endDate) {
      filter.recordedAt = {};
      if (query.startDate) {
        filter.recordedAt.$gte = new Date(query.startDate);
      }
      if (query.endDate) {
        filter.recordedAt.$lte = new Date(query.endDate);
      }
    }

    // Handle both string and number types for limit/skip (query params come as strings)
    const limit = query?.limit ? Number(query.limit) : 100;
    const skip = query?.skip ? Number(query.skip) : 0;

    console.log('[DeviceLocations] Query filter:', JSON.stringify(filter));
    console.log('[DeviceLocations] Limit:', limit, 'Skip:', skip);

    const results = await this.locationModel
      .find(filter)
      .sort({ recordedAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    console.log('[DeviceLocations] Found', results.length, 'locations');
    
    return results;
  }

  /**
   * Get the latest location for a device
   */
  async findLatest(deviceId: string): Promise<DeviceLocationDocument | null> {
    return this.locationModel
      .findOne({ deviceId: new Types.ObjectId(deviceId) })
      .sort({ recordedAt: -1 })
      .exec();
  }

  /**
   * Get location by ID
   */
  async findOne(id: string): Promise<DeviceLocationDocument> {
    const location = await this.locationModel.findById(id).exec();
    if (!location) {
      throw new NotFoundException(`Location with ID ${id} not found`);
    }
    return location;
  }

  /**
   * Get location history for a specific date range
   */
  async getLocationHistory(
    deviceId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<DeviceLocationDocument[]> {
    return this.locationModel
      .find({
        deviceId: new Types.ObjectId(deviceId),
        recordedAt: {
          $gte: startDate,
          $lte: endDate,
        },
      })
      .sort({ recordedAt: 1 })
      .exec();
  }

  /**
   * Get location statistics for a device
   */
  async getStats(deviceId: string): Promise<{
    totalLocations: number;
    firstLocation: Date | null;
    lastLocation: Date | null;
    averageSpeed: number;
  }> {
    const deviceObjectId = new Types.ObjectId(deviceId);

    const [stats] = await this.locationModel.aggregate([
      { $match: { deviceId: deviceObjectId } },
      {
        $group: {
          _id: '$deviceId',
          totalLocations: { $sum: 1 },
          firstLocation: { $min: '$recordedAt' },
          lastLocation: { $max: '$recordedAt' },
          averageSpeed: { $avg: '$speed' },
        },
      },
    ]);

    return {
      totalLocations: stats?.totalLocations || 0,
      firstLocation: stats?.firstLocation || null,
      lastLocation: stats?.lastLocation || null,
      averageSpeed: stats?.averageSpeed || 0,
    };
  }

  /**
   * Delete all locations for a device (when device is deleted)
   */
  async deleteByDevice(deviceId: string): Promise<void> {
    await this.locationModel.deleteMany({ 
      deviceId: new Types.ObjectId(deviceId) 
    }).exec();
  }

  /**
   * Delete old locations (for cleanup)
   */
  async deleteOldLocations(beforeDate: Date): Promise<number> {
    const result = await this.locationModel.deleteMany({
      recordedAt: { $lt: beforeDate },
    }).exec();
    return result.deletedCount;
  }
}
