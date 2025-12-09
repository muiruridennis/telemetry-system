
export class CreateTelemetryDto {
  deviceId: string;
  temperature: number;
  humidity: number;
  pressure: number;
  voltage: number;
  current: number;
  flowRate: number;
  power: number;
  status: string;
  cumulativePower: number;
}
