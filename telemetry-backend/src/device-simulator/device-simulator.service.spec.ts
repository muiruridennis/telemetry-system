import { Test, TestingModule } from '@nestjs/testing';
import { DeviceSimulatorService } from './device-simulator.service';

describe('DeviceSimulatorService', () => {
  let service: DeviceSimulatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DeviceSimulatorService],
    }).compile();

    service = module.get<DeviceSimulatorService>(DeviceSimulatorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
