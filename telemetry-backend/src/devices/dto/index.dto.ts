export class DeviceLoginDto {
    deviceId: string;
  
    secretKey: string;
  }
  
  export class DeviceRefreshDto {
    deviceId: string;
  
    refreshToken: string;
  }