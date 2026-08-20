import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PageResult } from '../../common/interfaces/api-response.interface';
import {
  BOOKING_STATUS,
  CancelBookingDto,
  CreateBookingDto,
  BookingQueryDto,
  SlotQueryDto,
  UpdateBookingDto,
} from './dto/booking.dto';
import { BizAppointment } from './entities/biz-appointment.entity';
import { BizServiceItem } from './entities/biz-service-item.entity';
import { BizStaff } from './entities/biz-staff.entity';

/** 营业时段：09:00-18:00，每小时一档 */
const SLOT_STARTS = [
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
];

/** 同一人员同一时段最大可约人数 */
const SLOT_CAPACITY = 1;

/** 距预约开始不足此时长（小时）不可取消 */
const CANCEL_LIMIT_HOURS = 2;

@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(BizAppointment)
    private readonly apptRepo: Repository<BizAppointment>,
    @InjectRepository(BizServiceItem)
    private readonly serviceRepo: Repository<BizServiceItem>,
    @InjectRepository(BizStaff)
    private readonly staffRepo: Repository<BizStaff>,
  ) {}

  /** 下拉：启用中的服务项目与服务人员 */
  async getOptions() {
    const [services, staffs] = await Promise.all([
      this.serviceRepo.find({
        where: { status: 1 },
        order: { sort: 'ASC', id: 'ASC' },
      }),
      this.staffRepo.find({
        where: { status: 1 },
        order: { sort: 'ASC', id: 'ASC' },
      }),
    ]);
    return {
      services: services.map((s) => ({
        id: Number(s.id),
        name: s.name,
        duration: s.duration,
      })),
      staffs: staffs.map((s) => ({
        id: Number(s.id),
        name: s.name,
        storeName: s.storeName,
      })),
    };
  }

  /**
   * 按日期+人员返回时段库存
   * 已约满的 available=false，前端置灰
   */
  async getSlots(query: SlotQueryDto) {
    await this.ensureStaff(query.staffId);
    await this.expireOverdue();

    const occupied = await this.apptRepo.find({
      where: {
        staffId: query.staffId,
        appointDate: query.date,
        status: BOOKING_STATUS.PENDING,
      },
    });

    return SLOT_STARTS.map((start) => {
      const end = this.nextHour(start);
      const booked = occupied.filter((a) => {
        if (query.excludeId && Number(a.id) === Number(query.excludeId)) {
          return false;
        }
        return a.slotStart === start;
      }).length;
      return {
        start,
        end,
        label: `${start}-${end}`,
        booked,
        capacity: SLOT_CAPACITY,
        available: booked < SLOT_CAPACITY,
      };
    });
  }

  async findPage(query: BookingQueryDto): Promise<PageResult<BizAppointment>> {
    await this.expireOverdue();
    const { page = 1, pageSize = 10, keyword, status, beginDate, endDate } = query;

    const qb = this.apptRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.service', 's')
      .leftJoinAndSelect('a.staff', 'st')
      .orderBy('a.createdAt', 'DESC');

    if (keyword) {
      qb.andWhere(
        '(a.customer_name LIKE :kw OR a.phone LIKE :kw OR a.order_no LIKE :kw)',
        { kw: `%${keyword}%` },
      );
    }
    if (status !== undefined && status !== null) {
      qb.andWhere('a.status = :status', { status });
    }
    if (beginDate) {
      qb.andWhere('a.appoint_date >= :beginDate', { beginDate });
    }
    if (endDate) {
      qb.andWhere('a.appoint_date <= :endDate', { endDate });
    }

    const [list, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { list, total, page, pageSize };
  }

  async findOne(id: number) {
    const row = await this.apptRepo.findOne({
      where: { id },
      relations: ['service', 'staff'],
    });
    if (!row) {
      throw new NotFoundException('预约单不存在');
    }
    return row;
  }

  async create(dto: CreateBookingDto) {
    const service = await this.ensureService(dto.serviceId);
    const staff = await this.ensureStaff(dto.staffId);
    const slotEnd = this.nextHour(dto.slotStart);
    this.assertSlotValid(dto.slotStart);
    this.assertNotPast(dto.appointDate, dto.slotStart);

    const ok = await this.isSlotFree(
      dto.staffId,
      dto.appointDate,
      dto.slotStart,
    );
    if (!ok) {
      throw new BadRequestException('该时段已约满，请重新选择');
    }

    const entity = this.apptRepo.create({
      orderNo: this.genOrderNo(),
      customerName: dto.customerName,
      phone: dto.phone,
      serviceId: dto.serviceId,
      staffId: dto.staffId,
      appointDate: dto.appointDate,
      slotStart: dto.slotStart,
      slotEnd,
      status: BOOKING_STATUS.PENDING,
      remark: dto.remark ?? null,
      service,
      staff,
    });
    return this.apptRepo.save(entity);
  }

  async update(id: number, dto: UpdateBookingDto) {
    const row = await this.findOne(id);
    if (row.status !== BOOKING_STATUS.PENDING) {
      throw new BadRequestException('仅待服务的预约可修改');
    }

    if (dto.customerName !== undefined) row.customerName = dto.customerName;
    if (dto.phone !== undefined) row.phone = dto.phone;
    if (dto.remark !== undefined) row.remark = dto.remark ?? null;

    if (dto.serviceId !== undefined) {
      row.service = await this.ensureService(dto.serviceId);
      row.serviceId = dto.serviceId;
    }

    const nextStaffId = dto.staffId ?? Number(row.staffId);
    const nextDate = dto.appointDate ?? this.toDateStr(row.appointDate);
    const nextStart = dto.slotStart ?? row.slotStart;

    const reschedule =
      nextStaffId !== Number(row.staffId) ||
      nextDate !== this.toDateStr(row.appointDate) ||
      nextStart !== row.slotStart;

    if (reschedule) {
      this.assertSlotValid(nextStart);
      this.assertNotPast(nextDate, nextStart);
      const staff = await this.ensureStaff(nextStaffId);
      const free = await this.isSlotFree(nextStaffId, nextDate, nextStart, id);
      if (!free) {
        throw new BadRequestException('目标时段已约满，请重新选择');
      }
      row.staff = staff;
      row.staffId = nextStaffId;
      row.appointDate = nextDate;
      row.slotStart = nextStart;
      row.slotEnd = this.nextHour(nextStart);
    }

    return this.apptRepo.save(row);
  }

  async cancel(id: number, dto: CancelBookingDto) {
    const row = await this.findOne(id);
    if (row.status !== BOOKING_STATUS.PENDING) {
      throw new BadRequestException('当前状态不可取消');
    }

    const startAt = this.toDateTime(this.toDateStr(row.appointDate), row.slotStart);
    const limitMs = CANCEL_LIMIT_HOURS * 60 * 60 * 1000;
    if (startAt.getTime() - Date.now() < limitMs) {
      throw new BadRequestException(
        `距预约开始不足 ${CANCEL_LIMIT_HOURS} 小时，无法取消`,
      );
    }

    row.status = BOOKING_STATUS.CANCELLED;
    row.cancelReason = dto.reason;
    row.cancelledAt = new Date();
    return this.apptRepo.save(row);
  }

  async getStats() {
    await this.expireOverdue();
    const raw = await this.apptRepo
      .createQueryBuilder('a')
      .select('a.status', 'status')
      .addSelect('COUNT(1)', 'cnt')
      .groupBy('a.status')
      .getRawMany<{ status: string | number; cnt: string }>();

    const byStatus: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    for (const row of raw) {
      byStatus[Number(row.status)] = Number(row.cnt) || 0;
    }

    const today = this.toDateStr(new Date());
    const todayCount = await this.apptRepo.count({
      where: { appointDate: today },
    });

    return {
      pending: byStatus[BOOKING_STATUS.PENDING],
      done: byStatus[BOOKING_STATUS.DONE],
      cancelled: byStatus[BOOKING_STATUS.CANCELLED],
      expired: byStatus[BOOKING_STATUS.EXPIRED],
      today: todayCount,
      total:
        byStatus[1] + byStatus[2] + byStatus[3] + byStatus[4],
    };
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.apptRepo.softDelete(id);
  }

  async batchRemove(ids: number[]): Promise<void> {
    const result = await this.apptRepo.softDelete(ids);
    if (!result.affected) {
      throw new NotFoundException('未找到可删除的预约记录');
    }
  }

  /** 将已过预约开始时间仍为待服务的单据标记为已过期 */
  private async expireOverdue() {
    const pending = await this.apptRepo.find({
      where: { status: BOOKING_STATUS.PENDING },
    });
    const now = Date.now();
    const overdue = pending.filter((row) => {
      const end = this.toDateTime(this.toDateStr(row.appointDate), row.slotEnd);
      return end.getTime() < now;
    });
    if (overdue.length === 0) return;
    for (const row of overdue) {
      row.status = BOOKING_STATUS.EXPIRED;
    }
    await this.apptRepo.save(overdue);
  }

  private async isSlotFree(
    staffId: number,
    date: string,
    slotStart: string,
    excludeId?: number,
  ) {
    const qb = this.apptRepo
      .createQueryBuilder('a')
      .where('a.staff_id = :staffId', { staffId })
      .andWhere('a.appoint_date = :date', { date })
      .andWhere('a.slot_start = :slotStart', { slotStart })
      .andWhere('a.status = :status', { status: BOOKING_STATUS.PENDING });
    if (excludeId) {
      qb.andWhere('a.id <> :excludeId', { excludeId });
    }
    const count = await qb.getCount();
    return count < SLOT_CAPACITY;
  }

  private async ensureService(id: number) {
    const item = await this.serviceRepo.findOne({ where: { id, status: 1 } });
    if (!item) {
      throw new BadRequestException('服务项目不存在或已停用');
    }
    return item;
  }

  private async ensureStaff(id: number) {
    const staff = await this.staffRepo.findOne({ where: { id, status: 1 } });
    if (!staff) {
      throw new BadRequestException('服务人员不存在或已停用');
    }
    return staff;
  }

  private assertSlotValid(start: string) {
    if (!SLOT_STARTS.includes(start)) {
      throw new BadRequestException('无效的预约时段');
    }
  }

  private assertNotPast(date: string, start: string) {
    if (this.toDateTime(date, start).getTime() <= Date.now()) {
      throw new BadRequestException('不能预约已经开始或过去的时段');
    }
  }

  private nextHour(hhmm: string) {
    const [h, m] = hhmm.split(':').map(Number);
    return `${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  private toDateStr(value: string | Date) {
    if (typeof value === 'string') {
      return value.slice(0, 10);
    }
    const y = value.getFullYear();
    const mo = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${mo}-${d}`;
  }

  private toDateTime(date: string, hm: string) {
    return new Date(`${date}T${hm}:00+08:00`);
  }

  private genOrderNo() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const rand = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    return `AP${y}${m}${d}${rand}`;
  }
}
