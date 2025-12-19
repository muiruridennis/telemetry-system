export interface Device {
    id: string;
    name: string;
    deviceId: string;
    type: DeviceType;
    location: string;
    secretKey: string;
    isActive: boolean;
    lastSeen?: Date;
    createdAt?: Date;
    status?: DeviceStatus;
  }
  
  export type DeviceType = 
    | 'leak_detector' 
    | 'water_pump'
    | 'hvac'
    | 'temperature_sensor'
    | 'humidity_sensor'
    | 'flow_meter'
    | 'power_meter'
    | 'combined_sensor';
  
  export enum DeviceStatus {
    ONLINE = 'online',
    OFFLINE = 'offline',
    WARNING = 'warning',
    ERROR = 'error'
  }
  
  export interface TelemetryData {
    id?: string;
    deviceId: string;
    timestamp: Date;
    temperature?: number;
    humidity?: number;
    flowRate?: number;
    power?: number;
    cumulativePower?: number;
    current?: number;
    status?: DeviceStatus;
    tags?: Record<string, any>;
    metadata?: Record<string, any>;
  }
  
  export interface Alert {
    id: string;
    name: string;
    type: string;
    deviceId: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'active' | 'resolved' | 'acknowledged';
    source?: string;
    metadata?: Record<string, any>;
    conditions?: any;
    data?: {
      ruleId: string;
      currentValues: {
        power: number;
        current: number;
        flowRate: number;
        humidity: number;
        temperature: number;
        cumulativePower: number;
      };
    };
    triggeredAt: Date;
    resolvedAt?: Date;
    acknowledgedAt?: Date;
    acknowledgedBy?: string;
    createdAt: Date;
    updatedAt: Date;
    isSilenced: boolean;
    silenceReason?: string;
    silenceExpiresAt?: Date;
    // Legacy fields for compatibility
    alertType?: string;
    message?: string;
    isResolved?: boolean;
    resolvedBy?: string;
    resolvedNote?: string;
    dataSnapshot?: Partial<TelemetryData>;
    ruleId?: string;
  }
  
  export type AlertType = 
    | 'high_temperature' 
    | 'high_flow_rate' 
    | 'power_outage' 
    | 'device_offline'
    | 'low_battery'
    | 'high_humidity'
    | 'custom_rule';
  
  export interface SimulationConfig {
    deviceIds: string[];
    intervalMinutes: number;
    anomalyChance: number;
    powerOutageChance: number;
  }
  
  export interface DeviceSimulationState {
    activeDevices: string[];
    deviceStates: Record<string, any>;
    isRunning: boolean;
  }
  
  export interface ScenarioTrigger {
    deviceId: string;
    scenario: 'power_outage' | 'high_temp' | 'high_flow';
  }