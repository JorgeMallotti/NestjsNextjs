import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  UnauthorizedException,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { DemoService } from './demo.service';
import { Public } from '../../common/decorators/public.decorator';

/** Same cookie options as AuthController */
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};

class DemoLoginDto {
  userId: string;
}

@Controller('demo')
export class DemoController {
  constructor(private readonly demoService: DemoService) {}

  /**
   * Returns the list of demo accounts (admin + clients)
   * so the frontend can show 1-click login buttons.
   */
  @Public()
  @Get('accounts')
  getDemoAccounts() {
    return this.demoService.getDemoAccounts();
  }

  /**
   * 1-click demo login — no password required.
   * Sets HttpOnly cookie with JWT.
   */
  @Public()
  @Post('login')
  async demoLogin(
    @Body() dto: DemoLoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.demoService.demoLogin(dto.userId);
    res.cookie('auth_token', result.accessToken, COOKIE_OPTIONS);
    return { user: result.user };
  }

  /**
   * Reset the demo database to its initial seeded state.
   * Protected by a secret key passed via header or query.
   * Called by cron-job.org or Railway cron every 24h.
   *
   * Headers:
   *   x-reset-secret: <RESET_SECRET from env>
   */
  @Public()
  @Post('reset')
  async resetDatabase(@Headers('x-reset-secret') secret: string) {
    const expected = process.env.RESET_SECRET;
    if (expected && secret !== expected) {
      throw new UnauthorizedException('Invalid reset secret');
    }
    return this.demoService.resetDatabase();
  }
}
