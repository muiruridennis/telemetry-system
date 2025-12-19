import { Test, TestingModule } from '@nestjs/testing';
import { DeviceSimulatorController } from './device-simulator.controller';

describe('DeviceSimulatorController', () => {
  let controller: DeviceSimulatorController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeviceSimulatorController],
    }).compile();

    controller = module.get<DeviceSimulatorController>(DeviceSimulatorController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
