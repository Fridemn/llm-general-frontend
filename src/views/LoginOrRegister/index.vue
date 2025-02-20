<template>
  <div class="flex justify-center items-center min-h-screen bg-gray-100">
    <div class="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
      <h2 class="text-2xl font-semibold text-center text-gray-800 mb-8">
        {{ formTitle }}
      </h2>

      <LoginForm v-if="isLogin && !isForgotPassword" 
        @toggle-forgot="toggleForgotPassword"
        @toggle-form="toggleForm"
        @login-success="handleLoginSuccess"
      />
      
      <RegisterForm v-if="!isLogin && !isForgotPassword"
        @toggle-form="toggleForm"
      />
      
      <ForgotPasswordForm v-if="isForgotPassword"
        @toggle-forgot="toggleForgotPassword"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import LoginForm from './components/FormLogin.vue'
import RegisterForm from './components/FormRegister.vue'
import ForgotPasswordForm from './components/FormForgotPassword.vue'

const router = useRouter()
const isLogin = ref(true)
const isForgotPassword = ref(false)

const formTitle = computed(() => {
  if (isForgotPassword.value) return '重置密码'
  return isLogin.value ? '登录' : '注册'
})

const toggleForm = () => {
  isLogin.value = !isLogin.value
  isForgotPassword.value = false
}

const toggleForgotPassword = () => {
  isForgotPassword.value = !isForgotPassword.value
}

const handleLoginSuccess = () => {
  router.push('/test')
}
</script>
