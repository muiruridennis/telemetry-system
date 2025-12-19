import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { TelemetryModule } from './telemetry/telemetry.module';
import { AlertsModule } from './alerts/alerts.module';
import { ReportsModule } from './reports/reports.module';
import { UsersModule } from './users/users.module';
import { DevicesModule } from './devices/devices.module';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { DeviceSimulatorModule } from './device-simulator/device-simulator.module';
import { AlertRulesModule } from './alert-rules/alert-rules.module';
import * as Joi from 'joi';

@Module({
  imports: [
    // Config validation should be FIRST
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigService available globally
      envFilePath: '.env',
      validationSchema: Joi.object({
        // ============ DATABASE ============
        POSTGRES_HOST: Joi.string().required(),
        POSTGRES_PORT: Joi.number().port().required(),
        POSTGRES_USER: Joi.string().required(),
        POSTGRES_PASSWORD: Joi.string().required(),
        POSTGRES_DB: Joi.string().required(),

        // ============ REDIS ============
        REDIS_HOST: Joi.string().required(),
        REDIS_PORT: Joi.number().port().required(),

        // ============ APP CONFIG ============
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        PORT: Joi.number().port().default(3000),

        // ============ USER JWT ============
        JWT_SECRET: Joi.string().min(32).required(),
        JWT_REFRESH_TOKEN_SECRET: Joi.string().min(32).required(),
        JWT_REFRESH_TOKEN_EXPIRATION_TIME: Joi.string()
          .pattern(/^\d+[smhd]$/)
          .default('90d'),
        TOKEN_EXPIRATION_TIME: Joi.string()
          .pattern(/^\d+[smhd]$/)
          .default('30d'),

        // ============ DEVICE JWT ============
        DEVICE_JWT_SECRET: Joi.string().min(32).required(),
        DEVICE_JWT_REFRESH_SECRET: Joi.string().min(32).required(),
        DEVICE_ACCESS_TOKEN_EXPIRY: Joi.string()
          .pattern(/^\d+[smhd]$/)
          .default('30d'),
        DEVICE_REFRESH_TOKEN_EXPIRY: Joi.string()
          .pattern(/^\d+[smhd]$/)
          .default('90d'),

        
      }),
    }),

    DatabaseModule, // DatabaseModule should come early
    AuthModule,
    TelemetryModule,
    AlertsModule,
    ReportsModule,
    UsersModule,
    DevicesModule,
    DeviceSimulatorModule,
    AlertRulesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}