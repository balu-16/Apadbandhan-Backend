/**
 * MQTT Constants for Apadbandhav IoT Integration
 * 
 * This file defines all MQTT-related constants including:
 * - Injection tokens
 * - Topic patterns
 * - Event types
 * - QoS levels
 */

// Injection token for MQTT client
export const MQTT_CLIENT = 'MQTT_CLIENT';

// Topic Patterns
export const MQTT_TOPICS = {
  // Device publishes to these topics
  DEVICE_EVENTS: 'devices/+/events',
  DEVICE_TELEMETRY: 'devices/+/telemetry',
  DEVICE_ACCIDENT: 'devices/+/accident',
  DEVICE_HEALTH: 'devices/+/health',
  
  // Backend publishes to these topics (commands to devices)
  BACKEND_COMMANDS: 'backend/+/commands',
  
  // Specific topic builders
  buildDeviceEventTopic: (deviceId: string) => `devices/${deviceId}/events`,
  buildDeviceTelemetryTopic: (deviceId: string) => `devices/${deviceId}/telemetry`,
  buildDeviceAccidentTopic: (deviceId: string) => `devices/${deviceId}/accident`,
  buildDeviceHealthTopic: (deviceId: string) => `devices/${deviceId}/health`,
  buildBackendCommandTopic: (deviceId: string) => `backend/${deviceId}/commands`,
};

// Event Types
export enum MqttEventType {
  ACCIDENT = 'accident',
  TELEMETRY = 'telemetry',
  HEALTH = 'health',
  STATUS = 'status',
  ALERT = 'alert',
  COMMAND = 'command',
}

// QoS Levels
export enum MqttQoS {
  AT_MOST_ONCE = 0,   // Fire and forget
  AT_LEAST_ONCE = 1,  // Guaranteed delivery (may duplicate)
  EXACTLY_ONCE = 2,   // Guaranteed exactly once delivery
}

// Default subscription topics
export const DEFAULT_SUBSCRIPTIONS = [
  { topic: MQTT_TOPICS.DEVICE_ACCIDENT, qos: MqttQoS.AT_LEAST_ONCE },
  { topic: MQTT_TOPICS.DEVICE_EVENTS, qos: MqttQoS.AT_LEAST_ONCE },
  { topic: MQTT_TOPICS.DEVICE_TELEMETRY, qos: MqttQoS.AT_MOST_ONCE },
  { topic: MQTT_TOPICS.DEVICE_HEALTH, qos: MqttQoS.AT_MOST_ONCE },
];

// Reconnection settings
// In production, MAX_ATTEMPTS = -1 means infinite retries
export const MQTT_RECONNECT_SETTINGS = {
  INITIAL_DELAY: 1000,      // 1 second
  MAX_DELAY: 60000,         // 60 seconds max (increased for production stability)
  MULTIPLIER: 2,            // Exponential backoff multiplier
  MAX_ATTEMPTS: process.env.NODE_ENV === 'production' ? -1 : 10, // Infinite in production
  JITTER: 0.1,              // 10% jitter to prevent thundering herd
};

// WebSocket events for frontend
export const WS_EVENTS = {
  DEVICE_EVENT: 'device_event',
  DEVICE_ACCIDENT: 'device_accident',
  DEVICE_TELEMETRY: 'device_telemetry',
  DEVICE_STATUS: 'device_status',
  ALERT_CREATED: 'alert_created',
  CONNECTION_STATUS: 'connection_status',
};
