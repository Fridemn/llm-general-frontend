<template>
  <div class="flex flex-col space-y-4">
    <div v-if="loading" class="flex justify-center items-center py-4">
      <div class="loader"></div>
    </div>
    <div v-else-if="messages.length === 0" class="text-center text-gray-500 py-10">
      <p>开始一个新对话吧</p>
    </div>
    <template v-else>
      <div 
        v-for="(message, index) in formattedMessages" 
        :key="message.message_id || index"
        class="message-item"
        :class="{
          'message-user': isUser(message),
          'message-assistant': isAssistant(message),
          'message-system': isSystem(message)
        }"
        ref="messageElements"
      >
        <div class="flex items-start">
          <div class="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
            <span v-if="isUser(message)" class="material-icons text-blue-500">person</span>
            <span v-else-if="isAssistant(message)" class="material-icons text-green-500">smart_toy</span>
            <span v-else class="material-icons text-gray-500">info</span>
          </div>
          <div class="flex-1">
            <div class="text-sm text-gray-500 mb-1">
              {{ getSenderName(message) }}
            </div>
            <ChatMessageContent 
              :content="getMessageContent(message)"
              :isUser="isUser(message)"
              :isError="isError(message)"
              :isStreaming="isStreaming && index === messages.length - 1 && isAssistant(message)"
            />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, ref, watch, nextTick } from 'vue';
import ChatMessageContent from './ChatMessageContent.vue';

const props = defineProps({
  messages: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  isStreaming: {
    type: Boolean,
    default: false
  }
});

const messageElements = ref([]);

// 滚动到最新消息
watch(() => props.messages.length, async () => {
  await nextTick();
  if (messageElements.value?.length > 0) {
    const lastMessage = messageElements.value[messageElements.value.length - 1];
    lastMessage?.scrollIntoView({ behavior: 'smooth' });
  }
}, { immediate: true });

// 监听流式消息的变化，确保滚动到底部
watch(() => props.isStreaming, async (newVal) => {
  if (newVal) {
    await nextTick();
    if (messageElements.value?.length > 0) {
      const lastMessage = messageElements.value[messageElements.value.length - 1];
      lastMessage?.scrollIntoView({ behavior: 'smooth' });
    }
  }
});

// 将消息格式化为一致的结构
const formattedMessages = computed(() => {
  return props.messages.map(msg => {
    // 处理API返回的标准消息格式
    if (msg.sender && (msg.components || msg.message_str)) {
      return msg;
    }
    
    // 处理前端临时创建的消息格式
    return {
      message_id: msg.id || Date.now().toString(),
      sender: {
        role: msg.role || 'user',
        nickname: msg.nickname
      },
      components: [
        {
          type: 'text',
          content: msg.content || msg.streamContent || ''
        }
      ],
      message_str: msg.content || msg.streamContent || '',
      timestamp: msg.timestamp || Date.now(),
      isError: msg.isError,
      streamContent: msg.streamContent
    };
  });
});

const isUser = (message) => {
  return message.sender?.role === 'user';
};

const isAssistant = (message) => {
  return message.sender?.role === 'assistant';
};

const isSystem = (message) => {
  return message.sender?.role === 'system';
};

const isError = (message) => {
  return message.isError === true;
};

const getSenderName = (message) => {
  if (isUser(message)) {
    return message.sender.nickname || '你';
  }
  if (isAssistant(message)) {
    return message.sender.nickname || 'AI助手';
  }
  return '系统消息';
};

const getMessageContent = (message) => {
  // 优先使用流式内容
  if (message.streamContent !== undefined) {
    return message.streamContent;
  }
  
  if (message.message_str) {
    return message.message_str;
  }
  if (message.components && message.components.length > 0) {
    return message.components.map(comp => comp.content).join('\n');
  }
  return message.content || '';
};
</script>

<style scoped>
.message-item {
  margin-bottom: 1.5rem;
}

.message-user .message-content {
  background-color: #e3f2fd;
}

.message-assistant .message-content {
  background-color: #f1f5f9;
}

.message-system .message-content {
  background-color: #fef9c3;
}

.loader {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
