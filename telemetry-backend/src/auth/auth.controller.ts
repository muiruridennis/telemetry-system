import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
  Get,
  HttpCode,
  Res,
} from '@nestjs/common';
import type RequestWithUser from './interfaces/requestWithUser.interface';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LocalAuthenticationGuard } from './guards/localAuthentication.guard';
import { UsersService } from '.././users/users.service';
import { JwtAuthenticationGuard } from './guards/jwt-auth.guard';
import JwtRefreshGuard from './guards/jwt-refresh.guard';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @HttpCode(200) // we use  @HttpCode(200) because NestJS responds with 201 Created for POST requests by default
  @UseGuards(LocalAuthenticationGuard)
  @Post('login')
  async logIn(@Req() request: RequestWithUser) {
    const { user } = request;
    const accessTokenCookie = this.authService.getCookieWithJwtAccessToken(
      user.id,
    );
    const { cookie: refreshTokenCookie, token: refreshToken } =
      this.authService.getCookieWithJwtRefreshToken(user.id);

    await this.usersService.setCurrentRefreshToken(refreshToken, user.id);

    request.res.setHeader('Set-Cookie', [
      accessTokenCookie,
      refreshTokenCookie,
    ]);
  
    return {
      user,
      message: 'Login successful',
    };
  }

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @UseGuards(JwtAuthenticationGuard)
  @Post('logout')
  @HttpCode(200)
  async logOut(@Req() request: RequestWithUser, @Res() response: Response) {
    await this.usersService.removeRefreshToken(request.user.id);
    request.res.setHeader('Set-Cookie', this.authService.getCookiesForLogOut());
    response.send({ logoutMessage: 'logged out successfully' });
  }

  @UseGuards(JwtAuthenticationGuard)
  @Get('/currentuser')
  async authenticate(@Req() request: RequestWithUser) {
    const user = request.user;
    
      user.password = undefined;
      user.refreshToken = undefined;

    
    return user;
  }

  @UseGuards(JwtRefreshGuard)
  @Get('refresh')
  refresh(@Req() request: RequestWithUser) {
    const accessTokenCookie = this.authService.getCookieWithJwtAccessToken(
      request.user.id,
    );

    request.res.setHeader('Set-Cookie', accessTokenCookie);
    return request.user;
  }

  @Post('device-login')
  async deviceLogin(
    @Body('deviceId') deviceId: string,
    @Body('deviceSecret') deviceSecret: string,
  ) {
    return this.authService.deviceLogin(deviceId, deviceSecret);
  }
}
