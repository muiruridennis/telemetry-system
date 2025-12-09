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

@Module({
  imports: [
    AuthModule,
    TelemetryModule,
    AlertsModule,
    ReportsModule,
    UsersModule,
    DevicesModule,
    DatabaseModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
