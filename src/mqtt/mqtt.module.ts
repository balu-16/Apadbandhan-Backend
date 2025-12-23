import { Module, Global, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MqttService } from './mqtt.service';
import { MqttEventsService } from './mqtt-events.service';
import { MqttEvent, MqttEventSchema } from './schemas/mqtt-event.schema';
import { EventsModule } from '../events/events.module';
import { AlertsModule } from '../modules/alerts/alerts.module';
import { DevicesModule } from '../modules/devices/devices.module';
import { DeviceLocationsModule } from '../modules/device-locations/device-locations.module';

/**
 * MQTT Module
 * 
 * Global module that provides MQTT connectivity for IoT devices.
 * Exports MqttService for use across the application.
 */
@Global()
@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: MqttEvent.name, schema: MqttEventSchema },
    ]),
    forwardRef(() => EventsModule),
    forwardRef(() => AlertsModule),
    forwardRef(() => DevicesModule),
    forwardRef(() => DeviceLocationsModule),
  ],
  providers: [MqttService, MqttEventsService],
  exports: [MqttService, MqttEventsService],
})
export class MqttModule {}
