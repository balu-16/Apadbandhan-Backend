import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Device, DeviceSchema } from '../devices/schemas/device.schema';
import { QrCode, QrCodeSchema } from '../qrcodes/schemas/qrcode.schema';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { QrCodesModule } from '../qrcodes/qrcodes.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Device.name, schema: DeviceSchema },
      { name: QrCode.name, schema: QrCodeSchema },
    ]),
    UsersModule,
    forwardRef(() => AuthModule),
    QrCodesModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
