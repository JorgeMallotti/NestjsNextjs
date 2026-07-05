import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Check if auth bypass is enabled (for testing).
   * When enabled, any valid-format credentials return a token without password verification.
   */
  private get isBypassEnabled(): boolean {
    return process.env.AUTH_BYPASS === 'true';
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        role: 'client',
        companyName: dto.companyName,
        location: dto.location,
        idNumber: dto.idNumber,
        activationDate: new Date(),
        approvedAt: null, // Pending admin approval
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        companyName: true,
        location: true,
        idNumber: true,
        createdAt: true,
      },
    });

    return user;
  }

  async registerAdmin(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        role: 'admin',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    return user;
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    // Auth bypass: skip password check when enabled for testing
    if (this.isBypassEnabled) {
      this.logger.warn(
        `Auth BYPASS active — login for ${dto.email} without password verification`,
      );
    } else {
      const isPasswordValid = await bcrypt.compare(dto.password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid email or password');
      }
    }

    return this.generateToken(user);
  }

  async loginAdmin(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || user.role !== 'admin') {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    if (this.isBypassEnabled) {
      this.logger.warn(
        `Auth BYPASS active — admin login for ${dto.email} without password verification`,
      );
    } else {
      const isPasswordValid = await bcrypt.compare(dto.password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid admin credentials');
      }
    }

    return this.generateToken(user);
  }

  private generateToken(user: {
    id: string;
    email: string;
    role: string;
    name: string;
  }) {
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

  async getProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        companyName: true,
        location: true,
        idNumber: true,
        createdAt: true,
      },
    });
  }
}
