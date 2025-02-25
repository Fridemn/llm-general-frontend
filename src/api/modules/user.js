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
    request: request.get('/user/register/verification-code/send', config),
    source
  }
}

/**
 * 获取登录验证码
 * @param {string} phone - 手机号码
 * @returns {object} 包含请求promise和取消令牌的对象
 */
export const getLoginCode = (phone) => {
  const config = { params: { phone } }
  const source = addCancelToken(config)
  
  return {
    request: request.get('/user/login/verification-code/send', config),
    source
  }
}

/**
 * 获取重置验证码
 * @param {string} phone - 手机号码
 * @returns {object} 包含请求promise和取消令牌的对象
 */
export const getResetCode = (phone) => {
  const config = { params: { phone } }
  const source = addCancelToken(config)
  
  return {
    request: request.get('/user/reset/verification-code/send', config),
    source
  }
}

/**
 * 用户注册
 * @param {Object} data - 注册信息
 * @param {string} [data.username] - 用户名（可选）
 * @param {string} data.phone - 手机号
 * @param {string} data.password - 密码
 * @param {string} [data.verification_code] - 验证码（可选）
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
    request: request.post('/user/register/verification-code-way', data, config),
    source
  }
}

/**
 * 密码登录
 * @param {Object} data - 登录信息
 * @param {string} data.phone - 手机号
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
    request: request.post('/user/login/password-way', data, config),
    source
  }
}

/**
 * 验证码登录
 * @param {Object} data - 登录信息
 * @param {string} data.phone - 手机号
 * @param {string} data.verification_code - 验证码
 * @returns {object} 包含请求promise和取消令牌的对象
 */
export const codeLogin = (data) => {
  const config = {
    headers: {
      'Content-Type': 'application/json'
    }
  }
  const source = addCancelToken(config)
  
  return {
    request: request.post('/user/login/verification-code-way', data, config),
    source
  }
}

/**
 * 重置信息
 * @param {Object} data - 重置信息
 * @param {string} [data.username] - 用户名（可选）
 * @param {string} data.phone - 手机号
 * @param {string} data.old_password - 旧密码
 * @param {string} data.new_password - 新密码
 * @param {string} data.verification_code - 验证码
 * @param {string} [data.account] - 账号（可选）
 * @param {string} [data.invitation_code] - 邀请码（可选）
 * @returns {object} 包含请求promise和取消令牌的对象
 */
export const resetInfo = (data) => {
  const config = {
    headers: {
      'Content-Type': 'application/json'
    }
  }
  const source = addCancelToken(config)
  
  return {
    request: request.post('/user/reset/info/verification-code-way', data, config),
    source
  }
}

/**
 * 退出登录
 * @param {string} token - 用户token
 * @returns {object} 包含请求promise和取消令牌的对象
 */
export const logout = (token) => {
  const config = { params: { token } }
  const source = addCancelToken(config)
  
  return {
    request: request.post('/user/logout', null, config),
    source
  }
}

/**
 * 获取用户信息
 * @param {string} token - 用户token
 * @returns {object} 包含请求promise和取消令牌的对象
 */
export const getUserInfo = (token) => {
  const config = { params: { token } }
  const source = addCancelToken(config)
  
  return {
    request: request.get('/user/profile', config),
    source
  }
}

/**
 * 获取所有用户
 * @param {string} token - 用户token
 * @returns {object} 包含请求promise和取消令牌的对象
 */
export const getAllUsers = (token) => {
  const config = { params: { token } }
  const source = addCancelToken(config)
  
  return {
    request: request.get('/user/all-users', config),
    source
  }
}




