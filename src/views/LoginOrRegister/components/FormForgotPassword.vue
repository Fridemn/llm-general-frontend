<template>
  <form @submit.prevent="handleSubmit">
    <VerificationInput
      v-model:phone="form.phone"
      v-model:code="form.verificationCode"
      :countdown="countdown"
      @send-code="getVerificationCode"
    />

    <PasswordInput
      v-model:password="form.newPassword"
      v-model:confirmPassword="form.confirmPassword"
      passwordLabel="新密码"
    />

    <button
      type="submit"
      class="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-md transition duration-200 ease-in-out"
    >
      重置密码
    </button>

    <div class="text-center mt-4">
      <span
        @click="$emit('toggleForgot')"
        class="text-blue-500 hover:text-blue-600 cursor-pointer hover:underline"
      >
        返回登录
      </span>
    </div>
  </form>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { validatePhone, validatePasswordMatch } from '@/utils/validators'
import { getResetCode, resetPassword } from '@/api'
import VerificationInput from './InputVerification.vue'
import PasswordInput from './InputPassword.vue'

const emit = defineEmits(['toggleForgot'])

const form = reactive({
  phone: '',
  verificationCode: '',
  newPassword: '',
  confirmPassword: ''
})

const countdown = ref(0)

const getVerificationCode = async () => {
  if (!validatePhone(form.phone)) {
    alert('请输入有效的手机号')
    return
  }

  try {
    const { request } = getResetCode(form.phone)
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
  if (!validatePhone(form.phone)) {
    alert('请输入有效的手机号')
    return
  }

  if (!validatePasswordMatch(form.newPassword, form.confirmPassword)) {
    alert('两次输入的密码不一致')
    return
  }

  try {
    const { request } = resetPassword({
      phone: form.phone,
      code: form.verificationCode,
      new_password: form.newPassword
    })
    const res = await request
    alert(res.message || '密码重置成功')
    emit('toggleForgot')
  } catch (error) {
    alert(error.response?.data?.message || '密码重置失败')
  }
}
</script>
