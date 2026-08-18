import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SysMenu } from '../menu/entities/sys-menu.entity';
import { SysRole } from '../role/entities/sys-role.entity';
import { SysUser } from '../user/entities/sys-user.entity';

@Controller('dashboard')
export class DashboardController {
  constructor(
    @InjectRepository(SysUser)
    private readonly userRepo: Repository<SysUser>,
    @InjectRepository(SysRole)
    private readonly roleRepo: Repository<SysRole>,
    @InjectRepository(SysMenu)
    private readonly menuRepo: Repository<SysMenu>,
  ) {}

  /** GET /api/dashboard/stats — 首页统计与图表数据 */
  @Get('stats')
  async getStats() {
    const [userTotal, userEnabled, roleTotal, menuTotal] = await Promise.all([
      this.userRepo.count(),
      this.userRepo.count({ where: { status: 1 } }),
      this.roleRepo.count(),
      this.menuRepo.count(),
    ]);

    const roles = await this.roleRepo.find({
      relations: ['users'],
      order: { sort: 'ASC' },
    });

    const roleDistribution = roles.map((r) => ({
      name: r.roleName,
      value: (r.users ?? []).length,
    }));

    // 近 7 日访问趋势（演示数据，可后续接入真实埋点）
    const visitTrend = buildLast7DaysTrend();

    // 各业务模块访问占比（演示）
    const moduleVisits = [
      { name: '用户管理', value: 420 },
      { name: '角色管理', value: 260 },
      { name: '菜单管理', value: 180 },
      { name: '首页看板', value: 510 },
      { name: '其他', value: 95 },
    ];

    return {
      cards: {
        userTotal,
        userEnabled,
        roleTotal,
        menuTotal,
      },
      visitTrend,
      roleDistribution:
        roleDistribution.length > 0
          ? roleDistribution
          : [{ name: '未分配', value: 0 }],
      moduleVisits,
    };
  }
}

function buildLast7DaysTrend() {
  const days: string[] = [];
  const pv: number[] = [];
  const uv: number[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const label = `${d.getMonth() + 1}/${d.getDate()}`;
    days.push(label);
    // 稳定伪随机，避免每次刷新剧烈跳动
    const seed = d.getDate() * 17 + d.getMonth() * 3;
    pv.push(800 + (seed % 400) + i * 35);
    uv.push(220 + (seed % 120) + i * 12);
  }
  return { days, pv, uv };
}
