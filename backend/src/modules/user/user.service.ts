import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { In, Repository } from 'typeorm';
import { PageResult } from '../../common/interfaces/api-response.interface';
import { SysRole } from '../role/entities/sys-role.entity';
import {
  CreateUserDto,
  UpdateUserDto,
  UserQueryDto,
} from './dto/user.dto';
import { SysUser } from './entities/sys-user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(SysUser)
    private readonly userRepo: Repository<SysUser>,
    @InjectRepository(SysRole)
    private readonly roleRepo: Repository<SysRole>,
  ) {}

  /** 分页查询（支持模糊搜索 + 时间范围） */
  async findPage(query: UserQueryDto): Promise<PageResult<SysUser>> {
    const {
      page = 1,
      pageSize = 10,
      username,
      nickname,
      phone,
      status,
      beginTime,
      endTime,
    } = query;

    const qb = this.userRepo
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.roles', 'r')
      .orderBy('u.createdAt', 'DESC');

    if (username) {
      qb.andWhere('u.username LIKE :username', { username: `%${username}%` });
    }
    if (nickname) {
      qb.andWhere('u.nickname LIKE :nickname', { nickname: `%${nickname}%` });
    }
    if (phone) {
      qb.andWhere('u.phone LIKE :phone', { phone: `%${phone}%` });
    }
    if (status !== undefined && status !== null) {
      qb.andWhere('u.status = :status', { status });
    }
    if (beginTime) {
      qb.andWhere('u.created_at >= :beginTime', { beginTime });
    }
    if (endTime) {
      qb.andWhere('u.created_at <= :endTime', { endTime });
    }

    const [list, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { list, total, page, pageSize };
  }

  async findOne(id: number): Promise<SysUser> {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['roles'],
    });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }

  async create(dto: CreateUserDto): Promise<SysUser> {
    const exists = await this.userRepo.findOne({
      where: { username: dto.username },
    });
    if (exists) {
      throw new BadRequestException('用户名已存在');
    }

    const user = this.userRepo.create({
      username: dto.username,
      password: await bcrypt.hash(dto.password, 10),
      nickname: dto.nickname,
      email: dto.email ?? null,
      phone: dto.phone ?? null,
      gender: dto.gender ?? 0,
      status: dto.status ?? 1,
      remark: dto.remark ?? null,
    });

    if (dto.roleIds?.length) {
      user.roles = await this.roleRepo.findBy({ id: In(dto.roleIds) });
    }

    return this.userRepo.save(user);
  }

  async update(id: number, dto: UpdateUserDto): Promise<SysUser> {
    const user = await this.findOne(id);

    if (dto.username && dto.username !== user.username) {
      const exists = await this.userRepo.findOne({
        where: { username: dto.username },
      });
      if (exists) {
        throw new BadRequestException('用户名已存在');
      }
      user.username = dto.username;
    }

    if (dto.nickname !== undefined) user.nickname = dto.nickname;
    if (dto.email !== undefined) user.email = dto.email ?? null;
    if (dto.phone !== undefined) user.phone = dto.phone ?? null;
    if (dto.gender !== undefined) user.gender = dto.gender;
    if (dto.status !== undefined) user.status = dto.status;
    if (dto.remark !== undefined) user.remark = dto.remark ?? null;

    if (dto.password) {
      user.password = await bcrypt.hash(dto.password, 10);
    }

    if (dto.roleIds !== undefined) {
      user.roles = dto.roleIds.length
        ? await this.roleRepo.findBy({ id: In(dto.roleIds) })
        : [];
    }

    return this.userRepo.save(user);
  }

  /** 软删除 */
  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    if (user.username === 'admin') {
      throw new BadRequestException('不能删除超级管理员');
    }
    await this.userRepo.softRemove(user);
  }

  /** 状态启用/禁用 */
  async updateStatus(id: number, status: number): Promise<void> {
    const user = await this.findOne(id);
    if (user.username === 'admin' && status === 0) {
      throw new BadRequestException('不能禁用超级管理员');
    }
    await this.userRepo.update(id, { status });
  }
}
