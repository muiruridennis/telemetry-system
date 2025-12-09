import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { AlertsModule } from '../alerts/alerts.module';
import { TelemetryModule } from '../telemetry/telemetry.module';
import { DevicesModule } from '../devices/devices.module';

@Module({
  imports: [AlertsModule, TelemetryModule, DevicesModule],
  providers: [ReportsService],
  controllers: [ReportsController],
})
export class ReportsModule {}
