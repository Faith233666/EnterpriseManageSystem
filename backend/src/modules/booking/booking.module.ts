import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { BizAppointment } from './entities/biz-appointment.entity';
import { BizServiceItem } from './entities/biz-service-item.entity';
import { BizStaff } from './entities/biz-staff.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([BizAppointment, BizServiceItem, BizStaff]),
  ],
  controllers: [BookingController],
  providers: [BookingService],
})
export class BookingModule {}
