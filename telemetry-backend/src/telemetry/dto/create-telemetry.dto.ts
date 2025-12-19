import {
  IsNumber,
  IsOptional,
  IsDateString,
  IsString,
  IsIn,
  Min,
  Max,
  IsObject,
  IsNotEmpty,
  ValidateIf,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DeviceStatus } from '../../../utils/enums/deviceStatus.enum';

export class CreateTelemetryDto {
  @IsDateString()
  @IsNotEmpty()
  timestamp: Date;

  // ============ REQUIRED FIELDS ============
  @IsNumber()
  @Min(-50, { message: 'Temperature cannot be below -50°C' })
  @Max(100, { message: 'Temperature cannot exceed 100°C' })
  @Type(() => Number)
  temperature: number;

  @IsNumber()
  @Min(0, { message: 'Current cannot be negative' })
  @Type(() => Number)
  current: number;

  @IsNumber()
  @Min(0, { message: 'Flow rate cannot be negative' })
  @Type(() => Number)
  flowRate: number;

  // ============ OPTIONAL FIELDS ============
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Humidity cannot be negative' })
  @Max(100, { message: 'Humidity cannot exceed 100%' })
  @Type(() => Number)
  humidity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Power cannot be negative' })
  @Type(() => Number)
  power?: number;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Cumulative power cannot be negative' })
  @Type(() => Number)
  cumulativePower?: number;

  @IsOptional()
  @IsEnum(DeviceStatus)
  status?: DeviceStatus;

  // ============ ADDITIONAL FIELDS ============
  @IsOptional()
  @IsObject()
  tags?: Record<string, string>;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  // Device ID will come from JWT token, but we can still validate if provided
  @IsOptional()
  @IsString()
  deviceId?: string;
}
