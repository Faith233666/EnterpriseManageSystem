import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateMenuDto,
  MenuQueryDto,
  UpdateMenuDto,
} from './dto/menu.dto';
import { SysMenu } from './entities/sys-menu.entity';

/** 菜单树节点 */
export interface MenuTreeNode extends SysMenu {
  children?: MenuTreeNode[];
}

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(SysMenu)
    private readonly menuRepo: Repository<SysMenu>,
  ) {}

  /** 菜单树（管理端） */
  async findTree(query: MenuQueryDto): Promise<MenuTreeNode[]> {
    const qb = this.menuRepo
      .createQueryBuilder('m')
      .orderBy('m.sort', 'ASC')
      .addOrderBy('m.id', 'ASC');

    if (query.menuName) {
      qb.andWhere('m.menu_name LIKE :menuName', {
        menuName: `%${query.menuName}%`,
      });
    }
    if (query.status !== undefined && query.status !== null) {
      qb.andWhere('m.status = :status', { status: query.status });
    }

    const list = await qb.getMany();
    // 规范化 bigint id
    const normalized = list.map((m) => ({
      ...m,
      id: Number(m.id),
      parentId: Number(m.parentId),
    })) as MenuTreeNode[];

    // 名称搜索时返回扁平匹配结果的子树不便，直接建树（匹配节点的祖先也会保留较复杂）
    // 简化：有搜索条件时返回扁平过滤列表的树（仅匹配节点及其子）
    if (query.menuName) {
      return this.buildTree(normalized);
    }
    return this.buildTree(normalized);
  }

  /** 下拉/授权用：完整菜单树 */
  async findTreeForSelect(): Promise<MenuTreeNode[]> {
    const list = await this.menuRepo.find({
      order: { sort: 'ASC', id: 'ASC' },
    });
    const normalized = list.map((m) => ({
      ...m,
      id: Number(m.id),
      parentId: Number(m.parentId),
    })) as MenuTreeNode[];
    return this.buildTree(normalized);
  }

  async findOne(id: number) {
    const menu = await this.menuRepo.findOne({ where: { id } });
    if (!menu) {
      throw new NotFoundException('菜单不存在');
    }
    // 保持实体实例，避免 save 时被当成 INSERT
    return menu;
  }

  async create(dto: CreateMenuDto) {
    const parentId = dto.parentId ?? 0;
    if (parentId > 0) {
      const parent = await this.menuRepo.findOne({ where: { id: parentId } });
      if (!parent) {
        throw new BadRequestException('父菜单不存在');
      }
      // 按钮只能挂在菜单下；菜单可挂在目录或菜单下
      if (dto.menuType === 3 && parent.menuType !== 2) {
        throw new BadRequestException('按钮权限只能挂在菜单节点下');
      }
      if (dto.menuType === 2 && parent.menuType === 3) {
        throw new BadRequestException('不能在按钮下创建菜单');
      }
    }

    const menu = this.menuRepo.create({
      parentId,
      menuName: dto.menuName,
      menuType: dto.menuType,
      path: dto.path ?? null,
      component: dto.component ?? null,
      redirect: dto.redirect ?? null,
      perms: dto.perms ?? null,
      icon: dto.icon ?? null,
      sort: dto.sort ?? 0,
      visible: dto.visible ?? 1,
      status: dto.status ?? 1,
      isFrame: dto.isFrame ?? 0,
      isCache: dto.isCache ?? 0,
    });

    const saved = await this.menuRepo.save(menu);
    return this.toView(saved);
  }

  async update(id: number, dto: UpdateMenuDto) {
    const menu = await this.findOne(id);

    if (dto.parentId !== undefined) {
      const parentId = Number(dto.parentId);
      if (parentId === Number(id)) {
        throw new BadRequestException('父菜单不能是自己');
      }
      if (parentId > 0) {
        const parent = await this.menuRepo.findOne({
          where: { id: parentId },
        });
        if (!parent) {
          throw new BadRequestException('父菜单不存在');
        }
        // 防止把节点挂到自己的子孙下
        const descendants = await this.collectDescendantIds(Number(id));
        if (descendants.includes(parentId)) {
          throw new BadRequestException('不能将菜单移动到其子节点下');
        }
      }
      menu.parentId = parentId;
    }

    if (dto.menuName !== undefined) menu.menuName = dto.menuName;
    if (dto.menuType !== undefined) menu.menuType = dto.menuType;
    if (dto.path !== undefined) menu.path = dto.path;
    if (dto.component !== undefined) menu.component = dto.component;
    if (dto.redirect !== undefined) menu.redirect = dto.redirect;
    if (dto.perms !== undefined) menu.perms = dto.perms;
    if (dto.icon !== undefined) menu.icon = dto.icon;
    if (dto.sort !== undefined) menu.sort = dto.sort;
    if (dto.visible !== undefined) menu.visible = dto.visible;
    if (dto.status !== undefined) menu.status = dto.status;
    if (dto.isFrame !== undefined) menu.isFrame = dto.isFrame;
    if (dto.isCache !== undefined) menu.isCache = dto.isCache;

    const saved = await this.menuRepo.save(menu);
    return this.toView(saved);
  }

  /** API 视图：bigint 转 number，避免前端精度/勾选问题 */
  private toView(menu: SysMenu) {
    return {
      ...menu,
      id: Number(menu.id),
      parentId: Number(menu.parentId),
    };
  }

  async remove(id: number) {
    const childCount = await this.menuRepo.count({ where: { parentId: id } });
    if (childCount > 0) {
      throw new BadRequestException('存在子菜单，请先删除子节点');
    }
    const menu = await this.menuRepo.findOne({ where: { id } });
    if (!menu) {
      throw new NotFoundException('菜单不存在');
    }
    await this.menuRepo.remove(menu);
  }

  private buildTree(list: MenuTreeNode[], parentId = 0): MenuTreeNode[] {
    return list
      .filter((m) => m.parentId === parentId)
      .map((m) => {
        const children = this.buildTree(list, m.id);
        return children.length ? { ...m, children } : { ...m };
      });
  }

  private async collectDescendantIds(id: number): Promise<number[]> {
    const all = await this.menuRepo.find({ select: ['id', 'parentId'] });
    const map = new Map<number, number[]>();
    for (const m of all) {
      const pid = Number(m.parentId);
      const mid = Number(m.id);
      if (!map.has(pid)) map.set(pid, []);
      map.get(pid)!.push(mid);
    }
    const result: number[] = [];
    const stack = [...(map.get(id) ?? [])];
    while (stack.length) {
      const cur = stack.pop()!;
      result.push(cur);
      const kids = map.get(cur);
      if (kids) stack.push(...kids);
    }
    return result;
  }
}
