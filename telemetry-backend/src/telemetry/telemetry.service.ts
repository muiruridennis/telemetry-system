import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Telemetry } from './entities/telemetry.entity';
import { Repository, Between, LessThan } from 'typeorm';
import { CreateTelemetryDto } from './dto/create-telemetry.dto';
import { BatchTelemetryDto } from './dto/batch-telemetry.dto';
import { AlertsService } from '../alerts/alerts.service';
import { DevicesService } from '../devices/devices.service';
import { AlertRulesService } from '../alert-rules/alert-rules.service';

@Injectable()
export class TelemetryService {
  private readonly logger = new Logger(TelemetryService.name);

  constructor(
    @InjectRepository(Telemetry)
    private telemetryRepository: Repository<Telemetry>,
    private readonly alertsService: AlertsService,
    private readonly devicesService: DevicesService,
    private readonly alertRulesService: AlertRulesService,
  ) {}

  // ============ BATCH INGESTION (MAIN METHOD) ============
  async ingestBatch(batchTelemetryDto: BatchTelemetryDto, deviceId: string) {
    const { data } = batchTelemetryDto;

    if (!data || data.length === 0) {
      throw new BadRequestException('Telemetry data array cannot be empty');
    }

    // Validate device exists and is active
    const device = await this.devicesService.findByDeviceId(deviceId);

    const validatedData = data.map((telemetryDto) => {
      return {
        ...telemetryDto,
        device,
        receivedAt: new Date(),
      };
    });

    // Batch insert for performance
    const telemetryEntities = this.telemetryRepository.create(validatedData);
    const savedTelemetry =
      await this.telemetryRepository.save(telemetryEntities);

    // Update device last seen
    await this.devicesService.updateLastSeen(deviceId);

    // ✅ FIX: Use AlertRulesService instead of AlertsService
    await Promise.all(
      savedTelemetry.map((telemetry) =>
        this.alertRulesService
          .evaluateRules(deviceId, telemetry)
          .catch((err) => {
            this.logger.error(
              `Failed to evaluate alerts for telemetry ${telemetry.id}:`,
              err,
            );
          }),
      ),
    );

    this.logger.log(
      `Ingested ${savedTelemetry.length} records for device ${deviceId}`,
    );

    return {
      success: true,
      count: savedTelemetry.length,
      message: `Ingested ${savedTelemetry.length} telemetry records`,
    };
  }

  // ============ SINGLE RECORD ============
  async create(createTelemetryDto: CreateTelemetryDto, deviceId: string) {
    // Verify device exists and is active
    const device = await this.devicesService.validateDevice(deviceId);

    const telemetry = this.telemetryRepository.create({
      ...createTelemetryDto,
      device,
      receivedAt: new Date(),
    });

    const savedTelemetry = await this.telemetryRepository.save(telemetry);

    // Update device last seen
    await this.devicesService.updateLastSeen(deviceId);

    // Evaluate alerts
    await this.evaluateAlertsForTelemetry(savedTelemetry, deviceId);

    this.logger.log(`Created telemetry record for device ${deviceId}`);

    return savedTelemetry;
  }
  private async evaluateAlertsForTelemetry(
    telemetry: Telemetry,
    deviceId: string,
  ): Promise<void> {
    try {
      const telemetryData = {
        temperature: telemetry.temperature,
        humidity: telemetry.humidity,
        flowRate: telemetry.flowRate,
        current: telemetry.current,
        power: telemetry.power,
        cumulativePower: telemetry.cumulativePower,
      };

      await this.alertRulesService.evaluateRules(deviceId, telemetryData);

      this.logger.log(`Alert rules evaluated for device ${deviceId}`);
    } catch (error) {
      this.logger.error('Failed to evaluate alerts:', error);
    }
  }

  // ============ QUERY METHODS ============
  async findAll(
    page: number = 1,
    limit: number = 100,
    deviceId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    data: Telemetry[];
    total: number;
    page: number;
    pages: number;
  }> {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (deviceId) where.deviceId = deviceId;
    if (startDate || endDate) {
      where.timestamp = Between(
        startDate || new Date(0),
        endDate || new Date(),
      );
    }

    const [data, total] = await this.telemetryRepository.findAndCount({
      where,
      order: { timestamp: 'DESC' },
      skip,
      take: limit,
      relations: ['device'], // Include device relation if needed
    });

    const pages = Math.ceil(total / limit);

    return { data, total, page, pages };
  }

  async findByDeviceId(
    deviceIdentifier: string,
    page = 1,
    limit = 100,
    startDate?: Date,
    endDate?: Date,
  ) {
    const device = await this.devicesService.findByDeviceId(deviceIdentifier);

    const skip = (page - 1) * limit;

    const where: any = { deviceId: device.id };

    if (startDate || endDate) {
      where.timestamp = Between(
        startDate || new Date(0),
        endDate || new Date(),
      );
    }

    const [data, total] = await this.telemetryRepository.findAndCount({
      where,
      order: { timestamp: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async getLatestByDeviceId(
    deviceIdentifier: string,
  ): Promise<Telemetry | null> {
    try {
      // First, find the device by its human-readable deviceId
      const device = await this.devicesService.findByDeviceId(deviceIdentifier);
      if (!device) {
        throw new NotFoundException(
          `Device with identifier ${deviceIdentifier} not found`,
        );
      }

      // Now query telemetry using the device's UUID (primary key)
      const telemetry = await this.telemetryRepository.findOne({
        where: { deviceId: device.id }, // Use device.id (UUID) not device.deviceId (string)
        order: { timestamp: 'DESC' },
      });

      return telemetry || null;
    } catch (error) {
      this.logger.error(
        `Error getting latest telemetry for device ${deviceIdentifier}:`,
        error,
      );
      throw error;
    }
  }

  async getByDeviceId(
    deviceIdentifier: string,
    limit: number = 100,
  ): Promise<Telemetry[]> {
    try {
      // Find the device by its human-readable deviceId
      const device = await this.devicesService.findByDeviceId(deviceIdentifier);
      if (!device) {
        throw new NotFoundException(
          `Device with identifier ${deviceIdentifier} not found`,
        );
      }

      // Query telemetry using the device's UUID
      return await this.telemetryRepository.find({
        where: { deviceId: device.id },
        order: { timestamp: 'DESC' },
        take: limit,
      });
    } catch (error) {
      this.logger.error(
        `Error getting telemetry for device ${deviceIdentifier}:`,
        error,
      );
      throw error;
    }
  }

  async getDeviceTelemetrySummary(deviceId: string): Promise<any> {
    // Verify device exists
    await this.devicesService.findByDeviceId(deviceId);

    const total = await this.telemetryRepository.count({ where: { deviceId } });

    const latest = await this.getLatestByDeviceId(deviceId);

    const earliest = await this.telemetryRepository.findOne({
      where: { deviceId },
      order: { timestamp: 'ASC' },
    });

    // Calculate averages for structured columns
    const averages = await this.telemetryRepository
      .createQueryBuilder('telemetry')
      .select([
        'AVG(telemetry.temperature) as avg_temperature',
        'AVG(telemetry.current) as avg_current',
        'AVG(telemetry.flowRate) as avg_flowRate',
        'AVG(telemetry.humidity) as avg_humidity',
        'AVG(telemetry.power) as avg_power',
      ])
      .where('telemetry.deviceId = :deviceId', { deviceId })
      .getRawOne();

    // Get status distribution
    const statusCounts = await this.telemetryRepository
      .createQueryBuilder('telemetry')
      .select('telemetry.status, COUNT(*) as count')
      .where('telemetry.deviceId = :deviceId', { deviceId })
      .groupBy('telemetry.status')
      .getRawMany();

    return {
      deviceId,
      totalRecords: total,
      timeRange: {
        earliest: earliest?.timestamp,
        latest: latest?.timestamp,
      },
      latestReading: {
        timestamp: latest.timestamp,
        temperature: latest.temperature,
        current: latest.current,
        flowRate: latest.flowRate,
        humidity: latest.humidity,
        power: latest.power,
        cumulativePower: latest.cumulativePower,
        status: latest.status,
      },
      averages: {
        temperature: parseFloat(averages.avg_temperature) || 0,
        current: parseFloat(averages.avg_current) || 0,
        flowRate: parseFloat(averages.avg_flowRate) || 0,
        humidity: parseFloat(averages.avg_humidity) || 0,
        power: parseFloat(averages.avg_power) || 0,
      },
      statusDistribution: statusCounts.reduce((acc, curr) => {
        acc[curr.status] = parseInt(curr.count);
        return acc;
      }, {}),
    };
  }

  // ============ ANALYTICS METHODS ============
  async getDeviceMetricsTrend(
    deviceId: string,
    metric: keyof Telemetry,
    days: number = 7,
  ): Promise<{ date: string; value: number }[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const results = await this.telemetryRepository
      .createQueryBuilder('telemetry')
      .select([
        `DATE(telemetry.timestamp) as date`,
        `AVG(telemetry.${metric}) as value`,
      ])
      .where('telemetry.deviceId = :deviceId', { deviceId })
      .andWhere('telemetry.timestamp >= :startDate', { startDate })
      .groupBy('DATE(telemetry.timestamp)')
      .orderBy('date', 'ASC')
      .getRawMany();

    return results.map((row) => ({
      date: row.date,
      value: parseFloat(row.value) || 0,
    }));
  }

  async findAnomalies(
    deviceId?: string,
    startDate?: Date,
    endDate?: Date,
    page: number = 1,
    limit: number = 100,
  ): Promise<{
    data: Telemetry[];
    total: number;
    page: number;
    pages: number;
  }> {
    const skip = (page - 1) * limit;

    const where: any = { isAnomaly: true };
    if (deviceId) where.deviceId = deviceId;
    if (startDate || endDate) {
      where.timestamp = Between(
        startDate || new Date(0),
        endDate || new Date(),
      );
    }

    const [data, total] = await this.telemetryRepository.findAndCount({
      where,
      order: { timestamp: 'DESC' },
      skip,
      take: limit,
    });

    const pages = Math.ceil(total / limit);

    return { data, total, page, pages };
  }

  // ============ CLEANUP METHODS ============
  async removeOldData(
    retentionDays: number = 90,
  ): Promise<{ deleted: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await this.telemetryRepository
      .createQueryBuilder()
      .delete()
      .where('timestamp < :cutoffDate', { cutoffDate })
      .execute();

    this.logger.log(
      `Cleaned up ${result.affected || 0} telemetry records older than ${retentionDays} days`,
    );

    return { deleted: result.affected || 0 };
  }

  async removeByDeviceId(deviceId: string): Promise<{ deleted: number }> {
    const result = await this.telemetryRepository.delete({ deviceId });

    this.logger.log(
      `Deleted ${result.affected || 0} telemetry records for device ${deviceId}`,
    );

    return { deleted: result.affected || 0 };
  }

  async remove(id: string): Promise<void> {
    const result = await this.telemetryRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Telemetry record ${id} not found`);
    }

    this.logger.log(`Deleted telemetry record ${id}`);
  }

  // ============ STATISTICS ============
  async getSystemStats(timeframe: '24h' | '7d' | '30d' = '24h'): Promise<any> {
    const now = new Date();
    let startDate: Date;

    switch (timeframe) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    const totalRecords = await this.telemetryRepository.count();

    const recentRecords = await this.telemetryRepository.count({
      where: { timestamp: Between(startDate, now) },
    });

    const uniqueDevices = await this.telemetryRepository
      .createQueryBuilder('telemetry')
      .select('COUNT(DISTINCT telemetry.deviceId)', 'count')
      .getRawOne();

    const anomaliesCount = await this.telemetryRepository.count({
      where: { isAnomaly: true, timestamp: Between(startDate, now) },
    });

    // Get most active devices
    const mostActiveDevices = await this.telemetryRepository
      .createQueryBuilder('telemetry')
      .select('telemetry.deviceId, COUNT(*) as count')
      .where('telemetry.timestamp >= :startDate', { startDate })
      .groupBy('telemetry.deviceId')
      .orderBy('count', 'DESC')
      .limit(5)
      .getRawMany();

    return {
      timeframe,
      totalRecords,
      recentRecords,
      uniqueDevices: parseInt(uniqueDevices.count) || 0,
      anomaliesCount,
      mostActiveDevices: mostActiveDevices.map((device) => ({
        deviceId: device.deviceId,
        records: parseInt(device.count),
      })),
      avgRecordsPerDay:
        timeframe === '24h'
          ? recentRecords
          : recentRecords / (timeframe === '7d' ? 7 : 30),
    };
  }

  // ============ HEALTH CHECK ============
  async getDeviceHealth(deviceId: string, hours: number = 24): Promise<any> {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

    const recentRecords = await this.telemetryRepository.count({
      where: { deviceId, timestamp: Between(cutoff, new Date()) },
    });

    const latest = await this.getLatestByDeviceId(deviceId).catch(() => null);

    const statusCounts = await this.telemetryRepository
      .createQueryBuilder('telemetry')
      .select('telemetry.status, COUNT(*) as count')
      .where('telemetry.deviceId = :deviceId', { deviceId })
      .andWhere('telemetry.timestamp >= :cutoff', { cutoff })
      .groupBy('telemetry.status')
      .getRawMany();

    const avgInterval = await this.calculateAverageInterval(deviceId, hours);

    return {
      deviceId,
      timeframeHours: hours,
      isOnline: latest && latest.timestamp > cutoff,
      lastSeen: latest?.timestamp,
      recordsInTimeframe: recentRecords,
      expectedRecords: Math.floor((hours * 60) / (avgInterval || 5)), // Assuming 5 min intervals
      statusDistribution: statusCounts,
      dataGap:
        avgInterval > 300 ? `${Math.round(avgInterval / 60)} minutes` : null, // > 5 min gap
      healthScore: this.calculateHealthScore(
        recentRecords,
        latest,
        avgInterval,
      ),
    };
  }

  private async calculateAverageInterval(
    deviceId: string,
    hours: number,
  ): Promise<number> {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

    const timestamps = await this.telemetryRepository
      .createQueryBuilder('telemetry')
      .select('telemetry.timestamp')
      .where('telemetry.deviceId = :deviceId', { deviceId })
      .andWhere('telemetry.timestamp >= :cutoff', { cutoff })
      .orderBy('telemetry.timestamp', 'ASC')
      .getMany();

    if (timestamps.length < 2) return 0;

    let totalDiff = 0;
    for (let i = 1; i < timestamps.length; i++) {
      const diff =
        timestamps[i].timestamp.getTime() -
        timestamps[i - 1].timestamp.getTime();
      totalDiff += diff;
    }

    return totalDiff / (timestamps.length - 1) / 1000; // Return in seconds
  }

  private calculateHealthScore(
    recentRecords: number,
    latest: Telemetry | null,
    avgInterval: number,
  ): number {
    let score = 100;

    // Deduct for no recent data
    if (recentRecords === 0) score -= 50;

    // Deduct for old data
    if (latest) {
      const hoursSinceLast =
        (Date.now() - latest.timestamp.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLast > 24) score -= 30;
      else if (hoursSinceLast > 6) score -= 15;
      else if (hoursSinceLast > 1) score -= 5;
    }

    // Deduct for irregular intervals
    if (avgInterval > 300) score -= 10; // > 5 min average interval
    if (avgInterval > 600) score -= 20; // > 10 min average interval

    return Math.max(0, Math.min(100, score));
  }
}
