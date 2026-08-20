import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { PageQueryDto } from '../../../common/dto/page-query.dto';

const PHONE_REG = /^1[3-9]\d{9}$/;

/** 会员分页查询 */
export class MemberQueryDto extends PageQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @Type(() => Number)
  @IsIn([1, 2, 3])
  level?: number;

  @IsOptional()
  @Type(() => Number)
  @IsIn([0, 1])
  status?: number;
}

/** 新增会员 */
export class CreateMemberDto {
  @IsString()
  @IsNotEmpty({ message: '姓名不能为空' })
  @MaxLength(64)
  name!: string;

  @IsString()
  @IsNotEmpty({ message: '手机号不能为空' })
  @Matches(PHONE_REG, { message: '手机号格式不正确' })
  phone!: string;

  @Type(() => Number)
  @IsIn([1, 2, 3], { message: '请选择会员等级' })
  level!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(99999999)
  points?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(99999999)
  balance?: number;

  @IsOptional()
  @Type(() => Number)
  @IsIn([0, 1])
  status?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  remark?: string;
}

/** 修改会员 */
export class UpdateMemberDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: '姓名不能为空' })
  @MaxLength(64)
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(PHONE_REG, { message: '手机号格式不正确' })
  phone?: string;

  @IsOptional()
  @Type(() => Number)
  @IsIn([1, 2, 3], { message: '请选择会员等级' })
  level?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(99999999)
  points?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(99999999)
  balance?: number;

  @IsOptional()
  @Type(() => Number)
  @IsIn([0, 1])
  status?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  remark?: string;
}

/** 批量删除 */
export class BatchRemoveMemberDto {
  @IsArray()
  @ArrayMinSize(1, { message: '请选择要删除的会员' })
  @ArrayUnique()
  @IsInt({ each: true })
  @Type(() => Number)
  ids!: number[];
}
