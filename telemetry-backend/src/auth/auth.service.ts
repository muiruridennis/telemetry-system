import { DevicesService } from './../devices/devices.service';
import { ConfigService } from '@nestjs/config';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { TokenPayload } from './interfaces/tokenPayload.interface';
import { PostgresErrorCode } from '../database/postgresErrorCodes.enum';
import { Device } from '../devices/entities/device.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private devicesService: DevicesService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }
  async login(user: User) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }
  async register(createUserDto: CreateUserDto) {
    try {
      const user = await this.usersService.create(createUserDto);
      const { password, ...result } = user;
      return {
        result,
        message: 'User registered successfully',
      };
    } catch (error) {
      if (error?.code === PostgresErrorCode.UniqueViolation) {
        throw new HttpException(
          'User with that email already exists',
          HttpStatus.BAD_REQUEST,
        );
      } else {
        throw new HttpException(
          'Something went wrong',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }
  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      return payload;
    } catch (error) {
      return null;
    }
  }

  async deviceLogin(deviceId: string, secretKey: string) {
    const payload = { deviceId: deviceId, role: 'device' };
    return {
      access_token: this.jwtService.sign(payload),
      expiresIn: '30d',
    };
  }
  //To be used in local strategy
  public async getAuthenticatedUser(email: string, plainTextPassword: string) {
    const user = await this.usersService.getByEmail(email);
    try {
      await this.verifyPassword(plainTextPassword, user.password);
      // @ts-ignore
      user.password = undefined;
      return user;
    } catch (error) {
      throw new HttpException(
        'Wrong credentials provided',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
  private async verifyPassword(
    plainTextPassword: string,
    hashedPassword: string,
  ) {
    const passwordIsMatching = await bcrypt.compare(
      plainTextPassword,
      hashedPassword,
    );
    if (!passwordIsMatching) {
      throw new HttpException(
        'Wrong credentials provided',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
  public getCookieWithJwtToken(userId: string) {
    const payload: TokenPayload = { userId };
    const token = this.jwtService.sign(payload);
    // The possibility to provide the secret while calling the  jwtService.sign method has been added in the  7.1.0  version of  @nestjs/jwt
    return `Authentication=${token}; HttpOnly; Path=/; Max-Age=${this.configService.get('TOKEN_EXPIRATION_TIME')}`;
  }

  public getCookieWithJwtAccessToken(userId: string) {
    const expiresIn = this.configService.get('TOKEN_EXPIRATION_TIME', '30d');

    const payload: TokenPayload = { userId };
    const token = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn,
    });
    return `Authentication=${token}; HttpOnly; Path=/; Max-Age=${expiresIn}`;
  }

  public getCookieWithJwtRefreshToken(userId: string) {
    const payload: TokenPayload = { userId };
    const token = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_TOKEN_SECRET'),
      expiresIn: `${this.configService.get('JWT_REFRESH_TOKEN_EXPIRATION_TIME')}`,
    });
    const cookie = `Refresh=${token}; HttpOnly; Path=/; Max-Age=${this.configService.get('JWT_REFRESH_TOKEN_EXPIRATION_TIME')}`;
    return { cookie, token };
  }

  //A method that generates cookies to clear both the access token and the refresh token
  public getCookiesForLogOut() {
    return [
      'Authentication=; HttpOnly; Path=/; Max-Age=0',
      'Refresh=; HttpOnly; Path=/; Max-Age=0',
    ];
  }

  // Device authentication (new)
  async validateDevice(deviceId: string, secretKey: string): Promise<any> {
    const { device } = await this.devicesService.validateDeviceCredentials(
      deviceId,
      secretKey,
    );

    if (device) {
      return {
        deviceId: device.id,
        type: device.type,
        location: device.location,
        isActive: device.isActive,
        isDevice: true,
      };
    }
    return null;
  }

  // Generate device JWT
  async generateDeviceToken(device: Device) {
    const payload = {
      sub: `device:${device.deviceId}`, // Different prefix
      deviceId: device.deviceId,
      deviceType: device.type,
      location: device.location,
      iss: 'iot-platform-device',
      aud: 'telemetry-api',
      type: 'device', // Token type
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get('DEVICE_JWT_SECRET'),
      expiresIn: '30d', // Longer for devices
    });
  }
}
