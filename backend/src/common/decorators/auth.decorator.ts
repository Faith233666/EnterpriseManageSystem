import { SetMetadata } from '@nestjs/common';

/** 标记接口为公开（跳过 JWT 校验） */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/** 按钮级权限标识，如 @Permissions('sys:user:add') */
export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...perms: string[]) =>
  SetMetadata(PERMISSIONS_KEY, perms);
