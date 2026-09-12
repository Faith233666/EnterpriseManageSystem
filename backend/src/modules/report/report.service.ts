import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Like, Repository } from 'typeorm';
import { BizAppointment } from '../booking/entities/biz-appointment.entity';
import { BizServiceItem } from '../booking/entities/biz-service-item.entity';
import { BizStaff } from '../booking/entities/biz-staff.entity';
import { BizMember } from '../member/entities/biz-member.entity';

export interface ReportQueryDto {
  startDate?: string;
  endDate?: string;
  status?: number;
  serviceId?: number;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(BizAppointment)
    private readonly appointmentRepo: Repository<BizAppointment>,
    @InjectRepository(BizMember)
    private readonly memberRepo: Repository<BizMember>,
    @InjectRepository(BizServiceItem)
    private readonly serviceItemRepo: Repository<BizServiceItem>,
    @InjectRepository(BizStaff)
    private readonly staffRepo: Repository<BizStaff>,
  ) {}

  /**
   * 获取综合分析报表概览
   */
  async getOverview() {
    const [
      totalAppointments,
      completedCount,
      cancelledCount,
      totalMembers,
      vipMembers,
      services,
      staffs,
      appointments,
    ] = await Promise.all([
      this.appointmentRepo.count(),
      this.appointmentRepo.count({ where: { status: 2 } }),
      this.appointmentRepo.count({ where: { status: 3 } }),
      this.memberRepo.count(),
      this.memberRepo.count({ where: { level: 3 } }),
      this.serviceItemRepo.find(),
      this.staffRepo.find(),
      this.appointmentRepo.find({
        order: { createdAt: 'DESC' },
        take: 50,
      }),
    ]);

    const completionRate = totalAppointments > 0 
      ? Math.round((completedCount / totalAppointments) * 100) 
      : 0;

    // 1. 状态分布
    const statusCounts = {
      pending: await this.appointmentRepo.count({ where: { status: 1 } }),
      completed: completedCount,
      cancelled: cancelledCount,
      expired: await this.appointmentRepo.count({ where: { status: 4 } }),
    };

    const statusDistribution = [
      { name: '待服务', value: statusCounts.pending },
      { name: '已完成', value: statusCounts.completed },
      { name: '已取消', value: statusCounts.cancelled },
      { name: '已过期', value: statusCounts.expired },
    ];

    // 2. 服务项目消费占比
    const serviceDistributionMap = new Map<string, number>();
    for (const app of appointments) {
      const sName = app.service?.name || '未知项目';
      serviceDistributionMap.set(sName, (serviceDistributionMap.get(sName) || 0) + 1);
    }
    
    // 补齐已知服务项
    for (const item of services) {
      if (!serviceDistributionMap.has(item.name)) {
        serviceDistributionMap.set(item.name, 0);
      }
    }

    const serviceDistribution = Array.from(serviceDistributionMap.entries()).map(([name, value]) => ({
      name,
      value,
    }));

    // 3. 员工服务业绩统计
    const staffPerformanceMap = new Map<string, { total: number; completed: number }>();
    for (const staff of staffs) {
      staffPerformanceMap.set(staff.name, { total: 0, completed: 0 });
    }

    const allApps = await this.appointmentRepo.find();
    for (const app of allApps) {
      const name = app.staff?.name || '未分配员工';
      const cur = staffPerformanceMap.get(name) || { total: 0, completed: 0 };
      cur.total += 1;
      if (app.status === 2) cur.completed += 1;
      staffPerformanceMap.set(name, cur);
    }

    const staffPerformance = Array.from(staffPerformanceMap.entries()).map(([name, stat]) => ({
      name,
      total: stat.total,
      completed: stat.completed,
    }));

    // 4. 会员等级占比
    const memberLevels = [
      { name: '普通会员', value: await this.memberRepo.count({ where: { level: 1 } }) },
      { name: '黄金会员', value: await this.memberRepo.count({ where: { level: 2 } }) },
      { name: '钻石会员', value: vipMembers },
    ];

    // 5. 趋势图表（最近7日趋势）
    const trend = this.buildRecent7DaysTrend(allApps);

    return {
      kpi: {
        totalAppointments,
        completedCount,
        completionRate: `${completionRate}%`,
        totalMembers,
        vipMembers,
        serviceItemCount: services.length,
        activeStaffCount: staffs.length,
      },
      statusDistribution,
      serviceDistribution,
      staffPerformance,
      memberLevels,
      trend,
    };
  }

  /**
   * 业务数据表格明细查询与筛选
   */
  async getDetailList(query: ReportQueryDto) {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 10;

    const qb = this.appointmentRepo.createQueryBuilder('ap')
      .leftJoinAndSelect('ap.service', 'service')
      .leftJoinAndSelect('ap.staff', 'staff')
      .orderBy('ap.createdAt', 'DESC');

    if (query.status) {
      qb.andWhere('ap.status = :status', { status: query.status });
    }

    if (query.serviceId) {
      qb.andWhere('ap.service_id = :serviceId', { serviceId: query.serviceId });
    }

    if (query.startDate && query.endDate) {
      qb.andWhere('ap.appoint_date BETWEEN :startDate AND :endDate', {
        startDate: query.startDate,
        endDate: query.endDate,
      });
    }

    if (query.keyword) {
      qb.andWhere(
        '(ap.customer_name LIKE :kw OR ap.phone LIKE :kw OR ap.order_no LIKE :kw)',
        { kw: `%${query.keyword}%` },
      );
    }

    const [items, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    const formatted = items.map((item) => ({
      id: item.id,
      orderNo: item.orderNo,
      customerName: item.customerName,
      phone: item.phone,
      serviceName: item.service?.name || '-',
      duration: item.service?.duration ? `${item.service.duration}分钟` : '-',
      staffName: item.staff?.name || '-',
      storeName: item.staff?.storeName || '-',
      appointDate: item.appointDate,
      timeSlot: `${item.slotStart} - ${item.slotEnd}`,
      status: item.status,
      createdAt: item.createdAt,
    }));

    return {
      list: formatted,
      total,
      page,
      pageSize,
    };
  }

  private buildRecent7DaysTrend(appointments: BizAppointment[]) {
    const dates: string[] = [];
    const totalList: number[] = [];
    const completedList: number[] = [];
    const now = new Date();

    const dateMap = new Map<string, { total: number; completed: number }>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const str = d.toISOString().split('T')[0];
      dateMap.set(str, { total: 0, completed: 0 });
    }

    for (const app of appointments) {
      const dateStr = String(app.appointDate);
      if (dateMap.has(dateStr)) {
        const val = dateMap.get(dateStr)!;
        val.total += 1;
        if (app.status === 2) val.completed += 1;
      }
    }

    for (const [dateStr, val] of dateMap.entries()) {
      dates.push(dateStr.slice(5)); // MM-DD
      totalList.push(val.total);
      completedList.push(val.completed);
    }

    return { dates, totalList, completedList };
  }
}
