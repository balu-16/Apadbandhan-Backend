import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DeviceLocationsService } from './device-locations.service';
import { DeviceLocationsController } from './device-locations.controller';
import { DeviceLocation, DeviceLocationSchema } from './schemas/device-location.schema';
import { Device, DeviceSchema } from '../devices/schemas/device.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DeviceLocation.name, schema: DeviceLocationSchema },
      { name: Device.name, schema: DeviceSchema },
    ]),
  ],
  controllers: [DeviceLocationsController],
  providers: [DeviceLocationsService],
  exports: [DeviceLocationsService],
})
export class DeviceLocationsModule {}
