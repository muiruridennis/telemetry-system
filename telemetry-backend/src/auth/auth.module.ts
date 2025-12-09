import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport'; 
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config'; 
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './strategies/jwt.strategy'; 
import { DeviceJwtStrategy } from './strategies/device-jwt.strategy'; 
import { JwtAuthGuard } from './guards/jwt-auth.guard'; 
import { DeviceAuthGuard } from './guards/device-auth.guard'; 

@Module({
  imports: [
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),  
    ConfigModule, // ADD for environment variables
    JwtModule.registerAsync({ // Use async for config
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'interview-secret-2025',
        signOptions: {
          expiresIn: '1d',
          issuer: 'iot-platform',
        },
      }),
    }),
  ],
  providers: [
    AuthService,
    JwtStrategy,          
    DeviceJwtStrategy,    
    JwtAuthGuard,        
    DeviceAuthGuard,     
  ],
  controllers: [AuthController],
  exports: [
    AuthService,
    JwtModule,           // Export so other modules can use JwtService
    JwtAuthGuard,        // Export guards
    DeviceAuthGuard,
  ],
})
export class AuthModule {}