import {
  Injectable,
  ConflictException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { Role } from '../auth/enums/role.enum';
import * as bcrypt from 'bcrypt';
// import { LoginDto } from './dto/loginDto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findByLogin({ email, password }: { email: string; password: string }) {
    const user = await this.usersRepository.findOne({ where: { email } });

    if (!user) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    return user;
  }

  async getAllUsers() {
    const users = await this.usersRepository.find({});
    users.forEach(
      // @ts-ignore
      (user) => (user.password = undefined),
      // user.currentHashedRefreshToken = undefined;
    );
    return users;
  }

  async getById(id: string) {
    const user = await this.usersRepository.findOneBy({ id });
    if (user) {
      return user;
    }
    throw new HttpException(
      'User with this id does not exist',
      HttpStatus.NOT_FOUND,
    );
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const newUser = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });
    await this.usersRepository.save(newUser);
    return newUser;
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return user;
  }

  async remove(id: string) {
    const user = await this.usersRepository.findOne({
      where: { id },
    });
    if (!user) {
      throw new HttpException(
        `user with id ${id} does not exist`,
        HttpStatus.NOT_FOUND,
      );
    }
    await this.usersRepository.delete(id);
    return { Message: 'user deleted successfully' };
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.usersRepository.findOneBy({ email });
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }
  async ChangeRole(id: string, role: Role): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new HttpException('user not founnd ', HttpStatus.NOT_FOUND);
    }
    user.role = role;
    return this.usersRepository.save(user);
  }

  async getByEmail(email: string) {
    const user = await this.usersRepository.findOneBy({ email });
    if (user) {
      return user;
    }
    throw new HttpException(
      'User with this email does not exist',
      HttpStatus.NOT_FOUND,
    );
  }
  async removeRefreshToken(userId: string) {
    return this.usersRepository.update(userId, {
      refreshToken: null,
    });
  }
  async setCurrentRefreshToken(refreshToken: string, userId: string) {
    const currentHashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.usersRepository.update(userId, {
      refreshToken: currentHashedRefreshToken,
    });
  }
  //To be used in refresh-token-strategy to check if refresh token matches the user.currentHashedRefreshToken
  async getUserIfRefreshTokenMatches(refreshToken: string, userId: string) {
    const user = await this.getById(userId);

    const refreshTokenIsMatching = await bcrypt.compare(
      refreshToken,
      user.refreshToken,
    );

    if (refreshTokenIsMatching) {
      return user;
    }
  }
}
