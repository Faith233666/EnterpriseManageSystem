import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { PageResult } from '../../common/interfaces/api-response.interface';
import {
  CreateMemberDto,
  MemberQueryDto,
  UpdateMemberDto,
} from './dto/member.dto';
import { BizMember } from './entities/biz-member.entity';

@Injectable()
export class MemberService {
  constructor(
    @InjectRepository(BizMember)
    private readonly memberRepo: Repository<BizMember>,
  ) {}

  /** 分页查询：姓名/手机号模糊，等级与状态精确筛选 */
  async findPage(query: MemberQueryDto): Promise<PageResult<BizMember>> {
    const { page = 1, pageSize = 10, name, phone, level, status } = query;

    const qb = this.memberRepo
      .createQueryBuilder('m')
      .orderBy('m.createdAt', 'DESC');

    if (name) {
      qb.andWhere('m.name LIKE :name', { name: `%${name}%` });
    }
    if (phone) {
      qb.andWhere('m.phone LIKE :phone', { phone: `%${phone}%` });
    }
    if (level !== undefined && level !== null) {
      qb.andWhere('m.level = :level', { level });
    }
    if (status !== undefined && status !== null) {
      qb.andWhere('m.status = :status', { status });
    }

    const [list, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { list, total, page, pageSize };
  }

  async findOne(id: number): Promise<BizMember> {
    const member = await this.memberRepo.findOne({ where: { id } });
    if (!member) {
      throw new NotFoundException('会员不存在');
    }
    return member;
  }

  async create(dto: CreateMemberDto): Promise<BizMember> {
    const exists = await this.memberRepo.findOne({
      where: { phone: dto.phone },
    });
    if (exists) {
      throw new BadRequestException('手机号已被注册');
    }

    const member = this.memberRepo.create({
      name: dto.name,
      phone: dto.phone,
      level: dto.level,
      points: dto.points ?? 0,
      balance: String(dto.balance ?? 0),
      status: dto.status ?? 1,
      remark: dto.remark ?? null,
    });
    return this.memberRepo.save(member);
  }

  async update(id: number, dto: UpdateMemberDto): Promise<BizMember> {
    const member = await this.findOne(id);

    if (dto.phone && dto.phone !== member.phone) {
      const exists = await this.memberRepo.findOne({
        where: { phone: dto.phone },
      });
      if (exists) {
        throw new BadRequestException('手机号已被注册');
      }
      member.phone = dto.phone;
    }

    if (dto.name !== undefined) member.name = dto.name;
    if (dto.level !== undefined) member.level = dto.level;
    if (dto.points !== undefined) member.points = dto.points;
    if (dto.balance !== undefined) member.balance = String(dto.balance);
    if (dto.status !== undefined) member.status = dto.status;
    if (dto.remark !== undefined) member.remark = dto.remark ?? null;

    return this.memberRepo.save(member);
  }

  async remove(id: number): Promise<void> {
    const member = await this.findOne(id);
    await this.memberRepo.softRemove(member);
  }

  async batchRemove(ids: number[]): Promise<void> {
    const list = await this.memberRepo.findBy({ id: In(ids) });
    if (list.length === 0) {
      throw new NotFoundException('未找到可删除的会员');
    }
    await this.memberRepo.softRemove(list);
  }
}
