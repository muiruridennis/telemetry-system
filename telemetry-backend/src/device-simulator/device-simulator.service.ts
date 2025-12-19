import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DevicesService } from '../devices/devices.service';
import { TelemetryService } from '../telemetry/telemetry.service';
import { AlertRulesService } from '../alert-rules/alert-rules.service';
import { Device } from '../devices/entities/device.entity';
import { DeviceStatus } from '../../utils/enums/deviceStatus.enum';

export interface SimulationConfig {
  deviceIds: string[];
  intervalMinutes: number;
  anomalyChance: number;
  powerOutageChance: number;
}

// Simplified - remove unused alertState
export interface DeviceState {
  deviceId: string;
  currentTemperature: number;
  currentHumidity: number;
  currentFlowRate: number;
  currentCurrent: number;
  currentPower: number;
  cumulativePower: number;
  isPowerOutage: boolean;
}

@Injectable()
export class DeviceSimulatorService {
  private readonly logger = new Logger(DeviceSimulatorService.name);
  private simulationInterval: NodeJS.Timeout;
  private deviceStates: Map<string, DeviceState> = new Map();

  private readonly SIMULATION_PARAMS = {
    leak_detector: {
      tempRange: { min: 15, max: 35 },
      humidityRange: { min: 60, max: 90 },
      flowRange: { min: 0, max: 5 },
      currentRange: { min: 0.1, max: 0.5 },
      powerRange: { min: 2.4, max: 12 },
    },
    water_pump: {
      tempRange: { min: 20, max: 45 },
      humidityRange: { min: 40, max: 80 },
      flowRange: { min: 50, max: 250 },
      currentRange: { min: 10, max: 100 },
      powerRange: { min: 2400, max: 24000 },
    },
    hvac: {
      tempRange: { min: 18, max: 30 },
      humidityRange: { min: 30, max: 70 },
      flowRange: { min: 20, max: 100 },
      currentRange: { min: 5, max: 50 },
      powerRange: { min: 1200, max: 12000 },
    },
  };

  constructor(
    private configService: ConfigService,
    private devicesService: DevicesService,
    private telemetryService: TelemetryService,
    private alertRulesService: AlertRulesService, // ✅ Use rule engine
  ) {}

  /**
   * Start simulation
   */
  async startSimulation(config?: Partial<SimulationConfig>) {
    const defaultConfig: SimulationConfig = {
      deviceIds: [],
      intervalMinutes: 5,
      anomalyChance: 0.1,
      powerOutageChance: 0.05,
    };

    const finalConfig = { ...defaultConfig, ...config };

    if (finalConfig.deviceIds.length === 0) {
      const devices = await this.devicesService.findAll();
      finalConfig.deviceIds = devices
        .filter((d) => d.isActive)
        .map((d) => d.deviceId);
    }

    // Initialize device states
    for (const deviceId of finalConfig.deviceIds) {
      await this.initializeDeviceState(deviceId);
    }

    // Start interval
    this.simulationInterval = setInterval(
      () => this.simulateAllDevices(finalConfig),
      finalConfig.intervalMinutes * 60 * 1000,
    );

    this.logger.log(
      `Started simulation for ${finalConfig.deviceIds.length} devices`,
    );

    // Immediate simulation
    await this.simulateAllDevices(finalConfig);
  }

  /**
   * Stop simulation
   */
  stopSimulation() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.logger.log('Simulation stopped');
    }
  }

  /**
   * Simulate device reading
   */
  async simulateDeviceReading(deviceId: string, config: SimulationConfig) {
    const device = await this.devicesService.findByDeviceId(deviceId);
    const state = this.deviceStates.get(deviceId);

    if (!device || !state) {
      this.logger.warn(`Device ${deviceId} not found or not initialized`);
      return;
    }

    const params =
      this.SIMULATION_PARAMS[device.type] ||
      this.SIMULATION_PARAMS.leak_detector;

    // Simulate anomalies or power outages
    const shouldSimulateAnomaly = Math.random() < config.anomalyChance;
    const shouldSimulatePowerOutage = Math.random() < config.powerOutageChance;

    if (shouldSimulatePowerOutage) {
      state.currentPower = 0;
      state.currentCurrent = 0;
      state.isPowerOutage = true;
    } else if (shouldSimulateAnomaly) {
      const anomalyType = Math.random() > 0.5 ? 'temperature' : 'flow';

      if (anomalyType === 'temperature') {
        state.currentTemperature = params.tempRange.max + Math.random() * 20;
      } else {
        state.currentFlowRate = params.flowRange.max + Math.random() * 50;
      }

      state.currentPower *= 0.7;
      state.currentCurrent *= 0.7;
    } else {
      // Normal operation
      state.currentTemperature = this.fluctuateValue(
        state.currentTemperature,
        params.tempRange.min,
        params.tempRange.max,
        2,
      );
      state.currentHumidity = this.fluctuateValue(
        state.currentHumidity,
        params.humidityRange.min,
        params.humidityRange.max,
        5,
      );
      state.currentFlowRate = this.fluctuateValue(
        state.currentFlowRate,
        params.flowRange.min,
        params.flowRange.max,
        10,
      );
      state.currentCurrent = this.fluctuateValue(
        state.currentCurrent,
        params.currentRange.min,
        params.currentRange.max,
        params.currentRange.max * 0.1,
      );
      state.currentPower = state.currentCurrent * 240;
      state.isPowerOutage = false;
    }

    // Update cumulative power
    const hoursSinceLastReading = config.intervalMinutes / 60;
    state.cumulativePower += state.currentPower * hoursSinceLastReading;
    const status = await this.determineStatus(state, device as Device);
    const validStatus = Object.keys(DeviceStatus).find(
      (key) => DeviceStatus[key] === status,
    ) as DeviceStatus;
    const telemetryData = {
      timestamp: new Date(),
      temperature: parseFloat(state.currentTemperature.toFixed(2)),
      current: parseFloat(state.currentCurrent.toFixed(2)),
      flowRate: parseFloat(state.currentFlowRate.toFixed(2)),
      humidity: parseFloat(state.currentHumidity.toFixed(2)),
      power: parseFloat(state.currentPower.toFixed(2)),
      cumulativePower: parseFloat(state.cumulativePower.toFixed(2)),
      status: validStatus,
      tags: {
        simulated: 'true',
        device_type: device.type,
        anomaly: shouldSimulateAnomaly.toString(),
        power_outage: state.isPowerOutage.toString(),
      },
      metadata: {
        simulation_timestamp: new Date().toISOString(),
        anomaly_chance: config.anomalyChance,
        power_outage_chance: config.powerOutageChance,
      },
    };

    try {
      // Send telemetry
      await this.telemetryService.create(telemetryData, deviceId);

      // ✅ Use rule engine to check alerts
      await this.checkAlertsWithRuleEngine(deviceId, state);

      this.logger.debug(`Simulated data for device ${deviceId}`);
    } catch (error) {
      this.logger.error(`Failed to simulate data for ${deviceId}:`, error);
    }
  }

  /**
   * Check alerts using rule engine
   */
  private async checkAlertsWithRuleEngine(
    deviceId: string,
    state: DeviceState,
    // device: Device,
  ) {
    // Create telemetry object for rule evaluation
    const telemetryForRules = {
      deviceId,
      // device,
      temperature: state.currentTemperature,
      humidity: state.currentHumidity,
      flowRate: state.currentFlowRate,
      current: state.currentCurrent,
      power: state.currentPower,
      cumulativePower: state.cumulativePower,
      timestamp: new Date(),
    };

    // ✅ Use the rule engine (check the actual method name)
    // Based on your AlertRulesService code, it should be evaluateTelemetry()
    await this.alertRulesService.evaluateRules(deviceId, telemetryForRules);
  }

  /**
   * Determine device status (SIMPLIFIED - no hardcoded business rules)
   */
  private determineStatus(state: DeviceState, device: Device): DeviceStatus {
    if (state.isPowerOutage) return DeviceStatus.OFFLINE;

    const params = this.SIMULATION_PARAMS[device.type];
    if (!params) return DeviceStatus.ONLINE;

    if (state.currentTemperature > params.tempRange.max * 1.2) {
      return DeviceStatus.WARNING;
    }

    if (state.currentFlowRate > params.flowRange.max * 1.5) {
      return DeviceStatus.WARNING;
    }

    return DeviceStatus.ONLINE;
  }

  /**
   * Initialize device state
   */
  private async initializeDeviceState(deviceId: string) {
    const device = await this.devicesService.findByDeviceId(deviceId);
    const params =
      this.SIMULATION_PARAMS[device.type] ||
      this.SIMULATION_PARAMS.leak_detector;

    const initialState: DeviceState = {
      deviceId,
      currentTemperature: this.randomInRange(params.tempRange),
      currentHumidity: this.randomInRange(params.humidityRange),
      currentFlowRate: this.randomInRange(params.flowRange),
      currentCurrent: this.randomInRange(params.currentRange),
      currentPower: this.randomInRange(params.currentRange) * 240,
      cumulativePower: this.randomInRange({ min: 1000, max: 100000 }),
      isPowerOutage: false,
    };

    this.deviceStates.set(deviceId, initialState);
  }

  /**
   * Simulate all devices
   */
  private async simulateAllDevices(config: SimulationConfig) {
    this.logger.log(
      `Simulating data for ${config.deviceIds.length} devices...`,
    );

    for (const deviceId of config.deviceIds) {
      try {
        await this.simulateDeviceReading(deviceId, config);
        await this.sleep(100);
      } catch (error) {
        this.logger.error(`Failed to simulate device ${deviceId}:`, error);
      }
    }

    this.logger.log('Simulation cycle completed');
  }

  /**
   * Helper methods
   */
  private randomInRange(range: { min: number; max: number }): number {
    return range.min + Math.random() * (range.max - range.min);
  }

  private fluctuateValue(
    current: number,
    min: number,
    max: number,
    fluctuation: number,
  ): number {
    const change = (Math.random() * 2 - 1) * fluctuation;
    const newValue = current + change;
    return Math.max(min, Math.min(max, newValue));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get simulation state
   */
  getSimulationState() {
    return {
      activeDevices: Array.from(this.deviceStates.keys()),
      deviceStates: Object.fromEntries(this.deviceStates),
      isRunning: !!this.simulationInterval,
    };
  }

  /**
   * Trigger scenario for testing
   */
  async triggerScenario(
    deviceId: string,
    scenario: 'power_outage' | 'high_temp' | 'high_flow',
  ) {
    const state = this.deviceStates.get(deviceId);
    if (!state) {
      throw new Error(`Device ${deviceId} not found in simulation`);
    }

    const device = await this.devicesService.findByDeviceId(deviceId);
    const params = this.SIMULATION_PARAMS[device.type];

    switch (scenario) {
      case 'power_outage':
        state.currentPower = 0;
        state.currentCurrent = 0;
        state.isPowerOutage = true;
        break;
      case 'high_temp':
        state.currentTemperature = params.tempRange.max + 15;
        break;
      case 'high_flow':
        state.currentFlowRate = params.flowRange.max + 30;
        break;
    }

    // Simulate immediate reading
    const config: SimulationConfig = {
      deviceIds: [deviceId],
      intervalMinutes: 5,
      anomalyChance: 0,
      powerOutageChance: 0,
    };

    await this.simulateDeviceReading(deviceId, config);
  }
}
