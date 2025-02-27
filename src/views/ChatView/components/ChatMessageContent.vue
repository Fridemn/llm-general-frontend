<template>
  <div 
    class="message-content p-3 rounded-lg" 
    :class="{
      'bg-blue-100': isUser,
      'bg-gray-100': !isUser,
      'text-red-500': isError,
    }"
  >
    <span v-if="isStreaming && !content">
      <span class="typing-indicator">
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
      </span>
    </span>
    <template v-else>{{ content }}</template>
  </div>
</template>

<script setup>
defineProps({
  content: {
    type: String,
    default: ''
  },
  isUser: {
    type: Boolean,
    default: false
  },
  isError: {
    type: Boolean,
    default: false
  },
  isStreaming: {
    type: Boolean,
    default: false
  }
});
</script>

<style scoped>
.typing-indicator {
  display: inline-flex;
  align-items: center;
}

.dot {
  width: 6px;
  height: 6px;
  background-color: #888;
  border-radius: 50%;
  margin: 0 2px;
  animation: bounce 1.4s infinite ease-in-out both;
}

.dot:nth-child(1) {
  animation-delay: -0.32s;
}

.dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%, 80%, 100% { 
    transform: scale(0);
  }
  40% { 
    transform: scale(1.0);
  }
}
</style>
