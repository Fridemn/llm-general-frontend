import request from '@/api/request'
import { addCancelToken } from '@/api/request/cancel'

/**
 * 获取注册验证码
 * @param {string} phone - 手机号码
 * @returns {object} 包含请求promise和取消令牌的对象
 */

export const getRegisterCode = (phone) => {
  const config = { params: { phone } }
  const source = addCancelToken(config)
  
  return {
    request: request.get('/user/register_code', config),
    source
  }
}




