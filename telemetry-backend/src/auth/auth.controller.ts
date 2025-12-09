import { Body, Controller, Post, Req, UseGuards, Get, HttpCode, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(200)
  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    const user = await this.authService.validateUser(body.email, body.password);
  
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
  
    return this.authService.login(user);
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
