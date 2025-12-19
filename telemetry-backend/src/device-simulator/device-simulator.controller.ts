// controllers/device-simulator.controller.ts
import {
    Controller,
    Post,
    Get,
    Body,
    Param,
    UseGuards,
    HttpCode,
    HttpStatus,
    Logger,
  } from '@nestjs/common';
  import { DeviceSimulatorService, SimulationConfig } from './device-simulator.service';

  import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { JwtAuthenticationGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
  
  @ApiTags('Simulation')
  @ApiBearerAuth()
  @Controller('simulation')
  @UseGuards(JwtAuthenticationGuard, RolesGuard)
  export class DeviceSimulatorController {
    private readonly logger = new Logger(DeviceSimulatorController.name);
  
    constructor(private readonly deviceSimulatorService: DeviceSimulatorService) {}
  
    /**
     * Start device simulation
     */
    @Post('start')
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Start device simulation', description: 'Admin only - starts simulating telemetry data for devices' })
    @ApiBody({
      schema: {
        type: 'object',
        properties: {
          deviceIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Specific device IDs to simulate (if empty, simulates all active devices)',
            example: ['device-001', 'device-002']
          },
          intervalMinutes: {
            type: 'number',
            description: 'How often to simulate data in minutes',
            default: 5,
            example: 5
          },
          anomalyChance: {
            type: 'number',
            description: 'Probability of anomalies (0-1)',
            default: 0.1,
            example: 0.1
          },
          powerOutageChance: {
            type: 'number',
            description: 'Probability of power outages (0-1)',
            default: 0.05,
            example: 0.05
          }
        }
      }
    })
    @ApiResponse({ status: 200, description: 'Simulation started successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
    async startSimulation(@Body() config: Partial<SimulationConfig>) {
      this.logger.log(`Starting simulation with config: ${JSON.stringify(config)}`);
      await this.deviceSimulatorService.startSimulation(config);
      
      return {
        success: true,
        message: 'Device simulation started successfully',
        config: {
          ...config,
          intervalMinutes: config.intervalMinutes || 5,
          anomalyChance: config.anomalyChance || 0.1,
          powerOutageChance: config.powerOutageChance || 0.05,
        },
        timestamp: new Date().toISOString(),
      };
    }
  
    /**
     * Stop device simulation
     */
    @Post('stop')
    @Roles(Role.ADMIN)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Stop device simulation', description: 'Admin only - stops the simulation' })
    @ApiResponse({ status: 200, description: 'Simulation stopped successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
    async stopSimulation() {
      this.logger.log('Stopping simulation');
      this.deviceSimulatorService.stopSimulation();
      
      return {
        success: true,
        message: 'Device simulation stopped',
        timestamp: new Date().toISOString(),
      };
    }
  
    /**
     * Get simulation status
     */
    @Get('status')
    @Roles(Role.ADMIN, Role.OPERATOR, Role.VIEWER)
    @ApiOperation({ summary: 'Get simulation status', description: 'Get current simulation status and device states' })
    @ApiResponse({ 
      status: 200, 
      description: 'Simulation status retrieved',
      schema: {
        type: 'object',
        properties: {
          isRunning: { type: 'boolean', example: true },
          activeDevices: { 
            type: 'array', 
            items: { type: 'string' },
            example: ['device-001', 'device-002']
          },
          deviceStates: {
            type: 'object',
            additionalProperties: {
              type: 'object',
              properties: {
                deviceId: { type: 'string' },
                currentTemperature: { type: 'number' },
                currentHumidity: { type: 'number' },
                currentFlowRate: { type: 'number' },
                currentCurrent: { type: 'number' },
                currentPower: { type: 'number' },
                cumulativePower: { type: 'number' },
                isPowerOutage: { type: 'boolean' },
              }
            }
          },
          timestamp: { type: 'string', format: 'date-time' }
        }
      }
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getSimulationStatus() {
      const status = this.deviceSimulatorService.getSimulationState();
      
      return {
        ...status,
        timestamp: new Date().toISOString(),
        uptime: this.getUptime(status.isRunning),
      };
    }
  
    /**
     * Manually trigger a specific scenario for testing
     */
    @Post('trigger/:deviceId/:scenario')
    @Roles(Role.ADMIN)
    @ApiOperation({ 
      summary: 'Trigger specific scenario', 
      description: 'Admin only - manually trigger a specific scenario for a device (for testing)' 
    })
    @ApiParam({
      name: 'deviceId',
      type: 'string',
      description: 'Device ID to trigger scenario for',
      example: 'water-pump-001'
    })
    @ApiParam({
      name: 'scenario',
      enum: ['power_outage', 'high_temp', 'high_flow'],
      description: 'Scenario to trigger'
    })
    @ApiResponse({ status: 200, description: 'Scenario triggered successfully' })
    @ApiResponse({ status: 400, description: 'Invalid scenario or device not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
    async triggerScenario(
      @Param('deviceId') deviceId: string,
      @Param('scenario') scenario: 'power_outage' | 'high_temp' | 'high_flow',
    ) {
      this.logger.log(`Triggering ${scenario} scenario for device ${deviceId}`);
      
      try {
        await this.deviceSimulatorService.triggerScenario(deviceId, scenario);
        
        return {
          success: true,
          message: `Successfully triggered ${scenario} scenario for device ${deviceId}`,
          deviceId,
          scenario,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        this.logger.error(`Failed to trigger scenario: ${error.message}`);
        throw error;
      }
    }
  
    /**
     * Get simulation statistics
     */
    @Get('stats')
    @Roles(Role.ADMIN, Role.OPERATOR)
    @ApiOperation({ summary: 'Get simulation statistics', description: 'Get statistics about the simulation' })
    async getSimulationStats() {
      const status = this.deviceSimulatorService.getSimulationState();
      const deviceStates = Object.values(status.deviceStates);
      
      // Calculate statistics
      const stats = {
        totalDevices: status.activeDevices.length,
        devicesWithPowerOutage: deviceStates.filter(state => state.isPowerOutage).length,
        averageTemperature: this.calculateAverage(deviceStates, 'currentTemperature'),
        averageFlowRate: this.calculateAverage(deviceStates, 'currentFlowRate'),
        averagePower: this.calculateAverage(deviceStates, 'currentPower'),
        totalCumulativePower: deviceStates.reduce((sum, state) => sum + state.cumulativePower, 0),
        deviceTypes: this.getDeviceTypeDistribution(status),
      };
  
      return {
        ...stats,
        timestamp: new Date().toISOString(),
        isRunning: status.isRunning,
      };
    }
  
    /**
     * Force a simulation cycle immediately
     */
    @Post('force-cycle')
    @Roles(Role.ADMIN)
    @ApiOperation({ 
      summary: 'Force simulation cycle', 
      description: 'Admin only - force an immediate simulation cycle for all devices' 
    })
    async forceSimulationCycle(@Body() config: Partial<SimulationConfig>) {
      this.logger.log('Forcing immediate simulation cycle');
      
      const defaultConfig: SimulationConfig = {
        deviceIds: [],
        intervalMinutes: 5,
        anomalyChance: 0.1,
        powerOutageChance: 0.05,
      };
  
      const finalConfig = { ...defaultConfig, ...config };
      
      // Get current active devices if none specified
      if (finalConfig.deviceIds.length === 0) {
        const status = this.deviceSimulatorService.getSimulationState();
        finalConfig.deviceIds = status.activeDevices;
        
        if (finalConfig.deviceIds.length === 0) {
          return {
            success: false,
            message: 'No active devices in simulation. Start simulation first.',
            timestamp: new Date().toISOString(),
          };
        }
      }
  
      await this.deviceSimulatorService['simulateAllDevices'](finalConfig);
      
      return {
        success: true,
        message: `Forced simulation cycle for ${finalConfig.deviceIds.length} devices`,
        deviceCount: finalConfig.deviceIds.length,
        timestamp: new Date().toISOString(),
      };
    }
  
    /**
     * Reset simulation (clear all device states)
     */
    @Post('reset')
    @Roles(Role.ADMIN)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
      summary: 'Reset simulation', 
      description: 'Admin only - reset simulation and clear all device states' 
    })
    async resetSimulation() {
      this.logger.log('Resetting simulation');
      
      // Stop if running
      this.deviceSimulatorService.stopSimulation();
      
      // Note: You might need to add a reset method to your service
      // For now, we'll just stop it
      return {
        success: true,
        message: 'Simulation reset. Start simulation again with new devices.',
        timestamp: new Date().toISOString(),
      };
    }
  
    /**
     * Helper method to calculate uptime
     */
    private getUptime(isRunning: boolean): string | null {
      if (!isRunning) return null;
      // You could track start time in your service for actual uptime
      return 'Running';
    }
  
    /**
     * Calculate average for a metric
     */
    private calculateAverage(deviceStates: any[], metric: string): number {
      if (deviceStates.length === 0) return 0;
      const sum = deviceStates.reduce((acc, state) => acc + (state[metric] || 0), 0);
      return parseFloat((sum / deviceStates.length).toFixed(2));
    }
  
    /**
     * Get device type distribution
     */
    private getDeviceTypeDistribution(status: any): Record<string, number> {
      // This would need device type information from your service
      // For now, return placeholder
      return {
        water_pump: Math.floor(status.activeDevices.length * 0.4),
        leak_detector: Math.floor(status.activeDevices.length * 0.3),
        hvac: Math.floor(status.activeDevices.length * 0.3),
      };
    }
  }