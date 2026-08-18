import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/auth.decorator';

interface RequestUser {
  permissions?: string[];
  roles?: string[];
}

/**
 * 按钮级权限守卫
 * 严格校验 permissions，admin 也不再绕过（与角色菜单配置一致）
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user: RequestUser }>();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException('无访问权限');
    }

    const owned = user.permissions ?? [];
    // 满足任一所需权限即可（OR）
    const ok = required.some((p) => owned.includes(p));
    if (!ok) {
      throw new ForbiddenException('无操作权限');
    }
    return true;
  }
}
