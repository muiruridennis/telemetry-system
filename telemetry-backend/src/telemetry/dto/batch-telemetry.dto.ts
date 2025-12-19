import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateTelemetryDto } from './create-telemetry.dto';

export class BatchTelemetryDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one telemetry record is required' })
  @ValidateNested({ each: true })
  @Type(() => CreateTelemetryDto)
  data: CreateTelemetryDto[];
}