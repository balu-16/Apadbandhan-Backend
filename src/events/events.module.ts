/**
 * Events Module - TEMPORARILY DISABLED
 * 
 * This module is commented out because MQTT connection is currently disabled.
 * Uncomment this when re-enabling real-time WebSocket functionality.
 */

/*
import { Module, forwardRef } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { MqttModule } from '../mqtt/mqtt.module';

/**
 * Events Module
 * 
 * Provides WebSocket gateway for real-time event communication with frontend.
 *\/
@Module({
  imports: [forwardRef(() => MqttModule)],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class EventsModule {}
*/
