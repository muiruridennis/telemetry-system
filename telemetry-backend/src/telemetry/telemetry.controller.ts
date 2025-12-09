import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TelemetryService } from './telemetry.service';
import { CreateTelemetryDto } from './dto/create-telemetry.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@Controller('telemetry')
export class TelemetryController {
  constructor(private readonly telemetryService: TelemetryService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.DEVICE)
  create(@Body() createTelemetryDto: CreateTelemetryDto) {
    let telemetry = this.telemetryService.create(createTelemetryDto);
    return {
      message: 'Telemetry created successfully',
      telemetry,
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll() {
    return this.telemetryService.findAll();
  }

  @Delete()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.ADMIN, Role.OPERATOR)
  async remove(@Param('id') id: string) {
    await this.telemetryService.remove(id);
    return { message: 'Telemetry deleted successfully' };
  }
}
