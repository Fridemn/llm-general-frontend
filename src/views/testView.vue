<template>
    <div>
        1111
    </div>
  <div class="test-container">
    <div class="test-card">
      <h2 class="test-title">验证码发送测试</h2>
      <div class="test-content">
        <div class="phone-display">
          当前测试手机号: <span class="phone-number">{{ phone }}</span>
        </div>
        <button
          @click="handleSendCode"
          :disabled="countdown > 0"
          class="test-button"
        >
          {{ countdown > 0 ? `${countdown}秒后重试` : '发送验证码' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { getRegisterCode } from '@/api'

const phone = ref('18501020600')
const countdown = ref(0)

const handleSendCode = async () => {
  if (countdown.value > 0) return
  
  try {
    const { request } = getRegisterCode(phone.value)
    const res = await request
    console.log('验证码发送响应:', res) // 添加调试日志
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
</script>

<style lang="scss" scoped>
.test-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f3f4f6;
  padding: 20px;
}

.test-card {
  background-color: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.test-title {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 20px;
  text-align: center;
}

.test-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.phone-display {
  padding: 12px;
  background-color: #f9fafb;
  border-radius: 6px;
  color: #4b5563;
}

.phone-number {
  font-weight: 600;
  color: #2563eb;
}

.test-button {
  padding: 12px 24px;
  background-color: #2563eb;
  color: white;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background-color: #1d4ed8;
  }

  &:disabled {
    background-color: #9ca3af;
    cursor: not-allowed;
  }
}
</style>
