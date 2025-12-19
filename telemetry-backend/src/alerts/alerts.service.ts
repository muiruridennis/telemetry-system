import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, MoreThan, Repository } from 'typeorm';
import { CreateAlertDto } from './dto/create-alert.dto';
import { Alert } from './entities/alert.entity';
import { AlertStatus } from '../../utils/enums/alertStatus.enum';

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(
    @InjectRepository(Alert)
    private alertsRepository: Repository<Alert>,
  ) {}

  /**
   * Create a new alert
   */
  async createAlert(createAlertDto: CreateAlertDto): Promise<Alert> {
    // Check if similar alert already exists (avoid duplicates)
    const similarAlert = await this.alertsRepository.findOne({
      where: {
        deviceId: createAlertDto.deviceId,
        type: createAlertDto.type,
        status: AlertStatus.ACTIVE,
        // Check if alert was triggered recently (last 30 minutes)
        triggeredAt: MoreThan(new Date(Date.now() - 30 * 60 * 1000)),
      },
    });

    if (similarAlert) {
      this.logger.debug(
        `Similar alert already exists for device ${createAlertDto.deviceId}`,
      );
      return similarAlert;
    }

    const alert = this.alertsRepository.create({
      ...createAlertDto,
      status: AlertStatus.ACTIVE,
      acknowledgedBy: null,
      acknowledgedAt: null,
      resolvedAt: null,
    });

    const savedAlert = await this.alertsRepository.save(alert);

    // Log the alert
    this.logger.log(
      `Alert created: ${savedAlert.type} for device ${savedAlert.deviceId}`,
    );

    // TODO: Send notifications (email, SMS, webhook)
    // await this.sendNotifications(savedAlert);

    return savedAlert;
  }

  /**
   * Acknowledge an alert (admin only)
   */
  async acknowledgeAlert(alertId: string, userId: string): Promise<Alert> {
    const alert = await this.alertsRepository.findOneBy({ id: alertId });

    if (!alert) {
      throw new NotFoundException('Alert not found');
    }

    alert.status = AlertStatus.ACKNOWLEDGED;
    alert.acknowledgedBy = userId;
    alert.acknowledgedAt = new Date();

    return this.alertsRepository.save(alert);
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: string): Promise<Alert> {
    const alert = await this.alertsRepository.findOneBy({ id: alertId });

    if (!alert) {
      throw new NotFoundException('Alert not found');
    }

    alert.status = AlertStatus.RESOLVED;
    alert.resolvedAt = new Date();

    return this.alertsRepository.save(alert);
  }

  /**
   * Clear all alerts for a device
   */
  async clearDeviceAlerts(deviceId: string): Promise<{ cleared: number }> {
    const result = await this.alertsRepository.update(
      { deviceId, status: AlertStatus.ACTIVE },
      { status: AlertStatus.RESOLVED, resolvedAt: new Date() },
    );

    return { cleared: result.affected || 0 };
  }

  /**
   * Get alert summary for reporting
   */
  async getAlertSummary(
    deviceId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<AlertSummary> {
  
    const baseQuery = this.alertsRepository.createQueryBuilder('alert');
  
    if (deviceId) {
      baseQuery.andWhere('alert.deviceId = :deviceId', { deviceId });
    }
  
    if (startDate || endDate) {
      baseQuery.andWhere('alert.triggeredAt BETWEEN :start AND :end', {
        start: startDate || new Date(0),
        end: endDate || new Date(),
      });
    }
  
    // total count
    const total = await baseQuery.clone().getCount();
  
    // by status
    const byStatus = await baseQuery
      .clone()
      .select('alert.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('alert.status')
      .getRawMany();
  
    // by severity
    const bySeverity = await baseQuery
      .clone()
      .select('alert.severity', 'severity')
      .addSelect('COUNT(*)', 'count')
      .groupBy('alert.severity')
      .getRawMany();
  
    // by type
    const byType = await baseQuery
      .clone()
      .select('alert.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('alert.type')
      .getRawMany();
  
    // recent alerts (ordering is valid here)
    const recentAlerts = await baseQuery
      .clone()
      .orderBy('alert.triggeredAt', 'DESC')
      .limit(10)
      .getMany();
  
    return {
      total,
      byStatus: byStatus.reduce((a, c) => ({ ...a, [c.status]: +c.count }), {}),
      bySeverity: bySeverity.reduce((a, c) => ({ ...a, [c.severity]: +c.count }), {}),
      byType: byType.reduce((a, c) => ({ ...a, [c.type]: +c.count }), {}),
      recentAlerts,
    };
  }
  
  
  // In alerts.service.ts - ADD this method
  async checkRecentAlert(
    deviceId: string,
    alertType: string,
    cooldownMinutes: number,
  ): Promise<Alert | null> {
    const cooldownMs = cooldownMinutes * 60 * 1000;

    return await this.alertsRepository.findOne({
      where: {
        deviceId,
        type: alertType,
        status: AlertStatus.ACTIVE,
        triggeredAt: MoreThan(new Date(Date.now() - cooldownMs)),
      }as FindOptionsWhere<Alert>,
    });
  }
}

export interface AlertSummary {
  total: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
  byStatus: Record<string, number>;
  recentAlerts: Alert[];
}
