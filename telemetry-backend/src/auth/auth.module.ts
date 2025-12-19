import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport'; 
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config'; 
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './strategies/jwt.strategy'; 
import { DeviceJwtStrategy } from './strategies/device-jwt.strategy'; 
import { JwtAuthenticationGuard } from './guards/jwt-auth.guard'; 
import { DeviceJwtGuard } from './guards/device-auth.guard'; 
import { LocalStrategy } from './strategies/local.strategy';
import { DevicesModule } from '../devices/devices.module';

@Module({
  imports: [
    UsersModule,
    DevicesModule,
    PassportModule,
    ConfigModule, // ADD for environment variables
    JwtModule.registerAsync({ // Use async for config
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'interview-secret-2025',
        signOptions: {
          expiresIn: '30d',
          issuer: 'iot-platform',
        },
      }),
    }),
  ],
  providers: [
    AuthService,
    JwtStrategy,          
    DeviceJwtStrategy,    
    JwtAuthenticationGuard,        
    DeviceJwtGuard,   
    LocalStrategy  
  ],
  controllers: [AuthController],
  exports: [
    AuthService,
  ],
})
export class AuthModule {}