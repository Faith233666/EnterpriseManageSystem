import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { JwtPayload } from '../../common/interfaces/api-response.interface';
import { SysMenu } from '../menu/entities/sys-menu.entity';
import { SysUser } from '../user/entities/sys-user.entity';
import { LoginDto } from './dto/login.dto';
import { PermissionResolver } from './permission.resolver';

/** 前端动态路由节点 */
export interface RouteMenuNode {
  id: number;
  parentId: number;
  name: string;
  path: string;
  component: string | null;
  redirect: string | null;
  perms: string | null;
  icon: string | null;
  menuType: number;
  visible: number;
  children?: RouteMenuNode[];
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(SysUser)
    private readonly userRepo: Repository<SysUser>,
    private readonly jwtService: JwtService,
    private readonly permissionResolver: PermissionResolver,
  ) {}

  /** 登录：校验账号密码，签发 JWT */
  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({
      where: { username: dto.username },
      select: ['id', 'username', 'password', 'nickname', 'status', 'avatar'],
    });

    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }
    if (user.status !== 1) {
      throw new UnauthorizedException('账号已被禁用');
    }

    const matched = await bcrypt.compare(dto.password, user.password);
    if (!matched) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    await this.userRepo.update(user.id, { lastLoginAt: new Date() });

    const payload: JwtPayload = { sub: user.id, username: user.username };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      tokenType: 'Bearer',
      userInfo: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar,
      },
    };
  }

  /**
   * 获取当前用户权限信息：角色 + 权限码 + 菜单树
   * admin 也按角色菜单授权，取消勾选 / 禁用菜单立即生效
   */
  async getPermissionInfo(userId: number) {
    const { user, roles, menus, permissions } =
      await this.permissionResolver.resolveByUserId(userId);

    const routeMenus = menus.filter(
      (m) => m.menuType === 1 || m.menuType === 2,
    );
    const menuTree = this.buildMenuTree(routeMenus);

    return {
      userInfo: {
        id: Number(user.id),
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar,
      },
      roles,
      permissions,
      menus: menuTree,
    };
  }

  /** 扁平菜单 → 树形结构 */
  private buildMenuTree(menus: SysMenu[], parentId = 0): RouteMenuNode[] {
    return menus
      .filter((m) => Number(m.parentId) === parentId)
      .map((m) => {
        const node: RouteMenuNode = {
          id: Number(m.id),
          parentId: Number(m.parentId),
          name: m.menuName,
          path: m.path ?? '',
          component: m.component,
          redirect: m.redirect,
          perms: m.perms,
          icon: m.icon,
          menuType: m.menuType,
          visible: m.visible,
        };
        const children = this.buildMenuTree(menus, Number(m.id));
        if (children.length > 0) {
          node.children = children;
        }
        return node;
      });
  }
}
