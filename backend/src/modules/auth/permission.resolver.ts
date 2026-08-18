import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { SysMenu } from '../menu/entities/sys-menu.entity';
import { SysRole } from '../role/entities/sys-role.entity';
import { SysUser } from '../user/entities/sys-user.entity';

/**
 * 统一解析用户菜单与权限码
 * - 严格按角色-菜单授权（含 admin，不再全量放行）
 * - 仅 status=1 的菜单生效（禁用后立即失效）
 * - 权限码来自菜单/按钮上配置的 perms（类型 2、3）
 */
@Injectable()
export class PermissionResolver {
  constructor(
    @InjectRepository(SysUser)
    private readonly userRepo: Repository<SysUser>,
    @InjectRepository(SysRole)
    private readonly roleRepo: Repository<SysRole>,
  ) {}

  async resolveByUserId(userId: number): Promise<{
    user: SysUser;
    roles: string[];
    menus: SysMenu[];
    permissions: string[];
  }> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['roles'],
    });
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    const activeRoles = (user.roles ?? []).filter((r) => r.status === 1);
    const roles = activeRoles.map((r) => r.roleKey);
    const roleIds = activeRoles.map((r) => r.id);

    if (roleIds.length === 0) {
      return { user, roles, menus: [], permissions: [] };
    }

    const roleEntities = await this.roleRepo.find({
      where: { id: In(roleIds) },
      relations: ['menus'],
    });

    const menuMap = new Map<number, SysMenu>();
    for (const role of roleEntities) {
      for (const menu of role.menus ?? []) {
        // 禁用菜单不参与授权
        if (Number(menu.status) !== 1) continue;
        menuMap.set(Number(menu.id), menu);
      }
    }

    const menus = Array.from(menuMap.values()).sort(
      (a, b) => a.sort - b.sort || Number(a.id) - Number(b.id),
    );

    // 菜单节点与按钮节点上的 perms 都计入权限集
    const permissions = Array.from(
      new Set(
        menus
          .filter((m) => !!m.perms)
          .map((m) => m.perms as string),
      ),
    );

    return { user, roles, menus, permissions };
  }
}
