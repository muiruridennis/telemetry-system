// controllers/alerts.controller.ts
import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
    ParseUUIDPipe,
    Logger,
    DefaultValuePipe,
    ParseIntPipe,
    BadRequestException,
    NotFoundException,
    Req,
  } from '@nestjs/common';
  import { Alert } from './entities/alert.entity';
  import { AlertStatus } from '../../utils/enums/alertStatus.enum';
  import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { JwtAuthenticationGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AlertsService, AlertSummary } from './alerts.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { CreateAlertDto } from './dto/create-alert.dto';
import { Between } from 'typeorm';
  
  @ApiTags('Alerts')
  @ApiBearerAuth()
  @Controller('alerts')
  @UseGuards(JwtAuthenticationGuard, RolesGuard)
  export class AlertsController {
    private readonly logger = new Logger(AlertsController.name);
  
    constructor(private readonly alertsService: AlertsService) {}
  
    /**
     * Get all alerts with pagination and filtering
     */
    @Get()
    @Roles(Role.ADMIN, Role.REGULAR)
    @ApiOperation({ 
      summary: 'Get all alerts', 
      description: 'Get alerts with pagination, filtering, and sorting' 
    })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (starts from 1)' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
    @ApiQuery({ name: 'deviceId', required: false, type: String, description: 'Filter by device ID' })
    @ApiQuery({ 
      name: 'status', 
      required: false, 
      enum: AlertStatus,
      description: 'Filter by alert status' 
    })
    @ApiQuery({ name: 'severity', required: false, type: String, description: 'Filter by severity (critical, high, medium, low, info)' })
    @ApiQuery({ name: 'type', required: false, type: String, description: 'Filter by alert type' })
    @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date (ISO string)' })
    @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date (ISO string)' })
    @ApiQuery({ 
      name: 'sortBy', 
      required: false, 
      enum: ['triggeredAt', 'createdAt', 'severity'],
      description: 'Sort field' 
    })
    @ApiQuery({ 
      name: 'sortOrder', 
      required: false, 
      enum: ['ASC', 'DESC'],
      description: 'Sort order' 
    })
    @ApiResponse({ 
      status: 200, 
      description: 'List of alerts retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: { $ref: '#/components/schemas/Alert' }
          },
          total: { type: 'number', example: 100 },
          page: { type: 'number', example: 1 },
          pages: { type: 'number', example: 10 },
          limit: { type: 'number', example: 10 }
        }
      }
    })
    async findAll(
      @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
      @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
      @Query('deviceId') deviceId?: string,
      @Query('status') status?: AlertStatus,
      @Query('severity') severity?: string,
      @Query('type') type?: string,
      @Query('startDate') startDateStr?: string,
      @Query('endDate') endDateStr?: string,
      @Query('sortBy') sortBy: string = 'triggeredAt',
      @Query('sortOrder') sortOrder: 'ASC' | 'DESC' = 'DESC',
    ): Promise<{ data: Alert[]; total: number; page: number; pages: number; limit: number }> {
      const startDate = startDateStr ? new Date(startDateStr) : undefined;
      const endDate = endDateStr ? new Date(endDateStr) : undefined;
      
      const skip = (page - 1) * limit;
      
      // Build where conditions
      const where: any = {};
      if (deviceId) where.deviceId = deviceId;
      if (status) where.status = status;
      if (severity) where.severity = severity;
      if (type) where.type = type;
      if (startDate || endDate) {
        where.triggeredAt = {
          ...(startDate && { $gte: startDate }),
          ...(endDate && { $lte: endDate })
        };
      }
      
      // Get total count
      const total = await this.alertsService['alertsRepository'].count({ where });
      
      // Get paginated data
      const data = await this.alertsService['alertsRepository'].find({
        where,
        order: { [sortBy]: sortOrder },
        skip,
        take: limit,
      });
      
      const pages = Math.ceil(total / limit);
      
      return {
        data,
        total,
        page,
        pages,
        limit,
      };
    }
  
   
  
    /**
     * Create a new alert (manual creation)
     */
    @Post()
    @Roles(Role.ADMIN)
    @ApiOperation({ 
      summary: 'Create alert manually', 
      description: 'Admin only - manually create an alert (usually alerts are created automatically by rules)' 
    })
    @ApiResponse({ status: 201, description: 'Alert created successfully', type: Alert })
    @ApiResponse({ status: 400, description: 'Bad request' })
    async create(@Body() createAlertDto: CreateAlertDto): Promise<Alert> {
      this.logger.log(`Manual alert creation requested for device ${createAlertDto.deviceId}`);
      return await this.alertsService.createAlert(createAlertDto);
    }
  
    
    /**
     * Get alert summary statistics
     */
    @Get('summary')
    @Roles(Role.ADMIN)
    @ApiOperation({ 
      summary: 'Get alert summary', 
      description: 'Get statistics about alerts (counts by type, severity, status)' 
    })
    @ApiQuery({ name: 'deviceId', required: false, type: String, description: 'Filter by device ID' })
    @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date (ISO string)' })
    @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date (ISO string)' })
    @ApiResponse({ status: 200, description: 'Summary retrieved successfully' })
    async getSummary(
      @Query('deviceId') deviceId?: string,
      @Query('startDate') startDateStr?: string,
      @Query('endDate') endDateStr?: string,
    ): Promise<AlertSummary & { timestamp: string }> {
      const startDate = startDateStr ? new Date(startDateStr) : undefined;
      const endDate = endDateStr ? new Date(endDateStr) : undefined;
      
      const summary = await this.alertsService.getAlertSummary(deviceId, startDate, endDate);
      
      return {
        ...summary,
        timestamp: new Date().toISOString(),
      };
    }
  
    /**
     * Get active alerts (for dashboard)
     */
    @Get('active')
    @Roles(Role.ADMIN, Role.REGULAR)
    @ApiOperation({ 
      summary: 'Get active alerts', 
      description: 'Get all currently active (unresolved) alerts' 
    })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Maximum number of alerts to return' })
    @ApiResponse({ status: 200, description: 'Active alerts retrieved' })
    async getActiveAlerts(
      @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number = 50,
    ): Promise<{ alerts: Alert[]; count: number; timestamp: string }> {
      const alerts = await this.alertsService['alertsRepository'].find({
        where: { status: AlertStatus.ACTIVE },
        order: { triggeredAt: 'DESC' },
        take: limit,
      });
      
      return {
        alerts,
        count: alerts.length,
        timestamp: new Date().toISOString(),
      };
    }
  
    /**
     * Get recent alerts (last 24 hours)
     */
    @Get('recent')
    @Roles(Role.ADMIN, Role.REGULAR)
    @ApiOperation({ 
      summary: 'Get recent alerts', 
      description: 'Get alerts from the last 24 hours' 
    })
    @ApiQuery({ name: 'hours', required: false, type: Number, description: 'Hours to look back (default: 24)' })
    @ApiResponse({ status: 200, description: 'Recent alerts retrieved' })
    async getRecentAlerts(
      @Query('hours', new DefaultValuePipe(24), ParseIntPipe) hours: number = 24,
    ): Promise<{ alerts: Alert[]; count: number; period: { hours: number; start: string; end: string } }> {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setHours(startDate.getHours() - hours);
      
      const alerts = await this.alertsService['alertsRepository'].find({
        where: {
            triggeredAt: Between(startDate, endDate),
        },
        order: { triggeredAt: 'DESC' },
        take: 100,
      });
      
      return {
        alerts,
        count: alerts.length,
        period: {
          hours,
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
      };
    }
  
    /**
     * Bulk acknowledge alerts
     */
    @Post('bulk/acknowledge')
    @Roles(Role.ADMIN)
    @ApiOperation({ 
      summary: 'Bulk acknowledge alerts', 
      description: 'Admin only - acknowledge multiple alerts at once' 
    })
    @ApiResponse({ status: 200, description: 'Alerts acknowledged successfully' })
    async bulkAcknowledge(
      @Body() body: { alertIds: string[]; userId: string },
    ): Promise<{ 
      success: boolean; 
      message: string; 
      acknowledged: number; 
      failed: number; 
      results: Array<{ id: string; success: boolean; error?: string }> 
    }> {
      const { alertIds, userId } = body;
      
      if (!alertIds || !Array.isArray(alertIds) || alertIds.length === 0) {
        throw new BadRequestException('alertIds array is required and cannot be empty');
      }
      
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }
      
      this.logger.log(`Bulk acknowledging ${alertIds.length} alerts by user ${userId}`);
      
      const results = [];
      let acknowledged = 0;
      let failed = 0;
      
      for (const alertId of alertIds) {
        try {
          const alert = await this.alertsService.acknowledgeAlert(alertId, userId);
          results.push({ id: alertId, success: true });
          acknowledged++;
        } catch (error) {
          results.push({ 
            id: alertId, 
            success: false, 
            error: error.message 
          });
          failed++;
        }
      }
      
      return {
        success: true,
        message: `Bulk acknowledge completed: ${acknowledged} succeeded, ${failed} failed`,
        acknowledged,
        failed,
        results,
      };
    }
  
    /**
     * Bulk resolve alerts
     */
    @Post('bulk/resolve')
    @Roles(Role.ADMIN)
    @ApiOperation({ 
      summary: 'Bulk resolve alerts', 
      description: 'Admin only - resolve multiple alerts at once' 
    })
    async bulkResolve(
      @Body() body: { alertIds: string[] },
    ): Promise<{ 
      success: boolean; 
      message: string; 
      resolved: number; 
      failed: number; 
      results: Array<{ id: string; success: boolean; error?: string }> 
    }> {
      const { alertIds } = body;
      
      if (!alertIds || !Array.isArray(alertIds) || alertIds.length === 0) {
        throw new BadRequestException('alertIds array is required and cannot be empty');
      }
      
      this.logger.log(`Bulk resolving ${alertIds.length} alerts`);
      
      const results = [];
      let resolved = 0;
      let failed = 0;
      
      for (const alertId of alertIds) {
        try {
          const alert = await this.alertsService.resolveAlert(alertId);
          results.push({ id: alertId, success: true });
          resolved++;
        } catch (error) {
          results.push({ 
            id: alertId, 
            success: false, 
            error: error.message 
          });
          failed++;
        }
      }
      
      return {
        success: true,
        message: `Bulk resolve completed: ${resolved} succeeded, ${failed} failed`,
        resolved,
        failed,
        results,
      };
    }
  
    /**
     * Get device-specific alerts
     */
    @Get('device/:deviceId')
    @Roles(Role.ADMIN, Role.REGULAR)
    @ApiOperation({ 
      summary: 'Get device alerts', 
      description: 'Get all alerts for a specific device' 
    })
    @ApiParam({ name: 'deviceId', type: String, description: 'Device ID' })
    async getDeviceAlerts(
      @Param('deviceId') deviceId: string,
      @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number = 50,
      @Query('status') status?: AlertStatus,
    ): Promise<{ alerts: Alert[]; count: number; deviceId: string }> {
      const where: any = { deviceId };
      if (status) where.status = status;
      
      const alerts = await this.alertsService['alertsRepository'].find({
        where,
        order: { triggeredAt: 'DESC' },
        take: limit,
      });
      
      return {
        alerts,
        count: alerts.length,
        deviceId,
      };
    }
     /**
     * Get alert by ID
     */
     @Get(':id')
     @Roles(Role.ADMIN, Role.REGULAR)
     @ApiOperation({ summary: 'Get alert by ID', description: 'Get detailed information about a specific alert' })
     @ApiParam({ name: 'id', type: String, description: 'Alert ID (UUID)' })
     @ApiResponse({ status: 200, description: 'Alert found', type: Alert })
     @ApiResponse({ status: 404, description: 'Alert not found' })
     async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Alert> {
       const alert = await this.alertsService['alertsRepository'].findOne({ where: { id } });
       
       if (!alert) {
         throw new NotFoundException(`Alert with ID ${id} not found`);
       }
       
       return alert;
     }
      /**
     * Delete an alert
     */
    @Delete(':id')
    @Roles(Role.ADMIN)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ 
      summary: 'Delete alert', 
      description: 'Admin only - permanently delete an alert' 
    })
    @ApiParam({ name: 'id', type: String, description: 'Alert ID (UUID)' })
    @ApiResponse({ status: 204, description: 'Alert deleted successfully' })
    @ApiResponse({ status: 404, description: 'Alert not found' })
    async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
      const alert = await this.alertsService['alertsRepository'].findOne({ where: { id } });
      
      if (!alert) {
        throw new NotFoundException(`Alert with ID ${id} not found`);
      }
      
      await this.alertsService['alertsRepository'].remove(alert);
      this.logger.log(`Alert ${id} deleted permanently`);
    }
    /**
     * Acknowledge an alert
     */
    @Put(':id/acknowledge')
    @Roles(Role.ADMIN)
    @ApiOperation({ 
      summary: 'Acknowledge alert', 
      description: 'Admin only - mark an alert as acknowledged (someone is working on it)' 
    })
    @ApiParam({ name: 'id', type: String, description: 'Alert ID (UUID)' })
    @ApiResponse({ status: 200, description: 'Alert acknowledged successfully', type: Alert })
    @ApiResponse({ status: 404, description: 'Alert not found' })
    async acknowledge(
      @Param('id', ParseUUIDPipe) id: string,
      @Body('userId') userId: string,
      @Req() req: any, // If you want to get user from request
    ): Promise<Alert> {
      // You can get userId from request if using JWT: req.user.id
      const actualUserId = userId || req?.user?.id;
      
      if (!actualUserId) {
        throw new BadRequestException('User ID is required to acknowledge alert');
      }
      
      this.logger.log(`Acknowledging alert ${id} by user ${actualUserId}`);
      return await this.alertsService.acknowledgeAlert(id, actualUserId);
    }
  
    /**
     * Resolve an alert
     */
    @Put(':id/resolve')
    @Roles(Role.ADMIN)
    @ApiOperation({ 
      summary: 'Resolve alert', 
      description: 'Admin only - mark an alert as resolved (issue has been fixed)' 
    })
    @ApiParam({ name: 'id', type: String, description: 'Alert ID (UUID)' })
    @ApiResponse({ status: 200, description: 'Alert resolved successfully', type: Alert })
    @ApiResponse({ status: 404, description: 'Alert not found' })
    async resolve(@Param('id', ParseUUIDPipe) id: string): Promise<Alert> {
      this.logger.log(`Resolving alert ${id}`);
      return await this.alertsService.resolveAlert(id);
    }
  
    /**
     * Clear all active alerts for a device
     */
    @Delete('device/:deviceId')
    @Roles(Role.ADMIN)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
      summary: 'Clear device alerts', 
      description: 'Admin only - resolve all active alerts for a specific device' 
    })
    @ApiParam({ name: 'deviceId', type: String, description: 'Device ID' })
    @ApiResponse({ status: 200, description: 'Alerts cleared successfully' })
    async clearDeviceAlerts(@Param('deviceId') deviceId: string): Promise<{ 
      success: boolean; 
      message: string; 
      cleared: number; 
      deviceId: string;
    }> {
      this.logger.log(`Clearing all alerts for device ${deviceId}`);
      const result = await this.alertsService.clearDeviceAlerts(deviceId);
      
      return {
        success: true,
        message: `Cleared ${result.cleared} alerts for device ${deviceId}`,
        cleared: result.cleared,
        deviceId,
      };
    }
  
   
  
  }