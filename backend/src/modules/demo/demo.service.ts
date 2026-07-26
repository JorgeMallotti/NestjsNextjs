import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { execSync } from 'child_process';

@Injectable()
export class DemoService {
  private readonly logger = new Logger(DemoService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Returns demo accounts — admin + pre-seeded clients.
   * The frontend uses this to render 1-click login buttons.
   */
  async getDemoAccounts() {
    const users = await this.prisma.user.findMany({
      where: {
        email: {
          in: [
            'admin@comptechpro.com',
            'contacto@bytewise.pt',
            'geral@inovadata.pt',
            'compras@datacore.pt',
          ],
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        companyName: true,
        isActive: true,
      },
    });

    return users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      companyName: u.companyName,
      label: u.role === 'admin' ? 'Administrador' : (u.companyName ?? u.name),
    }));
  }

  /**
   * Demo login — issues a JWT for any active demo user without password.
   */
  async demoLogin(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Demo account not found');
    }

    if (!user.isActive) {
      throw new NotFoundException('Demo account is inactive');
    }

    this.logger.warn(`Demo login — ${user.email} (${user.role})`);

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  /**
   * Reset the demo database — runs `prisma migrate reset --force` + seed.
   * This wipes all data and re-seeds with fresh demo content.
   */
  async resetDatabase(): Promise<{ message: string; timestamp: string }> {
    this.logger.warn('🔄 Resetting demo database...');

    try {
      execSync(
        'npx prisma migrate reset --force 2>&1 && npx prisma db seed 2>&1',
        {
          cwd: process.cwd(),
          stdio: 'pipe',
          timeout: 120_000, // 2 minutes
          env: { ...process.env },
          shell: true as unknown as string,
        },
      );

      this.logger.log('✅ Demo database reset complete');

      return {
        message: 'Demo database reset successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('❌ Demo database reset failed', error);
      throw new InternalServerErrorException(
        'Failed to reset demo database. Check server logs.',
      );
    }
  }
}
