import { Module } from '@nestjs/common';
import { TelemetryService } from './telemetry.service';
import { TelemetryController } from './telemetry.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Telemetry } from './entities/telemetry.entity';
import { AlertsModule } from '../alerts/alerts.module';
import { DevicesModule } from '../devices/devices.module';
import { AlertRulesModule } from '../alert-rules/alert-rules.module';

@Module({
  imports: [TypeOrmModule.forFeature([Telemetry]),
   AlertsModule,
    DevicesModule, 
    AlertRulesModule
  ],
  providers: [TelemetryService],
  controllers: [TelemetryController],
  exports: [TelemetryService],
})
export class TelemetryModule {}
