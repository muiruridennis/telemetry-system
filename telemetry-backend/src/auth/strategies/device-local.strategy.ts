import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class DeviceLocalStrategy extends PassportStrategy(Strategy, 'device-local') {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'deviceId',  // Device ID as username
      passwordField: 'secretKey',     // API Key as password
    });
  }

  async validate(deviceId: string, secretKey: string): Promise<any> {
    const device = await this.authService.validateDevice(deviceId, secretKey);
    if (!device) {
      throw new UnauthorizedException('Invalid device credentials');
    }
    return device;
  }
}