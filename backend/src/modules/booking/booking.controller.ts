import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { Permissions } from '../../common/decorators/auth.decorator';
import {
  BatchRemoveBookingDto,
  BookingQueryDto,
  CancelBookingDto,
  CreateBookingDto,
  SlotQueryDto,
  UpdateBookingDto,
} from './dto/booking.dto';
import { BookingService } from './booking.service';

@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  /** GET /api/booking/options */
  @Get('options')
  @Permissions('booking:list', 'booking:query', 'booking:add', 'booking:edit')
  getOptions() {
    return this.bookingService.getOptions();
  }

  /** GET /api/booking/slots */
  @Get('slots')
  @Permissions('booking:list', 'booking:query', 'booking:add', 'booking:edit')
  getSlots(@Query() query: SlotQueryDto) {
    return this.bookingService.getSlots(query);
  }

  /** GET /api/booking/stats */
  @Get('stats')
  @Permissions('booking:list', 'booking:query')
  getStats() {
    return this.bookingService.getStats();
  }

  /** GET /api/booking/list */
  @Get('list')
  @Permissions('booking:list', 'booking:query')
  findPage(@Query() query: BookingQueryDto) {
    return this.bookingService.findPage(query);
  }

  /** POST /api/booking/batch-remove — 须放在 :id 之前 */
  @Post('batch-remove')
  @Permissions('booking:remove')
  batchRemove(@Body() dto: BatchRemoveBookingDto) {
    return this.bookingService.batchRemove(dto.ids);
  }

  /** GET /api/booking/:id */
  @Get(':id')
  @Permissions('booking:query')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.bookingService.findOne(id);
  }

  /** POST /api/booking */
  @Post()
  @Permissions('booking:add')
  create(@Body() dto: CreateBookingDto) {
    return this.bookingService.create(dto);
  }

  /** PUT /api/booking/:id */
  @Put(':id')
  @Permissions('booking:edit')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBookingDto,
  ) {
    return this.bookingService.update(id, dto);
  }

  /** POST /api/booking/:id/cancel */
  @Post(':id/cancel')
  @Permissions('booking:cancel')
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CancelBookingDto,
  ) {
    return this.bookingService.cancel(id, dto);
  }

  /** DELETE /api/booking/:id */
  @Delete(':id')
  @Permissions('booking:remove')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.bookingService.remove(id);
  }
}
