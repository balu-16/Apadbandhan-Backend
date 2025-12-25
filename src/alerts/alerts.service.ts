import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Alert, AlertDocument } from './schemas/alert.schema';
import { DevicesService } from '../devices/devices.service';
import { CreateAlertDto, UpdateAlertStatusDto } from './dto/create-alert.dto';

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(
    @InjectModel(Alert.name)
    private alertModel: Model<AlertDocument>,
    private devicesService: DevicesService,
  ) {}

  async create(createAlertDto: CreateAlertDto): Promise<AlertDocument> {
    const { deviceCode, latitude, longitude, address, ...alertData } = createAlertDto;

    // Find device by code
    const device = await this.devicesService.findByCode(deviceCode);
    if (!device) {
      throw new NotFoundException(`Device with code ${deviceCode} not found`);
    }

    const alert = new this.alertModel({
      deviceId: device._id,
      userId: device.userId,
      type: alertData.type || 'accident',
      severity: alertData.severity || 'high',
      location: {
        latitude,
        longitude,
        address: address || null,
      },
      speed: alertData.speed || null,
      impactForce: alertData.impactForce || null,
      sensorData: alertData.sensorData || null,
    });

    const savedAlert = await alert.save();

    // Log alert trigger
    this.logger.warn(`🚨 ALERT TRIGGERED for device ${device.name} (${deviceCode})`);
    this.logger.log(`   Type: ${savedAlert.type}, Severity: ${savedAlert.severity}`);
    this.logger.log(`   Location: ${latitude}, ${longitude}`);
    this.logger.log(`   Speed: ${alertData.speed || 'N/A'} km/h, Impact: ${alertData.impactForce || 'N/A'} G`);
    this.logger.log(`   Emergency contacts: ${device.emergencyContacts?.length || 0}`);

    // TODO: Send SMS notifications to emergency contacts
    // await this.notifyEmergencyContacts(device, savedAlert);

    return savedAlert;
  }

  async findAll(): Promise<AlertDocument[]> {
    return this.alertModel
      .find()
      .populate('deviceId')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByDevice(deviceId: string): Promise<AlertDocument[]> {
    return this.alertModel
      .find({ deviceId: new Types.ObjectId(deviceId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<AlertDocument> {
    const alert = await this.alertModel
      .findById(id)
      .populate('deviceId')
      .exec();
    if (!alert) {
      throw new NotFoundException(`Alert with ID ${id} not found`);
    }
    return alert;
  }

  async updateStatus(id: string, updateDto: UpdateAlertStatusDto): Promise<AlertDocument> {
    const updateData: any = { status: updateDto.status };
    
    if (updateDto.notes) {
      updateData.notes = updateDto.notes;
    }
    if (updateDto.status === 'resolved') {
      updateData.resolvedAt = new Date();
    }

    const alert = await this.alertModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
    
    if (!alert) {
      throw new NotFoundException(`Alert with ID ${id} not found`);
    }
    return alert;
  }

  async getStats(): Promise<any> {
    const total = await this.alertModel.countDocuments();
    const pending = await this.alertModel.countDocuments({ status: 'pending' });
    const dispatched = await this.alertModel.countDocuments({ status: 'dispatched' });
    const resolved = await this.alertModel.countDocuments({ status: 'resolved' });

    return {
      total,
      pending,
      dispatched,
      resolved,
    };
  }
}
