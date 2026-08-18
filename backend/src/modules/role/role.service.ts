import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { PageResult } from '../../common/interfaces/api-response.interface';
import { SysMenu } from '../menu/entities/sys-menu.entity';
import {
  CreateRoleDto,
  RoleQueryDto,
  UpdateRoleDto,
} from './dto/role.dto';
import { SysRole } from './entities/sys-role.entity';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(SysRole)
    private readonly roleRepo: Repository<SysRole>,
    @InjectRepository(SysMenu)
    private readonly menuRepo: Repository<SysMenu>,
  ) {}

  /** 分页查询 */
  async findPage(query: RoleQueryDto): Promise<PageResult<SysRole>> {
    const { page = 1, pageSize = 10, roleName, roleKey, status } = query;

    const qb = this.roleRepo
      .createQueryBuilder('r')
      .orderBy('r.sort', 'ASC')
      .addOrderBy('r.id', 'ASC');

    if (roleName) {
      qb.andWhere('r.role_name LIKE :roleName', { roleName: `%${roleName}%` });
    }
    if (roleKey) {
      qb.andWhere('r.role_key LIKE :roleKey', { roleKey: `%${roleKey}%` });
    }
    if (status !== undefined && status !== null) {
      qb.andWhere('r.status = :status', { status });
    }

    const [list, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { list, total, page, pageSize };
  }

  /** 下拉选项（启用中的角色） */
  async findOptions() {
    const list = await this.roleRepo.find({
      where: { status: 1 },
      order: { sort: 'ASC', id: 'ASC' },
      select: ['id', 'roleName', 'roleKey'],
    });
    return list.map((r) => ({
      id: Number(r.id),
      roleName: r.roleName,
      roleKey: r.roleKey,
    }));
  }

  async findOne(id: number) {
    const role = await this.roleRepo.findOne({
      where: { id },
      relations: ['menus'],
    });
    if (!role) {
      throw new NotFoundException('角色不存在');
    }
    return {
      ...role,
      id: Number(role.id),
      menuIds: (role.menus ?? []).map((m) => Number(m.id)),
      menus: undefined,
    };
  }

  async create(dto: CreateRoleDto) {
    const exists = await this.roleRepo.findOne({
      where: { roleKey: dto.roleKey },
    });
    if (exists) {
      throw new BadRequestException('角色标识已存在');
    }

    const role = this.roleRepo.create({
      roleName: dto.roleName,
      roleKey: dto.roleKey,
      sort: dto.sort ?? 0,
      status: dto.status ?? 1,
      remark: dto.remark ?? null,
    });

    if (dto.menuIds?.length) {
      role.menus = await this.menuRepo.findBy({ id: In(dto.menuIds) });
    }

    return this.roleRepo.save(role);
  }

  async update(id: number, dto: UpdateRoleDto) {
    const role = await this.roleRepo.findOne({
      where: { id },
      relations: ['menus'],
    });
    if (!role) {
      throw new NotFoundException('角色不存在');
    }

    if (role.roleKey === 'admin' && dto.roleKey && dto.roleKey !== 'admin') {
      throw new BadRequestException('不能修改超级管理员标识');
    }

    if (dto.roleKey && dto.roleKey !== role.roleKey) {
      const exists = await this.roleRepo.findOne({
        where: { roleKey: dto.roleKey },
      });
      if (exists) {
        throw new BadRequestException('角色标识已存在');
      }
      role.roleKey = dto.roleKey;
    }

    if (dto.roleName !== undefined) role.roleName = dto.roleName;
    if (dto.sort !== undefined) role.sort = dto.sort;
    if (dto.status !== undefined) role.status = dto.status;
    if (dto.remark !== undefined) role.remark = dto.remark ?? null;

    if (dto.menuIds !== undefined) {
      const menuIds = dto.menuIds.map(Number);
      role.menus = menuIds.length
        ? await this.menuRepo.findBy({ id: In(menuIds) })
        : [];
    }

    const saved = await this.roleRepo.save(role);
    return {
      ...saved,
      id: Number(saved.id),
      menuIds: (saved.menus ?? []).map((m) => Number(m.id)),
    };
  }

  async remove(id: number) {
    const role = await this.roleRepo.findOne({ where: { id } });
    if (!role) {
      throw new NotFoundException('角色不存在');
    }
    if (role.roleKey === 'admin') {
      throw new BadRequestException('不能删除超级管理员角色');
    }
    await this.roleRepo.softRemove(role);
  }

  async updateStatus(id: number, status: number) {
    const role = await this.roleRepo.findOne({ where: { id } });
    if (!role) {
      throw new NotFoundException('角色不存在');
    }
    if (role.roleKey === 'admin' && status === 0) {
      throw new BadRequestException('不能禁用超级管理员角色');
    }
    await this.roleRepo.update(id, { status });
  }
}
