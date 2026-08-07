import { Controller, Post, Get, Body, UseGuards, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto, AdminRegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

/**
 * HttpOnly cookie options — JWT is stored in a cookie that
 * JavaScript cannot access, protecting against XSS attacks.
 */
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('register/admin')
  registerAdmin(@Body() dto: RegisterDto) {
    return this.authService.registerAdmin(dto);
  }

  @Public()
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);
    res.cookie('auth_token', result.accessToken, COOKIE_OPTIONS);
    return { user: result.user };
  }

  @Public()
  @Post('login/admin')
  async loginAdmin(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.loginAdmin(dto);
    res.cookie('auth_token', result.accessToken, COOKIE_OPTIONS);
    return { user: result.user };
  }

  @Public()
  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('auth_token', { path: '/' });
    return { message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@CurrentUser('id') userId: string) {
    return this.authService.getProfile(userId);
  }
}
