import { IsArray, IsEnum, IsIn, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { AlertSeverity } from '../../../utils/enums/alertStatus.enum';
export class CreateAlertRuleDto {
    @IsString()
    name: string;
  
    @IsString()
    @IsOptional()
    description?: string;
  
    @IsArray()
    @ValidateNested({ each: true })
    conditions: RuleConditionDto[];
  
    @IsEnum(AlertSeverity)
    severity: AlertSeverity;
  
    @IsNumber()
    @IsOptional()
    cooldownMinutes?: number = 30;
  
    @IsString()
    @IsOptional()
    deviceType?: string;
  }
  
  // dto/rule-condition.dto.ts
  export class RuleConditionDto {
    @IsIn(['temperature', 'humidity', 'flowRate', 'power', 'current', 'cumulativePower'])
    metric: string;
  
    @IsIn(['gt', 'lt', 'gte', 'lte', 'eq', 'neq'])
    operator: string;
  
    @IsNumber()
    value: number;
  
    @IsString()
    @IsOptional()
    duration?: string;
  }