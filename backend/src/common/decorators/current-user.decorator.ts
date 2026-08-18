import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/** 获取当前登录用户（由 JwtStrategy validate 注入） */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user: Record<string, unknown> }>();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
