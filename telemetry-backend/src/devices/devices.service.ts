import {
  Injectable,
  ConflictException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Device } from './entities/device.entity';
import { Repository } from 'typeorm';
import { CreateDeviceDto } from './dto/create-device.dto';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
    ) { }

  async create(createDeviceDto: CreateDeviceDto): Promise<Device> {
    const existingDevice = await this.deviceRepository.findOne({
      where: { deviceId: createDeviceDto.deviceId },
    });
    if (existingDevice) {
      throw new ConflictException('Device ID already exists');
      }
      const device = this.deviceRepository.create({
          ...createDeviceDto,
          lastSeen: new Date(),
      });
      
      return this.deviceRepository.save(device);
      
    }
    
    async findAll(): Promise<Device[]> {
      return this.deviceRepository.find();
    }

    async findByDeviceId(deviceId: string): Promise<Device> {
      const device = await this.deviceRepository.findOneBy({ deviceId });
      if (!device) {
        throw new HttpException('Device not found', HttpStatus.NOT_FOUND);
      }
      return device;
    }
    async remove(id: number): Promise<void> {
      const device = await this.deviceRepository.findOneBy({ id });
      if (!device) {
        throw new HttpException('Device not found', HttpStatus.NOT_FOUND);
      }
      await this.deviceRepository.delete(id);
    }
}
