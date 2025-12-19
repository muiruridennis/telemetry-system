import { 
    IsString, 
    IsEnum, 
    IsOptional, 
    IsObject, 
    IsDateString,
    IsBoolean,
    IsUUID
  } from 'class-validator';
import { AlertSeverity, AlertStatus } from '../../../utils/enums/alertStatus.enum';
  
  export class CreateAlertDto {
    
    @IsString()
    name: string;
  
    @IsString()
    deviceId: string;
  
    @IsString()
    type: string;
  
    @IsString()
    description: string;
  
    @IsEnum(AlertSeverity)
    severity: AlertSeverity;
  
    @IsOptional()
    @IsEnum(AlertStatus)
    status?: AlertStatus = AlertStatus.ACTIVE;
  
    @IsOptional()
    @IsString()
    source?: string;
  
    @IsOptional()
    @IsObject()
    metadata?: Record<string, any>;
  
    @IsOptional()
    @IsObject()
    conditions?: Record<string, any>;
  
    @IsOptional()
    @IsDateString()
    triggeredAt?: Date ;
  
    @IsOptional()
    @IsBoolean()
    isSilenced?: boolean = false;
  
    @IsOptional()
    @IsString()
    silenceReason?: string;
  
    @IsOptional()
    @IsDateString()
    silenceExpiresAt?: string;
  
    @IsOptional()
    @IsUUID()
    telemetrySourceId?: string;
  
    @IsOptional()
    @IsString()
    message?: String;
    
    @IsOptional()
  @IsObject()
  data?: Record<string, any>;
  }