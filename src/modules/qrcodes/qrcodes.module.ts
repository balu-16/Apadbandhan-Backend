import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { QrCodesController } from './qrcodes.controller';
import { QrCodesService } from './qrcodes.service';
import { QrCode, QrCodeSchema } from './schemas/qrcode.schema';

@Module({
  imports: [
    // MongoDB Schema registration
    MongooseModule.forFeature([
      { name: QrCode.name, schema: QrCodeSchema }
    ]),
    // Multer configuration for file uploads with memory storage
    MulterModule.register({
      storage: memoryStorage(),
      limits: {
        fileSize: 16 * 1024 * 1024, // 16MB max file size
      },
    }),
  ],
  controllers: [QrCodesController],
  providers: [QrCodesService],
  exports: [QrCodesService], // Export service for use in other modules
})
export class QrCodesModule {}
