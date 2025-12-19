import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Device } from './entities/device.entity';
import { Repository } from 'typeorm';
import { CreateDeviceDto } from './dto/create-device.dto';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { DeviceResponseDto } from './dto/device-response.dto';
import { PostgresErrorCode } from '../database/postgresErrorCodes.enum';

@Injectable()
export class DevicesService {
  private readonly SALT_ROUNDS = 10;

  constructor(
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  // ============ ADMIN: CREATE DEVICE ============
  async create(createDeviceDto: CreateDeviceDto): Promise<any> {

    try {
      // Generate a secure secret key for the device
      const secretKey = this.generateSecretKey();
      const hashedSecretKey = await bcrypt.hash(secretKey, this.SALT_ROUNDS);

      // Create the device entity
      const device = await this.deviceRepository.create({
        ...createDeviceDto,
        secretKey: hashedSecretKey,
        isActive:
          createDeviceDto.isActive !== undefined
            ? createDeviceDto.isActive
            : true,
        lastSeen: new Date(),
        createdAt: new Date(),
      });

      // Save device to database
      const savedDevice = await this.deviceRepository.save(device);

      // Generate initial JWT tokens for the device
      const { accessToken, refreshToken } =
        await this.generateDeviceTokens(savedDevice);

      // Hash and store refresh token
      const refreshTokenHash = await bcrypt.hash(
        refreshToken,
        this.SALT_ROUNDS,
      );
      savedDevice.refreshToken = refreshTokenHash;
      await this.deviceRepository.save(savedDevice);

      // Return response with sensitive data (only shown once!)
      return {
        device: {
          id: savedDevice.id,
          deviceId: savedDevice.deviceId,
          name: savedDevice.name,
          type: savedDevice.type,
          location: savedDevice.location,
          isActive: savedDevice.isActive,
          createdAt: savedDevice.createdAt,
        },
        credentials: {
          secretKey, // PLAIN TEXT - ONLY SHOWN ONCE
          accessToken,
          refreshToken,
          tokenExpiry: this.configService.get(
            'DEVICE_ACCESS_TOKEN_EXPIRY',
            '30d',
          ),
        },
        instructions:
          'Store these credentials securely. The secret key will not be shown again.',
      };
    } catch (error) {
      console.log(error);
      if (error?.code === PostgresErrorCode.UniqueViolation) {
        throw new HttpException(
          'A device with that Device ID already exists',
          HttpStatus.BAD_REQUEST,
        );
      }

      throw new HttpException(
        'Something went wrong',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ============ DEVICE AUTHENTICATION ============
  async validateDeviceCredentials(
    deviceId: string,
    secretKey: string,
  ): Promise<{ device: Device | null; reason: string } | null> {
    // First check if device exists (regardless of active status)
    const device = await this.deviceRepository.findOne({
      where: { deviceId },
      select: ['id', 'deviceId', 'secretKey', 'type', 'location', 'name', 'isActive'],
    });
  
    if (!device) {
      return { device: null, reason: 'DEVICE_NOT_FOUND' };
    }
  
    if (!device.isActive) {
      return { device: null, reason: 'DEVICE_INACTIVE' };
    }
  
    if (!device.secretKey) {
      return { device: null, reason: 'MISSING_SECRET_KEY' };
    }
  
    const isValid = await bcrypt.compare(secretKey, device.secretKey);
    return isValid 
      ? { device, reason: 'VALID' }
      : { device: null, reason: 'INVALID_SECRET_KEY' };
  }
  
  async validateDevice(deviceId: string) {
    const device = await this.deviceRepository.findOne({
      where: { deviceId, isActive: true },
    });

    if (!device) {
      throw new UnauthorizedException('Device not found or inactive');
    }

    return device;
  }

  // ============ TOKEN MANAGEMENT ============
  async generateDeviceTokens(device: Device) {
    const accessToken = this.jwtService.sign(
      {
        sub: `device:${device.deviceId}`,
        deviceId: device.deviceId,
        deviceName: device.name,
        deviceType: device.type,
        deviceLocation: device.location,
        type: 'access',
      },
      {
        secret: this.configService.get('DEVICE_JWT_SECRET'),
        expiresIn: this.configService.get('DEVICE_ACCESS_TOKEN_EXPIRY', '30d'),
      },
    );

    const refreshToken = this.jwtService.sign(
      {
        sub: `device:${device.deviceId}`,
        deviceId: device.deviceId,
        type: 'refresh',
      },
      {
        secret: this.configService.get('DEVICE_JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('DEVICE_REFRESH_TOKEN_EXPIRY', '90d'),
      },
    );

    return { accessToken, refreshToken };
  }

  async refreshDeviceTokens(deviceId: string, oldRefreshToken: string) {
    const device = await this.deviceRepository.findOne({
      where: { deviceId },
      select: ['id', 'deviceId', 'refreshToken', 'isActive'],
    });

    if (!device || !device.refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Validate old refresh token
    const isValid = await bcrypt.compare(oldRefreshToken, device.refreshToken);
    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Generate new tokens
    const { accessToken, refreshToken } =
      await this.generateDeviceTokens(device);

    // Update refresh token hash
    const refreshTokenHash = await bcrypt.hash(refreshToken, this.SALT_ROUNDS);
    device.refreshToken = refreshTokenHash;
    await this.deviceRepository.save(device);

    return { accessToken, refreshToken };
  }

  // ============ ADMIN DEVICE MANAGEMENT ============
  async findAll(): Promise<DeviceResponseDto[]> {
    const devices = await this.deviceRepository.find({
      order: { lastSeen: 'DESC' },
    });

    return devices.map((device) => {
      const { secretKey, refreshToken, ...safeDevice } = device;
      return safeDevice as DeviceResponseDto;
    });
  }

  async findByDeviceId(deviceId: string): Promise<Partial<Device>> {
    const device = await this.deviceRepository.findOne({
      where: { deviceId },
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    // Remove sensitive data
    const { secretKey, refreshToken, ...safeDevice } = device;
    return safeDevice;
  }

  async updateStatus(
    deviceId: string,
    isActive: boolean,
  ): Promise<Partial<Device>> {
    const device = await this.deviceRepository.findOne({ where: { deviceId } });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    device.isActive = isActive;

    // If deactivating, invalidate refresh token
    if (!isActive) {
      device.refreshToken = null;
    }

    await this.deviceRepository.save(device);

    const { secretKey, refreshToken, ...safeDevice } = device;
    return safeDevice;
  }

  async rotateSecretKey(deviceId: string): Promise<{ newSecretKey: string }> {
    const device = await this.deviceRepository.findOne({
      where: { deviceId },
      select: ['id', 'deviceId'],
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    const newSecretKey = this.generateSecretKey();
    const hashedSecretKey = await bcrypt.hash(newSecretKey, this.SALT_ROUNDS);

    // Update secret and invalidate refresh tokens
    await this.deviceRepository.update(device.id, {
      secretKey: hashedSecretKey,
      refreshToken: null,
    });

    return {
      newSecretKey, // Only returned once
      message: 'Secret key rotated. Previous credentials are no longer valid.',
    } as { newSecretKey: string; message: string };
  }

  async remove(id: string): Promise<void> {
    const device = await this.deviceRepository.findOneBy({ id });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    await this.deviceRepository.delete(id);
  }

  // ============ UTILITY METHODS ============
  private generateSecretKey(): string {
    return `sk_${crypto.randomBytes(32).toString('hex')}`;
  }

  // Update last seen timestamp (called when device sends telemetry)
  async updateLastSeen(deviceId: string): Promise<void> {
    await this.deviceRepository.update({ deviceId }, { lastSeen: new Date() });
  }
  async getDeviceIfRefreshTokenMatches(
    refreshToken: string,
    deviceId: string,
  ): Promise<Device> {
    // 1. Find device by ID
    const device = await this.deviceRepository.findOne({
      where: { deviceId },
      select: ['id', 'deviceId', 'refreshToken', 'isActive'],
    });

    if (!device || !device.refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // 2. Compare provided token with stored (hashed) token
    const isRefreshTokenValid = await bcrypt.compare(
      refreshToken,
      device.refreshToken,
    );
    if (!isRefreshTokenValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // 3. Return device if token matches
    return device;
  }
}
