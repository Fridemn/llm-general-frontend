<template>
  <div>
    <div class="mb-4">
      <input
        type="tel"
        :value="phone"
        @input="$emit('update:phone', $event.target.value)"
        placeholder="手机号"
        required
        class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
      />
    </div>
    <div class="mb-4 flex gap-2">
      <input
        type="text"
        :value="code"
        @input="$emit('update:code', $event.target.value)"
        placeholder="验证码"
        required
        class="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
      />
      <button
        type="button"
        @click="$emit('send-code')"
        :disabled="countdown > 0"
        class="px-4 py-2 bg-blue-500 text-white rounded-md disabled:bg-gray-400 transition-colors duration-200"
      >
        {{ countdown > 0 ? `${countdown}秒后重试` : '获取验证码' }}
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  phone: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true
  },
  countdown: {
    type: Number,
    default: 0
  }
})

defineEmits(['update:phone', 'update:code', 'send-code'])
</script>
