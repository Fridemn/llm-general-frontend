<template>
  <div class="flex flex-col space-y-4">
    <div
      v-for="(message, index) in messages"
      :key="index"
      :class="[
        'max-w-3xl mx-auto p-4 rounded-lg',
        message.role === 'user' 
          ? 'bg-blue-50 ml-auto' 
          : 'bg-white shadow-sm'
      ]"
    >
      <div class="flex items-start">
        <div
          class="w-8 h-8 rounded-full flex items-center justify-center mr-3"
          :class="message.role === 'user' ? 'bg-blue-500' : 'bg-green-500'"
        >
          <span class="material-icons text-white text-sm">
            {{ message.role === 'user' ? 'person' : 'smart_toy' }}
          </span>
        </div>
        <div class="flex-1">
          <div class="text-sm text-gray-500 mb-1">
            {{ message.role === 'user' ? '你' : 'AI' }}
            <span class="ml-2">{{ formatTime(message.timestamp) }}</span>
          </div>
          <div class="whitespace-pre-wrap">{{ message.content }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  messages: {
    type: Array,
    default: () => []
  }
})

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString()
}
</script>
