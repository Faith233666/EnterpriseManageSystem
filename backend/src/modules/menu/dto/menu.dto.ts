import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';

/** 菜单树查询 */
export class MenuQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  menuName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsIn([0, 1])
  status?: number;
}

/** 新增菜单 */
export class CreateMenuDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  parentId?: number;

  @IsString()
  @IsNotEmpty({ message: '菜单名称不能为空' })
  @MaxLength(64)
  menuName!: string;

  /** 1目录 2菜单 3按钮 */
  @Type(() => Number)
  @IsIn([1, 2, 3], { message: '菜单类型不正确' })
  menuType!: number;

  @ValidateIf((o: CreateMenuDto) => o.menuType === 1 || o.menuType === 2)
  @IsString()
  @IsNotEmpty({ message: '路由地址不能为空' })
  @MaxLength(200)
  path?: string;

  @ValidateIf((o: CreateMenuDto) => o.menuType === 2)
  @IsString()
  @IsNotEmpty({ message: '组件路径不能为空' })
  @MaxLength(255)
  component?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  redirect?: string;

  @ValidateIf((o: CreateMenuDto) => o.menuType === 3)
  @IsString()
  @IsNotEmpty({ message: '权限标识不能为空' })
  @MaxLength(100)
  perms?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  icon?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sort?: number;

  @IsOptional()
  @Type(() => Number)
  @IsIn([0, 1])
  visible?: number;

  @IsOptional()
  @Type(() => Number)
  @IsIn([0, 1])
  status?: number;

  @IsOptional()
  @Type(() => Number)
  @IsIn([0, 1])
  isFrame?: number;

  @IsOptional()
  @Type(() => Number)
  @IsIn([0, 1])
  isCache?: number;
}

/** 修改菜单 */
export class UpdateMenuDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  parentId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  menuName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsIn([1, 2, 3])
  menuType?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  path?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  component?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  redirect?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  perms?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  icon?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sort?: number;

  @IsOptional()
  @Type(() => Number)
  @IsIn([0, 1])
  visible?: number;

  @IsOptional()
  @Type(() => Number)
  @IsIn([0, 1])
  status?: number;

  @IsOptional()
  @Type(() => Number)
  @IsIn([0, 1])
  isFrame?: number;

  @IsOptional()
  @Type(() => Number)
  @IsIn([0, 1])
  isCache?: number;
}
