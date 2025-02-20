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

/**
 * 用户注册
 * @param {Object} data - 注册信息
 * @param {string} data.username - 用户名
 * @param {string} data.phone - 手机号
 * @param {string} data.password - 密码
 * @param {string} data.code - 验证码
 * @param {string} [data.invitation_code] - 邀请码（可选）
 * @returns {object} 包含请求promise和取消令牌的对象
 */
export const register = (data) => {
  const config = {
    headers: {
      'Content-Type': 'application/json'
    }
  }
  const source = addCancelToken(config)
  
  return {
    request: request.post('/user/register', data, config),
    source
  }
}

/**
 * 密码登录
 * @param {Object} data - 登录信息
 * @param {string} data.account - 账号（手机号）
 * @param {string} data.password - 密码
 * @returns {object} 包含请求promise和取消令牌的对象
 */
export const passwordLogin = (data) => {
  const config = {
    headers: {
      'Content-Type': 'application/json'
    }
  }
  const source = addCancelToken(config)
  
  return {
    request: request.post('/user/password_login', data, config),
    source
  }
}




