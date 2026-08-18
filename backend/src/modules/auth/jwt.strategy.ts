import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../../common/interfaces/api-response.interface';
import { PermissionResolver } from './permission.resolver';

/** 挂载到 request.user 的上下文 */
export interface AuthUserContext {
  id: number;
  username: string;
  nickname: string;
  roles: string[];
  permissions: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly permissionResolver: PermissionResolver,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUserContext> {
    const { user, roles, permissions } =
      await this.permissionResolver.resolveByUserId(payload.sub);

    if (user.status !== 1) {
      throw new UnauthorizedException('用户无效或已禁用');
    }

    return {
      id: Number(user.id),
      username: user.username,
      nickname: user.nickname,
      roles,
      permissions,
    };
  }
}
