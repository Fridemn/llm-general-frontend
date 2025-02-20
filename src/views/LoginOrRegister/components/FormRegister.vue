<template>
  <form @submit.prevent="handleSubmit">
    <div class="mb-4">
      <input
        type="text"
        v-model="form.username"
        placeholder="用户名"
        required
        class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
      />
    </div>
    <!-- 其他输入字段 -->
    <VerificationInput
      v-model:phone="form.phone"
      v-model:code="form.verificationCode"
      :countdown="countdown"
      @send-code="getVerificationCode"
    />

    <PasswordInput
      v-model:password="form.password"
      v-model:confirmPassword="form.confirmPassword"
    />

    <button
      type="submit"
      class="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-md transition duration-200 ease-in-out"
    >
      注册
    </button>

    <div class="text-center mt-4">
      <span
        @click="$emit('toggleForm')"
        class="text-blue-500 hover:text-blue-600 cursor-pointer hover:underline"
      >
        已有账号？立即登录
      </span>
    </div>
  </form>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { validatePhone, validateEmail, validatePasswordMatch, validatePassword } from '@/utils/validators'
import { getRegisterCode, register } from '@/api'
import VerificationInput from './InputVerification.vue'
import PasswordInput from './InputPassword.vue'

const emit = defineEmits(['toggleForm'])

const form = reactive({
  username: '',
  phone: '',
  email: '',
  password: '',
  verificationCode: '',
  confirmPassword: ''
})

const countdown = ref(0)

const getVerificationCode = async () => {
  if (!validatePhone(form.phone)) {
    alert('请输入有效的手机号')
    return
  }

  try {
    const { request } = getRegisterCode(form.phone)
    const res = await request
    alert(res.message || '验证码已发送')
    
    countdown.value = 60
    const timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer)
      }
    }, 1000)
  } catch (error) {
    alert(error.response?.data?.message || '验证码发送失败')
  }
}

const handleSubmit = async () => {
  // 表单验证
  if (!form.username) {
    alert('请输入用户名')
    return
  }
  if (!validatePhone(form.phone)) {
    alert('请输入有效的手机号')
    return
  }
  // if (!validateEmail(form.email)) {
  //   alert('请输入有效的邮箱地址')
  //   return
  // }
  if (!validatePassword(form.password)) {
    alert('密码必须至少包含8个字符，至少一个字母和一个数字')
    return
  }
  if (!validatePasswordMatch(form.password, form.confirmPassword)) {
    alert('两次输入的密码不一致')
    return
  }

  try {
    const { request } = register({
      username: form.username,
      phone: form.phone,
      // email: form.email,
      password: form.password,
      code: form.verificationCode
    })
    const res = await request
    alert(res.message || '注册成功')
    emit('toggleForm') // 注册成功后切换到登录页
  } catch (error) {
    alert(error.response?.data?.message || '注册失败')
  }
}
</script>
