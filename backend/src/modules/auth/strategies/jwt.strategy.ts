import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { PrismaService } from '../../../prisma/prisma.service';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

/**
 * Extract JWT from HttpOnly cookie first, fallback to Authorization header.
 * This supports both cookie-based auth (production) and Bearer token (dev/testing).
 */
const cookieExtractor = (req: Request): string | null => {
  let token: string | null = null;

  // Try HttpOnly cookie first (production / secure)
  if (req?.cookies) {
    token = req.cookies['auth_token'] ?? null;
  }

  // Fallback to Authorization header (dev / API clients)
  if (!token) {
    token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
  }

  return token;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: cookieExtractor,
      ignoreExpiration: false,
      secretOrKey:
        process.env.JWT_SECRET ?? 'your_jwt_secret_here_change_in_production',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        companyName: true,
        location: true,
        idNumber: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return user;
  }
}
