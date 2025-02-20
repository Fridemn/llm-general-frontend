<template>
  <div class="flex justify-center items-center min-h-screen bg-gray-100">
    <div class="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
      <h2 class="text-2xl font-semibold text-center text-gray-800 mb-8">
        {{ formTitle }}
      </h2>
      <form @submit.prevent="handleSubmit">
        <!-- 登录表单 -->
        <template v-if="isLogin && !isForgotPassword">
          <div class="mb-4">
            <input
              type="tel"
              v-model="form.phone"
              placeholder="手机号"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
          <div class="mb-4 relative">
            <input
              :type="passwordVisible.password ? 'text' : 'password'"
              v-model="form.password"
              placeholder="密码"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
            <button
              type="button"
              @click="passwordVisible.password = !passwordVisible.password"
              class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" 
                  :d="passwordVisible.password 
                  ? 'M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88' 
                  : 'M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z'"
                />
              </svg>
            </button>
          </div>
        </template>

        <!-- 忘记密码表单 -->
        <template v-if="isForgotPassword">
          <div class="mb-4">
            <input
              type="tel"
              v-model="form.phone"
              placeholder="手机号"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
          <div class="mb-4 flex gap-2">
            <input
              type="text"
              v-model="form.verificationCode"
              placeholder="验证码"
              required
              class="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
            <button
              type="button"
              @click="getVerificationCode"
              :disabled="countdown > 0"
              class="px-4 py-2 bg-blue-500 text-white rounded-md disabled:bg-gray-400"
            >
              {{ countdown > 0 ? `${countdown}秒后重试` : '获取验证码' }}
            </button>
          </div>
          <div class="mb-4 relative">
            <input
              :type="passwordVisible.newPassword ? 'text' : 'password'"
              v-model="form.newPassword"
              placeholder="新密码"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
            <button
              type="button"
              @click="passwordVisible.newPassword = !passwordVisible.newPassword"
              class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" 
                  :d="passwordVisible.newPassword 
                  ? 'M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88' 
                  : 'M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z'"
                />
              </svg>
            </button>
          </div>
          <div class="mb-4 relative">
            <input
              :type="passwordVisible.confirmPassword ? 'text' : 'password'"
              v-model="form.confirmPassword"
              placeholder="确认新密码"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
            <button
              type="button"
              @click="passwordVisible.confirmPassword = !passwordVisible.confirmPassword"
              class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" 
                  :d="passwordVisible.confirmPassword 
                  ? 'M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88' 
                  : 'M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z'"
                />
              </svg>
            </button>
          </div>
        </template>

        <!-- 注册表单 -->
        <template v-if="!isLogin && !isForgotPassword">
          <div class="mb-4">
            <input
              type="text"
              v-model="form.username"
              placeholder="用户名"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
          <div class="mb-4">
            <input
              type="tel"
              v-model="form.phone"
              placeholder="手机号"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
          <div class="mb-4">
            <input
              type="email"
              v-model="form.email"
              placeholder="邮箱"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
          <div class="mb-4 flex gap-2">
            <input
              type="text"
              v-model="form.verificationCode"
              placeholder="验证码"
              required
              class="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
            <button
              type="button"
              @click="getVerificationCode"
              :disabled="countdown > 0"
              class="px-4 py-2 bg-blue-500 text-white rounded-md disabled:bg-gray-400"
            >
              {{ countdown > 0 ? `${countdown}秒后重试` : '获取验证码' }}
            </button>
          </div>
          <div class="mb-4 relative">
            <input
              :type="passwordVisible.password ? 'text' : 'password'"
              v-model="form.password"
              placeholder="密码"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
            <button
              type="button"
              @click="passwordVisible.password = !passwordVisible.password"
              class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" 
                  :d="passwordVisible.password 
                  ? 'M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88' 
                  : 'M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z'"
                />
              </svg>
            </button>
          </div>
          <div class="mb-4 relative">
            <input
              :type="passwordVisible.confirmPassword ? 'text' : 'password'"
              v-model="form.confirmPassword"
              placeholder="确认密码"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
            <button
              type="button"
              @click="passwordVisible.confirmPassword = !passwordVisible.confirmPassword"
              class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" 
                  :d="passwordVisible.confirmPassword 
                  ? 'M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88' 
                  : 'M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z'"
                />
              </svg>
            </button>
          </div>
        </template>

        <button
          type="submit"
          class="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-md transition duration-200 ease-in-out"
        >
          {{ submitButtonText }}
        </button>
      </form>

      <div class="text-center mt-4 space-y-2">
        <template v-if="isLogin && !isForgotPassword">
          <div>
            <span
              @click="toggleForgotPassword"
              class="text-blue-500 hover:text-blue-600 cursor-pointer hover:underline"
            >
              忘记密码？
            </span>
          </div>
        </template>
        <div>
          <span
            v-if="!isForgotPassword"
            @click="toggleForm"
            class="text-blue-500 hover:text-blue-600 cursor-pointer hover:underline"
          >
            {{ isLogin ? '没有账号？立即注册' : '已有账号？立即登录' }}
          </span>
          <span
            v-else
            @click="toggleForgotPassword"
            class="text-blue-500 hover:text-blue-600 cursor-pointer hover:underline"
          >
            返回登录
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { validatePhone, validateEmail, validatePasswordMatch } from '@/utils/validators'
import { getRegisterCode, register, passwordLogin } from '@/api'  // 添加 passwordLogin 导入
import { useRouter } from 'vue-router'  // 添加路由

const router = useRouter()

const isLogin = ref(true)
const isForgotPassword = ref(false)
const countdown = ref(0)

const form = reactive({
  username: '',
  phone: '',
  email: '',
  password: '',
  newPassword: '',
  verificationCode: '',
  confirmPassword: ''
})

// 添加密码可见性控制
const passwordVisible = reactive({
  password: false,
  newPassword: false,
  confirmPassword: false
})

const formTitle = computed(() => {
  if (isForgotPassword.value) return '重置密码'
  return isLogin.value ? '登录' : '注册'
})

const submitButtonText = computed(() => {
  if (isForgotPassword.value) return '重置密码'
  return isLogin.value ? '登录' : '注册'
})

const toggleForm = () => {
  isLogin.value = !isLogin.value
  isForgotPassword.value = false
  resetForm()
}

const toggleForgotPassword = () => {
  isForgotPassword.value = !isForgotPassword.value
  resetForm()
}

const resetForm = () => {
  Object.keys(form).forEach(key => form[key] = '')
}

const validateForm = () => {
  if (!validatePhone(form.phone)) {
    alert('请输入有效的手机号')
    return false
  }

  if (isLogin.value && !isForgotPassword.value) {
    if (!form.password) {
      alert('请输入密码')
      return false
    }
  } else if (isForgotPassword.value) {
    if (!form.verificationCode) {
      alert('请输入验证码')
      return false
    }
    if (!form.newPassword) {
      alert('请输入新密码')
      return false
    }
    if (!validatePasswordMatch(form.newPassword, form.confirmPassword)) {
      alert('两次输入的密码不一致')
      return false
    }
  } else {
    // 注册验证逻辑
    if (!form.username || !form.email || !form.password) {
      alert('请填写所有必填项')
      return false
    }

    if (!validateEmail(form.email)) {
      alert('请输入有效的邮箱地址')
      return false
    }

    if (!validatePasswordMatch(form.password, form.confirmPassword)) {
      alert('两次输入的密码不一致')
      return false
    }
  }

  return true
}

const getVerificationCode = async () => {
  if (!form.phone) {
    alert('请先填写手机号')
    return
  }

  if (!validatePhone(form.phone)) {
    alert('请输入有效的手机号')
    return
  }

  try {
    const { request } = getRegisterCode(form.phone)
    const res = await request
    console.log('验证码发送响应:', res)
    alert(res.message || '验证码发送成功')
    
    // 开始倒计时
    countdown.value = 60
    const timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer)
      }
    }, 1000)
  } catch (error) {
    alert(error.response?.data?.message || '验证码发送失败')
    console.error('验证码发送失败:', error)
  }
}

const handleSubmit = async () => {
  if (!validateForm()) return
  
  if (isLogin.value && !isForgotPassword.value) {
    // 处理登录逻辑
    try {
      const { request } = passwordLogin({
        account: form.phone,  // 使用手机号作为账号
        password: form.password
      })
      const res = await request
      
      // 保存 token 和用户信息
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('userInfo', JSON.stringify(res.data.user))
      
      alert(res.message || '登录成功')
      // 登录成功后跳转到首页或其他页面
      router.push('/test')
    } catch (error) {
      alert(error.response?.data?.message || '登录失败')
      console.error('登录失败:', error)
    }
  } else if (isForgotPassword.value) {
    // 处理重置密码逻辑
    console.log('重置密码表单', { 
      phone: form.phone,
      verificationCode: form.verificationCode,
      newPassword: form.newPassword 
    })
  } else {
    // 处理注册逻辑
    try {
      const { request } = register({
        username: form.username,
        phone: form.phone,
        password: form.password,
        code: form.verificationCode
      })
      const res = await request
      alert(res.message || '注册成功')
      // 注册成功后切换到登录页
      isLogin.value = true
      resetForm()
    } catch (error) {
      alert(error.response?.data?.message || '注册失败')
      console.error('注册失败:', error)
    }
  }
}
</script>
