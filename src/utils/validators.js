// 正则表达式
export const REGEX = {
  PHONE: /^1[3-9]\d{9}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
}

// 验证手机号
export function validatePhone(phone) {
  return REGEX.PHONE.test(phone)
}

// 验证邮箱
export function validateEmail(email) {
  return REGEX.EMAIL.test(email)
}

// 验证密码一致性
export function validatePasswordMatch(password, confirmPassword) {
  return password === confirmPassword
}
