/**
 * 统一 API 响应结构
 * 所有接口均返回 { code, data, message }
 */
export interface ApiResponse<T = unknown> {
  code: number;
  data: T;
  message: string;
}

/** 分页结果 */
export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** JWT Payload */
export interface JwtPayload {
  sub: number;
  username: string;
}
