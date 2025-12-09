import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DeviceJwtStrategy extends PassportStrategy(Strategy, 'device-jwt') {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'secretKey',
      issuer: 'iot-platform',
      audience: 'device-api',
    });
  }

  async validate(payload: any) {
    // For devices, ensure they have device role
    if (payload.role !== 'device') {
      throw new Error('Invalid token type for device access');
    }
    
    return {
      deviceId: payload.deviceId,
      authKey: payload.authKey,
      role: payload.role,
      permissions: payload.permissions,
    };
  }
}