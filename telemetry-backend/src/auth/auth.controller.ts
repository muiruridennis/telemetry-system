import { Body, Controller, Post, Req, UseGuards, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { User } from 'src/users/entities/user.entity';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Req() req: { user: User }) {
    return this.authService.login(req.user);
  }

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('validate')
  async validateToken(@Req() req: any) {
    return {
      valid: true,
      user: req.user,
    };
  }

  @Post('device-login')
  async deviceLogin(
    @Body('deviceId') deviceId: string,
    @Body('deviceSecret') deviceSecret: string,
  ) {
    return this.authService.deviceLogin(deviceId, deviceSecret);
  }
}
