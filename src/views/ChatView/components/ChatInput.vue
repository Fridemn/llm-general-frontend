<template>
  <div class="border-t p-4">
    <div class="flex space-x-4">
      <textarea
        v-model="message"
        @keydown.enter.ctrl.prevent="handleSend"
        placeholder="输入消息，Ctrl + Enter 发送"
        class="flex-1 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        rows="3"
      ></textarea>
      <button
        @click="handleSend"
        :disabled="!message.trim()"
        class="px-6 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 transition-colors"
      >
        发送
      </button>
    </div>
    <div class="mt-2 text-xs text-gray-500">
      Ctrl + Enter 发送消息，Shift + Enter 换行
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['send-message'])
const message = ref('')

const handleSend = () => {
  const content = message.value.trim()
  if (content) {
    emit('send-message', content)
    message.value = ''
  }
}
</script>
