export interface DeviceContext {
    deviceId: string;
    deviceType: string;
    deviceName?: string;
    deviceLocation?: string;
    organizationId?: string;
    isActive: boolean;
    permissions: string[];
    // JWT standard claims
    iss?: string;
    aud?: string;
    exp?: number;
    iat?: number;
    // Custom flag
    isDevice: true;
  }

export interface RequestWithDevice extends Request {
    user: DeviceContext;  // IoT device
  }