export class DeviceResponseDto {
    id: string;
    name: string;
    deviceId: string;
    type: string;
    location: string;
    isActive: boolean;
    lastSeen: Date;
    createdAt: Date;
    // No secretKey or refreshToken here
  }