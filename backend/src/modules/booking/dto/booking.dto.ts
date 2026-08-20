import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { PageQueryDto } from '../../../common/dto/page-query.dto';

const PHONE_REG = /^1[3-9]\d{9}$/;
const SLOT_REG = /^\d{2}:\d{2}$/;

/** 1待服务 2已完成 3已取消 4已过期 */
export const BOOKING_STATUS = {
  PENDING: 1,
  DONE: 2,
  CANCELLED: 3,
  EXPIRED: 4,
} as const;

export class BookingQueryDto extends PageQueryDto {
  /** 姓名 / 手机号 / 单号 综合模糊 */
  @IsOptional()
  @IsString()
  @MaxLength(64)
  keyword?: string;

  @IsOptional()
  @Type(() => Number)
  @IsIn([1, 2, 3, 4])
  status?: number;

  @IsOptional()
  @IsDateString()
  beginDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class SlotQueryDto {
  @IsDateString({}, { message: '请选择预约日期' })
  date!: string;

  @Type(() => Number)
  @IsInt()
  staffId!: number;

  /** 改约时排除当前单据占用的时段 */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  excludeId?: number;
}

export class CreateBookingDto {
  @IsString()
  @IsNotEmpty({ message: '客户姓名不能为空' })
  @MaxLength(64)
  customerName!: string;

  @IsString()
  @Matches(PHONE_REG, { message: '手机号格式不正确' })
  phone!: string;

  @Type(() => Number)
  @IsInt()
  serviceId!: number;

  @Type(() => Number)
  @IsInt()
  staffId!: number;

  @IsDateString({}, { message: '请选择预约日期' })
  appointDate!: string;

  @IsString()
  @Matches(SLOT_REG, { message: '请选择预约时段' })
  slotStart!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  remark?: string;
}

export class UpdateBookingDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: '客户姓名不能为空' })
  @MaxLength(64)
  customerName?: string;

  @IsOptional()
  @IsString()
  @Matches(PHONE_REG, { message: '手机号格式不正确' })
  phone?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  serviceId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  staffId?: number;

  @IsOptional()
  @IsDateString()
  appointDate?: string;

  @IsOptional()
  @IsString()
  @Matches(SLOT_REG)
  slotStart?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  remark?: string;
}

export class CancelBookingDto {
  @IsString()
  @IsNotEmpty({ message: '请填写取消原因' })
  @MaxLength(200)
  reason!: string;
}

export class BatchRemoveBookingDto {
  @IsArray()
  @ArrayMinSize(1, { message: '请选择要删除的预约记录' })
  @ArrayUnique()
  @IsInt({ each: true })
  @Type(() => Number)
  ids!: number[];
}
