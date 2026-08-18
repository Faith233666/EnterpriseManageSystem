import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { BizCode } from '../constants/biz-code';
import { ApiResponse } from '../interfaces/api-response.interface';

/**
 * 全局异常过滤器
 * 将 HttpException / 未知异常统一包装为 { code, data, message }
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code: number = BizCode.INTERNAL_ERROR;
    let message = '服务器内部错误';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      code = status;
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const body = res as Record<string, unknown>;
        // class-validator 校验错误：message 可能是 string[]
        if (Array.isArray(body.message)) {
          message = (body.message as string[]).join('; ');
          code = BizCode.BAD_REQUEST;
        } else if (typeof body.message === 'string') {
          message = body.message;
        }
      }
    } else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
      message = exception.message || message;
    }

    const payload: ApiResponse<null> = {
      code,
      data: null,
      message,
    };

    response.status(status).json(payload);
  }
}
