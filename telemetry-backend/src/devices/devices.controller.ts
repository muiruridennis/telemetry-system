import { Role } from './../auth/enums/role.enum';
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpException,
} from '@nestjs/common';
import { DevicesService } from './devices.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { JwtAuthenticationGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('devices')
@UseGuards(JwtAuthenticationGuard, RolesGuard)
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post()
  @Roles(Role.ADMIN)
  async create(@Body() createDeviceDto: CreateDeviceDto) {
    return await this.devicesService.create(createDeviceDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.VIEWER) // Admins and viewers can list devices
  findAll() {
    return this.devicesService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.VIEWER)
  findOne(@Param('id') id: string) {
    return this.devicesService.findByDeviceId(id);
  }

  @Patch(':id/activate')
  @Roles(Role.ADMIN)
  activate(@Param('id') id: string) {
    return this.devicesService.updateStatus(id, true);
  }

  @Patch(':id/deactivate')
  @Roles(Role.ADMIN)
  deactivate(@Param('id') id: string) {
    return this.devicesService.updateStatus(id, false);
  }

  @Post(':id/rotate-key')
  @Roles(Role.ADMIN)
  rotateKey(@Param('id') id: string) {
    return this.devicesService.rotateSecretKey(id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.devicesService.remove(id);
  }
}
