import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DevicesModule } from './devices/devices.module';
import { AlertsModule } from './alerts/alerts.module';
import { QrCodesModule } from './qrcodes/qrcodes.module';
import { DeviceLocationsModule } from './device-locations/device-locations.module';
import { HealthModule } from './health/health.module';
import { AdminModule } from './admin/admin.module';
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
  controllers: [AppController],
})
export class AppModule { }
