import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { DevicesService } from '../../devices/devices.service';

@Injectable()
export class DeviceRefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'device-refresh-token'
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly devicesService: DevicesService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          // Get from header or query param (devices might not use cookies)
          return request?.headers?.['x-device-refresh'] || 
                 request?.query?.refresh_token as string;
        }
      ]),
      secretOrKey: configService.get('DEVICE_JWT_REFRESH_SECRET') || 
                   configService.get('JWT_REFRESH_TOKEN_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(request: Request, payload: any) {
    const refreshToken = request.headers?.['x-device-refresh'] as string;
    
    if (!payload.deviceId) {
      throw new UnauthorizedException('Invalid device refresh token');
    }

    return this.devicesService.getDeviceIfRefreshTokenMatches(
      refreshToken, 
      payload.deviceId
    );
  }
}