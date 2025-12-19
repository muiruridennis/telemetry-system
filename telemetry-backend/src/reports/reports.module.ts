import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { AlertsModule } from '../alerts/alerts.module';
import { TelemetryModule } from '../telemetry/telemetry.module';
import { DevicesModule } from '../devices/devices.module';
import { ReportService } from './reports.service';

@Module({
  imports: [AlertsModule, TelemetryModule, DevicesModule, AlertsModule],
  providers: [ReportService],
  controllers: [ReportsController],
})
export class ReportsModule {}
