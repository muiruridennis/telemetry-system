// device-auth.controller.ts
import { Controller, Post, Body, UseGuards, UnauthorizedException, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { DevicesService } from '../devices/devices.service';
import { DeviceLoginDto, DeviceRefreshDto } from './dto/index.dto';

@Controller('auth/device')
export class DeviceAuthController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post('login')
  async login(@Body() loginDto: DeviceLoginDto) {
    const { deviceId, secretKey } = loginDto;
    
    const result = await this.devicesService.validateDeviceCredentials(deviceId, secretKey);
    
    if (!result?.device) {
      switch (result?.reason) {
        case 'DEVICE_NOT_FOUND':
          throw new NotFoundException('Device not found');
        case 'DEVICE_INACTIVE':
          throw new ForbiddenException('Device is inactive. Contact administrator.');
        case 'MISSING_SECRET_KEY':
          throw new BadRequestException('Device configuration error');
        default:
          throw new ForbiddenException('Invalid credentials');
      }
    }
  
    // Proceed with token generation...
    await this.devicesService.updateLastSeen(deviceId);
    const tokens = await this.devicesService.generateDeviceTokens(result.device);
    
    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      token_type: 'Bearer',
      expires_in: 2592000,
      device: {
        id: result.device.deviceId,
        name: result.device.name,
        type: result.device.type,
      },
    };
  }
  

  @Post('refresh')
  async refresh(@Body() refreshDto: DeviceRefreshDto) {
    const { deviceId, refreshToken } = refreshDto;
    
    const tokens = await this.devicesService.refreshDeviceTokens(deviceId, refreshToken);
    
    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      token_type: 'Bearer',
    };
  }
}

