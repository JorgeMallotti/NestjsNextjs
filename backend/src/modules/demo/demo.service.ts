import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { exec } from 'child_process';

/**
 * Tracks the state of the async demo database reset.
 */
export interface DemoResetStatus {
  status: 'idle' | 'running' | 'success' | 'error';
  message: string;
  startedAt?: string;
  finishedAt?: string;
}

@Injectable()
export class DemoService {
  private readonly logger = new Logger(DemoService.name);

  /** In-memory state of the last/current demo reset. */
  private resetStatus: DemoResetStatus = {
    status: 'idle',
    message: 'No reset has been requested yet',
  };

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
   * Returns the current state of the demo reset (idle / running / success / error).
   */
  getResetStatus(): DemoResetStatus {
    return this.resetStatus;
  }

  /**
   * Reset the demo database — runs `prisma migrate reset --force` + seed.
   *
   * The reset runs ASYNC in the background so the HTTP request returns
   * immediately (202). This avoids the cron-job.org timeout (60s) that
   * killed the old synchronous version mid-reset, leaving the DB empty.
   *
   * If a reset is already running, the current state is returned instead
   * of starting a second one (single-flight guard).
   */
  async resetDatabase(): Promise<DemoResetStatus> {
    if (this.resetStatus.status === 'running') {
      return this.resetStatus;
    }

    const startedAt = new Date().toISOString();
    this.resetStatus = {
      status: 'running',
      message: 'Reset started — dropping and re-seeding the database',
      startedAt,
    };

    this.logger.warn('🔄 Resetting demo database (async)...');

    exec(
      'npx prisma migrate reset --force 2>&1 && npx prisma db seed 2>&1',
      {
        cwd: process.cwd(),
        timeout: 120_000, // 2 minutes
        env: { ...process.env },
        shell: true as unknown as string,
      },
      (error, stdout) => {
        if (error) {
          this.logger.error('❌ Demo database reset failed', {
            message: error.message,
            output: stdout?.slice(-2000),
          });
          this.resetStatus = {
            status: 'error',
            message: 'Reset failed — see server logs for details',
            startedAt,
            finishedAt: new Date().toISOString(),
          };
          return;
        }

        this.logger.log('✅ Demo database reset complete');
        this.resetStatus = {
          status: 'success',
          message: 'Demo database reset successfully',
          startedAt,
          finishedAt: new Date().toISOString(),
        };
      },
    );

    return this.resetStatus;
  }
}
