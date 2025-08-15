import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export type JwtRefreshPayload = { sub: string; email: string; role: string };

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: any) => req?.cookies?.refreshToken || null,
      ]),
      passReqToCallback: true,
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET'),
    });
  }

  async validate(req: any, payload: JwtRefreshPayload) {
    const token = req?.cookies?.refreshToken;
    if (!token) {
      throw new UnauthorizedException('Refresh token not found');
    }
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}