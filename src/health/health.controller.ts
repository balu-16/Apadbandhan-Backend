import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
// import { MqttService } from '../mqtt/mqtt.service'; // Temporarily disabled

/**
 * Health Check Controller
 * 
 * Provides endpoints to check the health status of the application
 * and its dependencies (MQTT, Database, etc.)
 */
@ApiTags('health')
@Controller('health')
export class HealthController {
  /**
   * Basic health check endpoint
   */
  @Get()
  @ApiOperation({ summary: 'Basic health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  /**
   * MQTT connection health check (temporarily disabled)
   */
  @Get('mqtt')
  @ApiOperation({ summary: 'MQTT connection health check' })
  @ApiResponse({ status: 200, description: 'MQTT connection status' })
  getMqttHealth() {
    return {
      status: 'disabled',
      message: 'MQTT is temporarily disabled',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Detailed health check for all services
   */
  @Get('detailed')
  @ApiOperation({ summary: 'Detailed health check for all services' })
  @ApiResponse({ status: 200, description: 'Detailed health status' })
  getDetailedHealth() {
    return {
      status: 'ok',
      services: {
        mqtt: {
          status: 'disabled',
          message: 'MQTT is temporarily disabled',
        },
      },
      system: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
