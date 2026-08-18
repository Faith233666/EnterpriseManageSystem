import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { PageQueryDto } from '../../../common/dto/page-query.dto';

/** 角色分页查询 */
export class RoleQueryDto extends PageQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  roleName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  roleKey?: string;

  @IsOptional()
  @Type(() => Number)
  @IsIn([0, 1])
  status?: number;
}

/** 新增角色 */
export class CreateRoleDto {
  @IsString()
  @IsNotEmpty({ message: '角色名称不能为空' })
  @MaxLength(64)
  roleName!: string;

  @IsString()
  @IsNotEmpty({ message: '角色标识不能为空' })
  @MaxLength(64)
  roleKey!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sort?: number;

  @IsOptional()
  @Type(() => Number)
  @IsIn([0, 1])
  status?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  remark?: string;

  /** 菜单/权限 ID 列表（含按钮） */
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Type(() => Number)
  menuIds?: number[];
}

/** 修改角色 */
export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  roleName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  roleKey?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sort?: number;

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
  menuIds?: number[];
}

/** 状态切换 */
export class UpdateRoleStatusDto {
  @Type(() => Number)
  @IsIn([0, 1], { message: '状态只能为 0 或 1' })
  status!: number;
}
