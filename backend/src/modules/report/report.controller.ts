import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportQueryDto, ReportService } from './report.service';

@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  /**
   * GET /api/report/overview — 综合报表概览与图表数据
   */
  @Get('overview')
  async getOverview() {
    return this.reportService.getOverview();
  }

  /**
   * GET /api/report/detail — 报表明细筛选与数据列表
   */
  @Get('detail')
  async getDetail(@Query() query: ReportQueryDto) {
    return this.reportService.getDetailList(query);
  }
}
