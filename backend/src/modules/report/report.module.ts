import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BizAppointment } from '../booking/entities/biz-appointment.entity';
import { BizServiceItem } from '../booking/entities/biz-service-item.entity';
import { BizStaff } from '../booking/entities/biz-staff.entity';
import { BizMember } from '../member/entities/biz-member.entity';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BizAppointment,
      BizMember,
      BizServiceItem,
      BizStaff,
    ]),
  ],
  controllers: [ReportController],
  providers: [ReportService],
})
export class ReportModule {}
