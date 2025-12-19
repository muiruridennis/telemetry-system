import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { DevicesService } from "../../devices/devices.service";

@Injectable()
export class DeviceJwtStrategy extends PassportStrategy(Strategy, 'device-jwt') {
    constructor(
        private configService: ConfigService,
        private devicesService: DevicesService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                ExtractJwt.fromAuthHeaderAsBearerToken(),
                ExtractJwt.fromUrlQueryParameter('device_token'),
            ]),
            ignoreExpiration: false,
            secretOrKey: configService.get('DEVICE_JWT_SECRET') || configService.get('JWT_SECRET'),
            issuer: 'telemetry-platform-device',
            audience: 'telemetry-api',
        });
    }

    async validate(payload: any) {
        console.log('🔐 JWT Payload received:', payload); // Debug
        
        // Check if it's a device token
        if (!payload.deviceId) {
            throw new UnauthorizedException('Invalid device token');
        }

        // Verify device exists and is active
        const device = await this.devicesService.findByDeviceId(payload.deviceId);
        if (!device || !device.isActive) {
            throw new UnauthorizedException('Device not found or inactive');
        }

        // Return device context with CORRECT field mapping
        return {
            // From JWT token
            deviceId: payload.deviceId,
            deviceName: payload.deviceName,           // ← FIXED: deviceName not name
            deviceType: payload.deviceType,
            deviceLocation: payload.deviceLocation,   // ← FIXED: deviceLocation not location
            // From device
            isActive: device.isActive,
            
            // Additional context
            permissions: payload.permissions || ['telemetry:send'],
            role: 'device',
            isDevice: true,
            
        };
    }
}