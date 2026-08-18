import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PageQueryDto } from '../../../common/dto/page-query.dto';

/** 用户分页查询 */
export class UserQueryDto extends PageQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  username?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  nickname?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @Type(() => Number)
  @IsIn([0, 1])
  status?: number;

  /** 创建时间起 YYYY-MM-DD HH:mm:ss */
  @IsOptional()
  @IsString()
  beginTime?: string;

  /** 创建时间止 */
  @IsOptional()
  @IsString()
  endTime?: string;
}

/** 新增用户 */
export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: '用户名不能为空' })
  @MaxLength(64)
  username!: string;

  @IsString()
  @MinLength(6, { message: '密码至少 6 位' })
  @MaxLength(64)
  password!: string;

  @IsString()
  @IsNotEmpty({ message: '昵称不能为空' })
  @MaxLength(64)
  nickname!: string;

  @IsOptional()
  @IsEmail({}, { message: '邮箱格式不正确' })
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @Type(() => Number)
  @IsIn([0, 1, 2])
  gender?: number;

  @IsOptional()
  @Type(() => Number)
  @IsIn([0, 1])
  status?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  remark?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Type(() => Number)
  roleIds?: number[];
}

/** 修改用户（字段均可选，密码留空则不修改） */
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  username?: string;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: '密码至少 6 位' })
  @MaxLength(64)
  password?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  nickname?: string;

  @IsOptional()
  @IsEmail({}, { message: '邮箱格式不正确' })
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @Type(() => Number)
  @IsIn([0, 1, 2])
  gender?: number;

  @IsOptional()
  @Type(() => Number)
  @IsIn([0, 1])
  status?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  remark?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Type(() => Number)
  roleIds?: number[];
}

/** 状态切换 */
export class UpdateUserStatusDto {
  @Type(() => Number)
  @IsIn([0, 1], { message: '状态只能为 0 或 1' })
  status!: number;
}
