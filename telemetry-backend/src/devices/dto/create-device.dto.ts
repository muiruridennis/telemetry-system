export class CreateDeviceDto {
    name: string;
    deviceId: string;
    type: string;
    location: string;
    secretKey?: string;
    isActive: boolean;

}