import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlertRule } from './entities/alert-rule.entity';
import { AlertsService } from '../alerts/alerts.service';
import { CreateAlertDto } from '../alerts/dto/create-alert.dto';
import { AlertSeverity, AlertStatus } from '../../utils/enums/alertStatus.enum';
import { CreateAlertRuleDto } from './dto/create-alert-rule.dto';
import { PostgresErrorCode } from '../database/postgresErrorCodes.enum';
import { log } from 'console';

export interface RuleCondition {
  metric:
    | 'temperature'
    | 'humidity'
    | 'flowRate'
    | 'power'
    | 'current'
    | 'cumulativePower';
  operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq' | 'neq';
  value: number;
}

@Injectable()
export class AlertRulesService {
  private readonly logger = new Logger(AlertRulesService.name);

  private readonly defaultRules = [
    {
      name: 'High Temperature & Flow',
      description: 'Temperature > 40°C AND Flow Rate > 12 m³/h',
      conditions:
        '[{"metric":"temperature","operator":"gt","value":40},{"metric":"flowRate","operator":"gt","value":12}]',
      severity: AlertSeverity.CRITICAL,
      cooldownMinutes: 30,
      isActive: true,
    },
    {
      name: 'Power Outage',
      description: 'Power = 0 (No power at site)',
      conditions: '[{"metric":"power","operator":"eq","value":0}]',
      severity: AlertSeverity.CRITICAL,
      cooldownMinutes: 15,
      isActive: true,
    },
  ];

  constructor(
    @InjectRepository(AlertRule)
    private readonly alertRuleRepository: Repository<AlertRule>,
    private readonly alertsService: AlertsService,
  ) {}

  /* ----------------------- Initialization ----------------------- */

  async initializeDefaultRules(): Promise<void> {
    const count = await this.alertRuleRepository.count();

    if (count === 0) {
      for (const rule of this.defaultRules) {
        await this.alertRuleRepository.save(
          this.alertRuleRepository.create(rule),
        );
      }
      this.logger.log('Default alert rules created');
    }
  }

  /* ----------------------- Rule Evaluation ----------------------- */

  async evaluateRules(deviceId: string, telemetryData: any): Promise<void> {
    const rules = await this.alertRuleRepository.find({
      where: { isActive: true },
    });

    for (const rule of rules) {
      const conditions = JSON.parse(rule.conditions) as RuleCondition[];

      const allConditionsMet = conditions.every((condition) =>
        this.evaluateCondition(condition, telemetryData),
      );

      if (!allConditionsMet) continue;

      const inCooldown = await this.isAlertInCooldown(rule.name, deviceId);
      if (!inCooldown) {
        await this.createAlertFromRule(rule, deviceId, telemetryData);
      }
    }
  }

  private evaluateCondition(condition: RuleCondition, data: any): boolean {
    const value = data[condition.metric];
    if (value === undefined) return false;

    switch (condition.operator) {
      case 'gt':
        return value > condition.value;
      case 'lt':
        return value < condition.value;
      case 'gte':
        return value >= condition.value;
      case 'lte':
        return value <= condition.value;
      case 'eq':
        return value === condition.value;
      case 'neq':
        return value !== condition.value;
      default:
        return false;
    }
  }

  private async isAlertInCooldown(
    ruleName: string,
    deviceId: string,
  ): Promise<boolean> {
    const rule = await this.alertRuleRepository.findOne({
      where: { name: ruleName },
    });

    if (!rule) return false;

    const recentAlert = await this.alertsService.checkRecentAlert(
      deviceId,
      ruleName,
      rule.cooldownMinutes,
    );

    return recentAlert !== null;
  }

  private async createAlertFromRule(
    rule: AlertRule,
    deviceId: string,
    telemetryData: any,
  ): Promise<void> {
    const conditions = JSON.parse(rule.conditions) as RuleCondition[];

    const conditionText = conditions
      .map((c) => `${c.metric} ${c.operator} ${c.value}`)
      .join(' AND ');

    const createAlertDto: CreateAlertDto = {
      name: rule.name,
      deviceId,
      type: rule.name,
      description: rule.description || conditionText,
      severity: rule.severity,
      message: `${rule.name}: ${conditionText}`,
      data: {
        ruleId: rule.id,
        currentValues: {
          temperature: telemetryData.temperature,
          humidity: telemetryData.humidity,
          flowRate: telemetryData.flowRate,
          current: telemetryData.current,
          power: telemetryData.power,
          cumulativePower: telemetryData.cumulativePower,
        },
      },
      triggeredAt: new Date(),
      status: AlertStatus.ACTIVE,
    };

    await this.alertsService.createAlert(createAlertDto);
  }

  /* ----------------------- CRUD ----------------------- */

  async findAll(): Promise<AlertRule[]> {
    return  await this.alertRuleRepository.find();
  }

  async findOne(id: string): Promise<AlertRule> {
    const rule = await this.alertRuleRepository.findOne({ where: { id } });

    if (!rule) {
      throw new NotFoundException(`Alert rule with ID ${id} not found`);
    }

    return rule;
  }

  async create(createRuleDto: CreateAlertRuleDto): Promise<AlertRule> {
    try {
      this.validateConditions(createRuleDto.conditions);

      const rule = await  this.alertRuleRepository.create({
        ...createRuleDto,
        conditions: JSON.stringify(createRuleDto.conditions),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return await  this.alertRuleRepository.save(rule);
    } catch (error) {
      this.logger.log("error", error.code);
      if (error.code === PostgresErrorCode.UniqueViolation) {
        throw new HttpException(
          'Alert rule with that name already exists',
          HttpStatus.BAD_REQUEST,
        );
      } else {
        throw new HttpException(
          'Something went wrong',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  async update(id: string, updates: Partial<AlertRule>): Promise<AlertRule> {
    const rule = await this.findOne(id);

    Object.assign(rule, updates);
    rule.updatedAt = new Date();

    return this.alertRuleRepository.save(rule);
  }

  async remove(id: string): Promise<{ message: string }> {
    const rule = await this.findOne(id);

    await this.alertRuleRepository.remove(rule);

    return {
      message: 'Alert rule deleted successfully',
    };
  }

  async updateStatus(id: string, isActive: boolean): Promise<AlertRule> {
    const rule = await this.findOne(id);

    rule.isActive = isActive;
    rule.updatedAt = new Date();

    return this.alertRuleRepository.save(rule);
  }

  /* ----------------------- Testing ----------------------- */

  async testRule(
    id: string,
    testData: any,
  ): Promise<{
    triggered: boolean;
    conditions: Array<{
      condition: RuleCondition;
      value: any;
      result: boolean;
    }>;
    message: string;
  }> {
    const rule = await this.findOne(id);

    const conditions = JSON.parse(rule.conditions) as RuleCondition[];

    const evaluationResults = conditions.map((condition) => ({
      condition,
      value: testData[condition.metric],
      result: this.evaluateCondition(condition, testData),
    }));

    const triggered = evaluationResults.every((r) => r.result);

    return {
      triggered,
      conditions: evaluationResults,
      message: triggered
        ? `Rule "${rule.name}" would trigger with given data`
        : `Rule "${rule.name}" would NOT trigger. Failed conditions: ${evaluationResults
            .filter((r) => !r.result)
            .map(
              (r) =>
                `${r.condition.metric} ${r.condition.operator} ${r.condition.value} (got ${r.value})`,
            )
            .join(', ')}`,
    };
  }

  /* ----------------------- Validation ----------------------- */

  private validateConditions(conditions: any[]): void {
    if (!Array.isArray(conditions)) {
      throw new BadRequestException('Conditions must be an array');
    }

    if (conditions.length === 0) {
      throw new BadRequestException('At least one condition is required');
    }

    const validMetrics = [
      'temperature',
      'humidity',
      'flowRate',
      'power',
      'current',
      'cumulativePower',
    ];

    const validOperators = ['gt', 'lt', 'gte', 'lte', 'eq', 'neq'];

    conditions.forEach((condition, index) => {
      if (!validMetrics.includes(condition.metric)) {
        throw new BadRequestException(`Condition ${index + 1}: Invalid metric`);
      }

      if (!validOperators.includes(condition.operator)) {
        throw new BadRequestException(
          `Condition ${index + 1}: Invalid operator`,
        );
      }

      if (typeof condition.value !== 'number') {
        throw new BadRequestException(
          `Condition ${index + 1}: Value must be a number`,
        );
      }
    });
  }
}
