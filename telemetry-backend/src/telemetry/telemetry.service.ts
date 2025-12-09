import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Telemetry } from './entities/telemetry.entity';
import { Repository } from 'typeorm';
import { CreateTelemetryDto } from './dto/create-telemetry.dto';
import { AlertsService } from '../alerts/alerts.service';

@Injectable()
export class TelemetryService {
  constructor(
    @InjectRepository(Telemetry)
    private telemetryRepository: Repository<Telemetry>,
    private readonly alertsService: AlertsService, 
  ) {}

  async findAll(): Promise<Telemetry[]> {
    return this.telemetryRepository.find();
  }

  async findByDeviceIAd(deviceId: string): Promise<Telemetry[]> {
    const telemetry = await this.telemetryRepository.find({
      where: { deviceId },
    });
    if (!telemetry) {
      throw new HttpException('Telemetry not found', HttpStatus.NOT_FOUND);
    }

    return telemetry;
  }

  async create(createTelemetryDto: CreateTelemetryDto) {
    const telemetryExists = await this.telemetryRepository.findOne({
      where: { deviceId: createTelemetryDto.deviceId },
    });

    if (telemetryExists) {
      throw new HttpException('Telemetry already exists', HttpStatus.CONFLICT);
    }

    const telemetry = this.telemetryRepository.create(createTelemetryDto);
    const savedTelemetry = await this.telemetryRepository.save(telemetry);

    await this.alertsService.evaluateTelemetry(savedTelemetry);

    return savedTelemetry;
  }

  async remove(id: string): Promise<void> {
    const telemetry = await this.telemetryRepository.findOneBy({ id });
    if (!telemetry) {
      throw new HttpException('Telemetry not found', HttpStatus.NOT_FOUND);
    }
    await this.telemetryRepository.delete(id);
  }
}
