import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DeviceLocationsService } from './device-locations.service';
import { DeviceLocationsController } from './device-locations.controller';
import { DeviceLocation, DeviceLocationSchema } from './schemas/device-location.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DeviceLocation.name, schema: DeviceLocationSchema },
    ]),
  ],
  controllers: [DeviceLocationsController],
  providers: [DeviceLocationsService],
  exports: [DeviceLocationsService],
})
export class DeviceLocationsModule {}
