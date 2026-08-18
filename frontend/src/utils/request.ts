import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { ElMessage } from 'element-plus'
import { getToken, clearAuthStorage } from '@/utils/auth'
import type { ApiResponse } from '@/types/api'

/** 扩展请求配置：可跳过全局错误提示 */
export interface RequestConfig extends AxiosRequestConfig {
  skipErrorHandler?: boolean
}

const service: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json;charset=UTF-8' },
})

/** 请求拦截：自动附加 Bearer Token */
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: unknown) => Promise.reject(error),
)

/** 响应拦截：统一解包 + 401 处理 */
service.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const res = response.data
    const cfg = response.config as RequestConfig

    // 业务成功
    if (res.code === 200) {
      return response
    }

    // Token 失效
    if (res.code === 401) {
      if (!cfg.skipErrorHandler) {
        ElMessage.error(res.message || '登录已过期，请重新登录')
      }
      clearAuthStorage()
      // 避免循环跳转
      if (window.location.pathname !== '/login') {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`
      }
      return Promise.reject(new Error(res.message || 'Unauthorized'))
    }

    if (!cfg.skipErrorHandler) {
      ElMessage.error(res.message || '请求失败')
    }
    return Promise.reject(new Error(res.message || 'Error'))
  },
  (error: unknown) => {
    const err = error as {
      response?: { status?: number; data?: { message?: string } }
      message?: string
      config?: RequestConfig
    }
    if (!err.config?.skipErrorHandler) {
      if (err.response?.status === 401) {
        clearAuthStorage()
        ElMessage.error('登录已过期，请重新登录')
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      } else {
        ElMessage.error(err.response?.data?.message || err.message || '网络异常')
      }
    }
    return Promise.reject(error)
  },
)

/**
 * 泛型请求封装：直接返回 data 字段，带完整类型推断
 * @example const list = await request<PageResult<User>>({ url: '/system/user/list' })
 */
export function request<T = unknown>(config: RequestConfig): Promise<T> {
  return service.request<ApiResponse<T>>(config).then((res) => res.data.data)
}

export default service
