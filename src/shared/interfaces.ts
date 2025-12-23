/**
 * Shared TypeScript Interfaces for Backend Services
 * 
 * This file contains common interfaces used across the application
 * to replace 'any' types and improve type safety.
 */

/**
 * Statistics query result interface
 */
export interface StatsResult {
    totalDevices: number;
    onlineDevices: number;
    offlineDevices: number;
    totalUsers?: number;
    totalAdmins?: number;
    totalSuperAdmins?: number;
}

/**
 * Alert statistics interface
 */
export interface AlertStats {
    total: number;
    pending: number;
    dispatched: number;
    resolved: number;
}

/**
 * Device count interface
 */
export interface DeviceCount {
    total: number;
    online: number;
    offline: number;
}

/**
 * Location statistics interface
 */
export interface LocationStats {
    totalLocations: number;
    firstLocation: Date | null;
    lastLocation: Date | null;
    averageSpeed: number;
}

/**
 * QR Code statistics interface
 */
export interface QrCodeStats {
    total: number;
    available: number;
    assigned: number;
}

/**
 * MQTT event statistics interface
 */
export interface MqttEventStats {
    totalEvents: number;
    accidents: number;
    telemetryCount: number;
    deviceCount: number;
}

/**
 * Database query filter interface
 */
export interface QueryFilter {
    [key: string]: unknown;
}

/**
 * User with basic info for API responses
 */
export interface UserBasicInfo {
    id: string;
    fullName: string;
    email: string;
    phone: string;
}

/**
 * QR code with user info for admin responses
 */
export interface QrCodeWithUserInfo {
    id: string;
    deviceCode: string;
    deviceName: string;
    status: string;
    isAssigned: boolean;
    qrImageUrl: string;
    assignedUser: UserBasicInfo | null;
}

/**
 * Device update data interface
 */
export interface DeviceUpdateData {
    name?: string;
    type?: string;
    status?: string;
    lastOnlineAt?: Date;
    'insurance.healthInsuranceNumber'?: string | null;
    'insurance.vehicleInsuranceNumber'?: string | null;
    'insurance.termInsuranceNumber'?: string | null;
}

/**
 * Alert update data interface
 */
export interface AlertUpdateData {
    status: string;
    notes?: string;
    resolvedAt?: Date;
}
