import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { DevicesModule } from './modules/devices/devices.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { QrCodesModule } from './modules/qrcodes/qrcodes.module';
import { DeviceLocationsModule } from './modules/device-locations/device-locations.module';
import { HealthModule } from './modules/health/health.module';
import { AdminModule } from './modules/admin/admin.module';
/**
 * MQTT and Events modules are currently disabled.
 * To enable, uncomment the imports below and add to the imports array.
 * Requires: MQTT_BROKER_URL, MQTT_USERNAME, MQTT_PASSWORD environment variables
 */
// import { MqttModule } from './mqtt/mqtt.module';
// import { EventsModule } from './events/events.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // MongoDB Database
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),

    // Global Rate Limiting
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 10,
    }]),

    // Database initialization
    DatabaseModule,

    // Feature modules
    AuthModule,
    UsersModule,
    DevicesModule,
    AlertsModule,
    QrCodesModule,
    DeviceLocationsModule,
    HealthModule,
    AdminModule,

    // Real-time modules (MQTT temporarily disabled)
    // MqttModule,
    // EventsModule,
  ],
})
export class AppModule { }
