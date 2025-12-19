import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Delete, 
  Query,
  UseGuards,
  UseInterceptors,
  ParseIntPipe,
  DefaultValuePipe,
  Req,
} from '@nestjs/common';
import { TelemetryService } from './telemetry.service';
import { CreateTelemetryDto } from './dto/create-telemetry.dto';
import { BatchTelemetryDto } from './dto/batch-telemetry.dto';
import { DeviceJwtGuard } from '../auth/guards/device-auth.guard';
import { JwtAuthenticationGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { TelemetryValidationInterceptor } from './interceptors/telemetry-validation.interceptor';
import type { RequestWithDevice } from '../auth/interfaces/request-with-device.interface';

@Controller('telemetry')
export class TelemetryController {
  constructor(private readonly telemetryService: TelemetryService) {}

  // ============ DEVICE ENDPOINTS (Authenticated with Device JWT) ============
  @Post('ingest')
  @UseGuards(DeviceJwtGuard)
  // @UseInterceptors(TelemetryValidationInterceptor)
  async ingestBatch(
    @Body() batchTelemetryDto: BatchTelemetryDto,
    @Req() req: RequestWithDevice,
  ) {
    // Device ID comes from JWT validation
    const deviceId = req.user.deviceId;
    
    return  await this.telemetryService.ingestBatch(batchTelemetryDto, deviceId);
  }

  @Post()
  @UseGuards(DeviceJwtGuard)
  async create(
    @Body() createTelemetryDto: CreateTelemetryDto,
    @Req() req: RequestWithDevice,
  ) {
    const deviceId = req.user.deviceId;
    return this.telemetryService.create(createTelemetryDto, deviceId);
  }

  // ============ ADMIN/USER ENDPOINTS ============
  @Get()
  @UseGuards(JwtAuthenticationGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.VIEWER)
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(100), ParseIntPipe) limit: number,
    @Query('deviceId') deviceId?: string,
  ) {
    return this.telemetryService.findAll(page, limit, deviceId);
  }

  @Get('device/:deviceId')
  @UseGuards(JwtAuthenticationGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.VIEWER)
  async findByDeviceId(
    @Param('deviceId') deviceId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(100), ParseIntPipe) limit: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.telemetryService.findByDeviceId(
      deviceId,
      page,
      limit,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('device/:deviceId/latest')
  @UseGuards(JwtAuthenticationGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.VIEWER)
  async getLatestByDeviceId(@Param('deviceId') deviceId: string) {
    return this.telemetryService.getLatestByDeviceId(deviceId);
  }

  @Get('device/:deviceId/summary')
  @UseGuards(JwtAuthenticationGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.VIEWER)
  async getDeviceTelemetrySummary(@Param('deviceId') deviceId: string) {
    return this.telemetryService.getDeviceTelemetrySummary(deviceId);
  }

  @Get('stats')
  @UseGuards(JwtAuthenticationGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.VIEWER)
  async getSystemStats() {
    return this.telemetryService.getSystemStats();
  }

  @Delete('cleanup')
  @UseGuards(JwtAuthenticationGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async removeOldData(@Query('days', new DefaultValuePipe(90), ParseIntPipe) days: number) {
    return this.telemetryService.removeOldData(days);
  }

  @Delete('device/:deviceId')
  @UseGuards(JwtAuthenticationGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async removeByDeviceId(@Param('deviceId') deviceId: string) {
    return this.telemetryService.removeByDeviceId(deviceId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthenticationGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async remove(@Param('id') id: string) {
    return this.telemetryService.remove(id);
  }
}