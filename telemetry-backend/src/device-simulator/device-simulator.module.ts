import { Module } from '@nestjs/common';
import { DeviceSimulatorService } from './device-simulator.service';
import { DevicesModule } from '../devices/devices.module';
import { DevicesController } from '../devices/devices.controller';
import { AlertRulesModule } from '../alert-rules/alert-rules.module';
import { TelemetryModule } from '../telemetry/telemetry.module';
import { DeviceSimulatorController } from './device-simulator.controller';

@Module({
  imports: [DevicesModule, AlertRulesModule, TelemetryModule],
  controllers: [DevicesController, DeviceSimulatorController],
  providers: [DeviceSimulatorService],
  exports: [DeviceSimulatorService],
})
export class DeviceSimulatorModule {}
