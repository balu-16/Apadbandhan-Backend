# MQTT and WebSocket Code - Temporarily Disabled

## Summary

All MQTT and WebSocket related code has been commented out as the MQTT connection is currently not being used.

## Files Modified

### 1. WebSocket Gateway
- **File**: `src/events/events.gateway.ts`
- **Status**: ✅ All code commented out
- **Purpose**: WebSocket gateway that bridges MQTT events to frontend clients

### 2. Events Module
- **File**: `src/events/events.module.ts`
- **Status**: ✅ All code commented out
- **Purpose**: Module that provides WebSocket functionality

### 3. MQTT Module
- **File**: `src/mqtt/mqtt.module.ts`
- **Status**: ✅ All code commented out
- **Purpose**: Global module providing MQTT connectivity

### 4. MQTT Service
- **File**: `src/mqtt/mqtt.service.ts`
- **Status**: ✅ Header added indicating code is disabled
- **Purpose**: Core MQTT client implementation

### 5. MQTT Events Service
- **File**: `src/mqtt/mqtt-events.service.ts`
- **Status**: ✅ Header added indicating code is disabled
- **Purpose**: Processes MQTT events and integrates with database

### 6. App Module (Already Disabled)
- **File**: `src/app.module.ts`
- **Status**: ✅ MQTT and Events modules already commented out
- **Lines**: 18-19, 52-53

## Current Status

✅ **All MQTT and WebSocket code is now disabled**

The modules are NOT being imported in `app.module.ts`, so they won't be initialized when the application starts.

## Dependencies in package.json

The following dependencies are still in `package.json` but are not actively used:
- `@nestjs/websockets`
- `@nestjs/platform-socket.io`
- `socket.io`
- `mqtt`

**You can optionally remove these dependencies** to reduce bundle size, but it's also fine to keep them for when you re-enable MQTT functionality.

## How to Re-enable MQTT & WebSockets

When you're ready to re-enable real-time functionality:

1. **Uncomment code in these files**:
   - `src/events/events.gateway.ts` - Remove the `/*` and `*/` wrapper
   - `src/events/events.module.ts` - Remove the `/*` and `*/` wrapper  
   - `src/mqtt/mqtt.module.ts` - Remove the `/*` and `*/` wrapper
   - `src/mqtt/mqtt.service.ts` - Remove the disabled header notice
   - `src/mqtt/mqtt-events.service.ts` - Remove the disabled header notice

2. **Uncomment in app.module.ts** (lines 18-19, 52-53):
   ```typescript
   import { MqttModule } from './mqtt/mqtt.module';
   import { EventsModule } from './events/events.module';
   
   // In imports array:
   MqttModule,
   EventsModule,
   ```

3. **Configure environment variables**:
   ```env
   MQTT_BROKER_URL=mqtts://your-broker.com:8883
   MQTT_USERNAME=your_username
   MQTT_PASSWORD=your_password
   MQTT_CLIENT_ID=apadbandhav-backend
   ```

4. **Restart the backend server**

---

*Last Updated: 2025-12-25*
