import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { BizCode } from '../constants/biz-code';
import { ApiResponse } from '../interfaces/api-response.interface';

/**
 * 成功响应拦截器
 * 将控制器返回值包装为统一结构 { code, data, message }
 */
@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => ({
        code: BizCode.SUCCESS,
        data,
        message: 'success',
      })),
    );
  }
}
