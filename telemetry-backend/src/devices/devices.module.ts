import { Module } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { DevicesController } from './devices.controller';
import { Device } from './entities/device.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { DeviceAuthController } from './device-auth.controller';

@Module({
  imports: [
    // 1. Database entities
    TypeOrmModule.forFeature([Device]),

    // 2. Configuration (for ConfigService)
    ConfigModule,

    // 3. JWT configuration for device tokens
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret:
          configService.get<string>('DEVICE_JWT_SECRET') ||
          'interview-secret-2025',
        signOptions: {
          expiresIn: '30d',
          issuer: 'telemetry-platform-device',
          audience: 'telemetry-api',
        },
      }),
    }),
  ],
  providers: [DevicesService],
  controllers: [DevicesController, DeviceAuthController],
  exports: [DevicesService],
})
export class DevicesModule {}
