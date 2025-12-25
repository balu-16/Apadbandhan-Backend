import { Injectable, NotFoundException, BadRequestException, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { QrCode, QrCodeDocument } from './schemas/qrcode.schema';
import { CreateQrCodeDto, AssignQrCodeDto } from './dto/qrcode.dto';
import * as QRCode from 'qrcode';

@Injectable()
export class QrCodesService implements OnModuleInit {
  private readonly logger = new Logger(QrCodesService.name);

  constructor(
    @InjectModel(QrCode.name)
    private qrCodeModel: Model<QrCodeDocument>,
  ) { }

  // ==================== CONSTANTS ====================
  private static readonly ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];
  private static readonly MAX_FILE_SIZE = 16 * 1024 * 1024; // 16MB

  // ==================== HELPER METHODS ====================

  /**
   * Validate QR image file upload
   * @throws BadRequestException if file is invalid
   */
  private validateQrImageFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    if (!QrCodesService.ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Only PNG and JPEG images are allowed');
    }
    if (file.size > QrCodesService.MAX_FILE_SIZE) {
      throw new BadRequestException('File too large. Maximum size is 16MB');
    }
  }

  /**
   * Initialize module - generate 10 random QR codes if collection is empty
   */
  async onModuleInit() {
    const count = await this.qrCodeModel.countDocuments();
    if (count === 0) {
      this.logger.log('📱 No QR codes found. Generating 10 random QR codes...');
      await this.generateRandomQrCodes(10);
      this.logger.log('✅ 10 QR codes generated successfully!');
    } else {
      this.logger.log(`📱 Found ${count} existing QR codes in database.`);
    }
  }

  /**
   * Generate random 16-digit device code
   */
  private generateDeviceCode(): string {
    let code = '';
    for (let i = 0; i < 16; i++) {
      code += Math.floor(Math.random() * 10).toString();
    }
    return code;
  }

  /**
   * Generate QR code image as Buffer
   */
  private async generateQrCodeImage(deviceCode: string): Promise<Buffer> {
    // Create QR code data with device info
    const qrData = JSON.stringify({
      type: 'APADBANDHAV_DEVICE',
      code: deviceCode,
      version: '1.0'
    });

    // Generate QR code as PNG buffer
    const qrBuffer = await QRCode.toBuffer(qrData, {
      type: 'png',
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H'
    });

    return qrBuffer;
  }

  /**
   * Generate multiple random QR codes and store in database
   */
  async generateRandomQrCodes(count: number): Promise<QrCodeDocument[]> {
    const qrCodes: QrCodeDocument[] = [];

    for (let i = 0; i < count; i++) {
      try {
        // Generate unique device code
        let deviceCode: string;
        let exists = true;

        while (exists) {
          deviceCode = this.generateDeviceCode();
          exists = !!(await this.qrCodeModel.findOne({ deviceCode }));
        }

        // Generate QR code image
        const qrImage = await this.generateQrCodeImage(deviceCode);

        // Create QR code document
        const qrCode = new this.qrCodeModel({
          deviceCode,
          deviceName: `Apadbandhav Device #${i + 1}`,
          qrImage,
          qrImageType: 'image/png',
          imageSize: qrImage.length,
          isAssigned: false,
          status: 'available'
        });

        const saved = await qrCode.save();
        qrCodes.push(saved);
        console.log(`  ✓ Generated QR code: ${deviceCode}`);
      } catch (error) {
        console.error(`  ✗ Failed to generate QR code #${i + 1}:`, error.message);
      }
    }

    return qrCodes;
  }

  /**
   * Create a new QR code entry
   */
  async createDevice(createDto: CreateQrCodeDto): Promise<QrCodeDocument> {
    // Check if device code already exists
    const existing = await this.qrCodeModel.findOne({ deviceCode: createDto.deviceCode });
    if (existing) {
      throw new BadRequestException('Device code already exists');
    }

    // Generate QR code image
    const qrImage = await this.generateQrCodeImage(createDto.deviceCode);

    const qrCode = new this.qrCodeModel({
      deviceCode: createDto.deviceCode,
      deviceName: createDto.deviceName || 'Apadbandhav Device',
      qrImage,
      qrImageType: 'image/png',
      imageSize: qrImage.length,
      isAssigned: false,
      status: 'available'
    });

    return qrCode.save();
  }

  /**
   * Upload/update QR image for existing device
   */
  async uploadQrImage(
    deviceId: string,
    file: Express.Multer.File
  ): Promise<{ deviceId: string; deviceCode: string; size: number; mimeType: string; message: string }> {
    // Validate file
    this.validateQrImageFile(file);

    // Find and update device
    const qrCode = await this.qrCodeModel.findByIdAndUpdate(
      deviceId,
      {
        qrImage: file.buffer,
        qrImageType: file.mimetype,
        imageSize: file.size
      },
      { new: true }
    );

    if (!qrCode) {
      throw new NotFoundException('Device not found');
    }

    return {
      deviceId: qrCode._id.toString(),
      deviceCode: qrCode.deviceCode,
      size: file.size,
      mimeType: file.mimetype,
      message: 'Image upload successful'
    };
  }

  /**
   * Upload QR image by device code
   */
  async uploadQrImageByCode(
    deviceCode: string,
    file: Express.Multer.File
  ): Promise<{ deviceId: string; deviceCode: string; size: number; mimeType: string; message: string }> {
    // Validate file
    this.validateQrImageFile(file);

    // Find and update device by code
    const qrCode = await this.qrCodeModel.findOneAndUpdate(
      { deviceCode },
      {
        qrImage: file.buffer,
        qrImageType: file.mimetype,
        imageSize: file.size
      },
      { new: true }
    );

    if (!qrCode) {
      throw new NotFoundException('Device with this code not found');
    }

    return {
      deviceId: qrCode._id.toString(),
      deviceCode: qrCode.deviceCode,
      size: file.size,
      mimeType: file.mimetype,
      message: 'Image upload successful'
    };
  }

  /**
   * Get QR image by device ID
   */
  async getQrImage(deviceId: string): Promise<{ buffer: Buffer; contentType: string }> {
    const qrCode = await this.qrCodeModel.findById(deviceId).select('+qrImage');

    if (!qrCode) {
      throw new NotFoundException('Device not found');
    }

    if (!qrCode.qrImage) {
      throw new NotFoundException('QR image not found for this device');
    }

    return {
      buffer: qrCode.qrImage,
      contentType: qrCode.qrImageType
    };
  }

  /**
   * Get QR image by device code
   */
  async getQrImageByCode(deviceCode: string): Promise<{ buffer: Buffer; contentType: string }> {
    const qrCode = await this.qrCodeModel.findOne({ deviceCode }).select('+qrImage');

    if (!qrCode) {
      throw new NotFoundException('Device not found');
    }

    if (!qrCode.qrImage) {
      throw new NotFoundException('QR image not found for this device');
    }

    return {
      buffer: qrCode.qrImage,
      contentType: qrCode.qrImageType
    };
  }

  /**
   * Get all QR codes (without image buffer)
   */
  async findAll(): Promise<QrCodeDocument[]> {
    return this.qrCodeModel.find().select('-qrImage').sort({ createdAt: -1 });
  }

  /**
   * Get available (unassigned) QR codes
   */
  async findAvailable(): Promise<QrCodeDocument[]> {
    return this.qrCodeModel
      .find({ isAssigned: false, status: 'available' })
      .select('-qrImage')
      .sort({ createdAt: -1 });
  }

  /**
   * Get QR code by ID
   */
  async findOne(id: string): Promise<QrCodeDocument> {
    const qrCode = await this.qrCodeModel.findById(id).select('-qrImage');
    if (!qrCode) {
      throw new NotFoundException('QR code not found');
    }
    return qrCode;
  }

  /**
   * Get QR code by device code
   */
  async findByCode(deviceCode: string): Promise<QrCodeDocument> {
    const qrCode = await this.qrCodeModel.findOne({ deviceCode }).select('-qrImage');
    if (!qrCode) {
      throw new NotFoundException('QR code not found');
    }
    return qrCode;
  }

  /**
   * Validate if a device code exists and is available
   */
  async validateDeviceCode(deviceCode: string): Promise<{ valid: boolean; message: string; qrCode?: any }> {
    const qrCode = await this.qrCodeModel.findOne({ deviceCode }).select('-qrImage');

    if (!qrCode) {
      return { valid: false, message: 'Device code not found' };
    }

    if (qrCode.isAssigned) {
      return { valid: false, message: 'This device is already registered' };
    }

    if (qrCode.status !== 'available') {
      return { valid: false, message: 'This device code is not available' };
    }

    return {
      valid: true,
      message: 'Device code is valid and available',
      qrCode: {
        id: qrCode._id,
        deviceCode: qrCode.deviceCode,
        deviceName: qrCode.deviceName
      }
    };
  }

  /**
   * Assign QR code to a user
   */
  async assignToUser(assignDto: AssignQrCodeDto): Promise<QrCodeDocument> {
    const qrCode = await this.qrCodeModel.findOneAndUpdate(
      {
        deviceCode: assignDto.deviceCode,
        isAssigned: false,
        status: 'available'
      },
      {
        isAssigned: true,
        assignedToUserId: assignDto.userId,
        assignedAt: new Date(),
        status: 'assigned'
      },
      { new: true }
    ).select('-qrImage');

    if (!qrCode) {
      throw new BadRequestException('QR code not found or already assigned');
    }

    return qrCode;
  }

  /**
   * Unassign QR code from user
   */
  async unassign(deviceCode: string): Promise<QrCodeDocument> {
    const qrCode = await this.qrCodeModel.findOneAndUpdate(
      { deviceCode },
      {
        isAssigned: false,
        assignedToUserId: null,
        assignedAt: null,
        status: 'available'
      },
      { new: true }
    ).select('-qrImage');

    if (!qrCode) {
      throw new NotFoundException('QR code not found');
    }

    return qrCode;
  }

  /**
   * Delete QR code
   */
  async remove(id: string): Promise<void> {
    const result = await this.qrCodeModel.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundException('QR code not found');
    }
  }

  /**
   * Get statistics
   */
  async getStats(): Promise<{ total: number; available: number; assigned: number }> {
    const [total, available, assigned] = await Promise.all([
      this.qrCodeModel.countDocuments(),
      this.qrCodeModel.countDocuments({ isAssigned: false, status: 'available' }),
      this.qrCodeModel.countDocuments({ isAssigned: true })
    ]);

    return { total, available, assigned };
  }
}
