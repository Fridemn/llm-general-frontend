<template>
  <div 
    class="message-bubble px-4 py-2 rounded-2xl break-words"
    :class="{
      'user-message': isUser,
      'ai-message': !isUser,
      'error-message': isError
    }"
  >
    <div v-if="isStreaming && !content" class="typing-indicator">
      <span class="dot"></span>
      <span class="dot"></span>
      <span class="dot"></span>
    </div>
    <div v-else class="message-text whitespace-pre-wrap">{{ formatContent(content) }}</div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
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

// 格式化内容，处理可能的特殊字符或格式
const formatContent = (text) => {
  if (!text) return '';
  
  // 尝试解析可能被转义的JSON字符串
  try {
    if (text.startsWith('{') || text.startsWith('[')) {
      const parsed = JSON.parse(text);
      if (parsed.text || parsed.content) {
        return parsed.text || parsed.content;
      }
    }
  } catch (e) {
    // 解析失败，返回原始文本
  }
  
  return text;
};
</script>

<style scoped>
.message-bubble {
  position: relative;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  max-width: 100%;
  word-break: break-word;
}

.user-message {
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: white;
  border-bottom-right-radius: 0.25rem;
}

.ai-message {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #1e293b;
  border-bottom-left-radius: 0.25rem;
}

.error-message {
  background: #fee2e2;
  border: 1px solid #fecaca;
  color: #b91c1c;
}

.typing-indicator {
  display: inline-flex;
  align-items: center;
  min-height: 1.25rem;
}

.dot {
  width: 5px;
  height: 5px;
  background-color: currentColor;
  border-radius: 50%;
  margin: 0 2px;
  opacity: 0.7;
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

.message-text {
  line-height: 1.5;
}
</style>
