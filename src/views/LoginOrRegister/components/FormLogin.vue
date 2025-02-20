<template>
  <form @submit.prevent="handleSubmit">
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
        :type="passwordVisible ? 'text' : 'password'"
        v-model="form.password"
        placeholder="密码"
        required
        class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
      />
      <button
        type="button"
        @click="passwordVisible = !passwordVisible"
        class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
          <path stroke-linecap="round" stroke-linejoin="round" 
            :d="passwordVisible 
            ? 'M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88' 
            : 'M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z'"
          />
        </svg>
      </button>
    </div>

    <button
      type="submit"
      class="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-md transition duration-200 ease-in-out"
    >
      登录
    </button>

    <div class="text-center mt-4 space-y-2">
      <div>
        <span
          @click="$emit('toggleForgot')"
          class="text-blue-500 hover:text-blue-600 cursor-pointer hover:underline"
        >
          忘记密码？
        </span>
      </div>
      <div>
        <span
          @click="$emit('toggleForm')"
          class="text-blue-500 hover:text-blue-600 cursor-pointer hover:underline"
        >
          没有账号？立即注册
        </span>
      </div>
    </div>
  </form>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { validatePhone } from '@/utils/validators'
import { passwordLogin } from '@/api'

const emit = defineEmits(['toggleForgot', 'toggleForm', 'loginSuccess'])

const form = reactive({
  phone: '',
  password: ''
})

const passwordVisible = ref(false)

const handleSubmit = async () => {
  if (!validatePhone(form.phone)) {
    alert('请输入有效的手机号')
    return
  }

  try {
    const { request } = passwordLogin({
      account: form.phone,
      password: form.password
    })
    const res = await request
    
    localStorage.setItem('token', res.data.token)
    localStorage.setItem('userInfo', JSON.stringify(res.data.user))
    
    alert(res.message || '登录成功')
    emit('loginSuccess')
  } catch (error) {
    alert(error.response?.data?.message || '登录失败')
    console.error('登录失败:', error)
  }
}
</script>
