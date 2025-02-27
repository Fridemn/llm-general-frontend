<template>
  <div class="border-t bg-white">
    <div class="flex items-center p-3">
      <textarea
        v-model="message"
        placeholder="输入消息..."
        class="flex-1 resize-none border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        rows="2"
        @keydown.enter.exact.prevent="sendMessage"
        :disabled="disabled"
      ></textarea>
      <button
        @click="sendMessage"
        class="ml-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="!message.trim() || disabled"
      >
        <span class="material-icons">send</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['send-message'])
const message = ref('')

const sendMessage = () => {
  if (message.value.trim() && !props.disabled) {
    emit('send-message', message.value.trim())
    message.value = ''
  }
}
</script>
