import { Controller, Put, Param, Body, Post, Get } from '@nestjs/common';
import { DevicesService } from './devices.service';

@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  // @Put(':deviceId')
  // async updateDevice(@Param('deviceId') deviceId: string, @Body() updateDeviceDto: any) {
  //     return this.devicesService.updateDevice(deviceId, updateDeviceDto);
  // }
  @Post()
  async createDevice(@Body() createDeviceDto: any) {
    const device = await this.devicesService.create(createDeviceDto);
    return {
      message: 'Device created successfully',
      device,
    };
  }
  @Get(':deviceId')
  async getDevice(@Param('deviceId') deviceId: string) {
    return this.devicesService.findByDeviceId(deviceId);
  }
  @Get()
  async getAllDevices() {
    return this.devicesService.findAll();
  }
}
