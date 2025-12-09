import { HttpException, HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { Telemetry } from '../telemetry/entities/telemetry.entity';
import { Alert } from './entities/alert-rule.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class AlertsService {
  constructor(
    @InjectRepository(Alert)
    private readonly alertRepository: Repository<Alert>,
  ) {}

  async evaluateTelemetry(telemetryData: Telemetry) {
    const { deviceId, temperature, flowRate, power } = telemetryData;

    const rules = {
      maxTemperature: 40,
      maxFlowRate: 12,
      minPower: 1,
    };

    if (temperature > rules.maxTemperature) {
      await this.triggerViolation({
        deviceId,
        type: 'TEMPERATURE',
        value: temperature,
        limit: rules.maxTemperature,
        message: 'High temperature detected',
      });
    }

   

    if (flowRate > rules.maxFlowRate) {
      await this.triggerViolation({
        deviceId,
        type: 'FLOW_RATE',
        value: flowRate,
        limit: rules.maxFlowRate,
        message: 'High flow rate detected',
      });
    }

    if (power < rules.minPower) {
      await this.triggerViolation({
        deviceId,
        type: 'POWER',
        value: power,
        limit: rules.minPower,
        message: 'Low power detected',
      });
    }
  }

  private async triggerViolation(data: any) {
    const alert = this.alertRepository.create({
      ...data,
      resolved: false,
      severity: 'HIGH',
    });

    await this.alertRepository.save(alert);
  }

  async findByDeviceIAd(deviceId: string): Promise<Alert[]> {
    const alerts = await this.alertRepository.find({
      where: { deviceId },
    });
    if (!alerts) {
      throw new HttpException('Alerts not found', HttpStatus.NOT_FOUND);
    }

    return alerts;
  }
}
