<template>
  <div class="flex flex-col space-y-4 py-4 px-2">
    <div v-if="loading" class="flex justify-center items-center py-6">
      <div class="loader"></div>
    </div>
    <div v-else-if="messages.length === 0" class="flex flex-col items-center justify-center h-full text-gray-500 py-10">
      <span class="material-icons text-4xl mb-4">开始一个新对话吧</span>
    </div>
    <template v-else>
      <div 
        v-for="(message, index) in formattedMessages" 
        :key="message.message_id || index"
        class="message-container"
        :class="{
          'justify-end': isUser(message)
        }"
        ref="messageElements"
      >
        <!-- AI消息 左侧 -->
        <div v-if="!isUser(message)" 
          class="message-wrapper flex max-w-[80%]"
          :class="{
            'opacity-70': isStreamingResponse && index !== messages.length - 1
          }"
        >
          <div class="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-2">
            <span v-if="isAssistant(message)" class="material-icons text-sm text-indigo-600">AI</span>
            <span v-else class="material-icons text-sm text-gray-500">info</span>
          </div>
          <div>
            <div class="text-xs text-gray-500 mb-1 ml-1">
              {{ getSenderName(message) }}
            </div>
            <ChatMessageContent 
              :content="getMessageContent(message)"
              :isUser="false"
              :isError="isError(message)"
              :isStreaming="isStreaming && index === messages.length - 1 && isAssistant(message)"
            />
          </div>
        </div>

        <!-- 用户消息 右侧 -->
        <div v-else 
          class="message-wrapper flex max-w-[80%] flex-row-reverse"
        >
          <div class="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center ml-2">
            <span class="material-icons text-sm text-blue-600">You</span>
          </div>
          <div class="flex flex-col items-end">
            <div class="text-xs text-gray-500 mb-1 mr-1">
              {{ getSenderName(message) }}
            </div>
            <ChatMessageContent 
              :content="getMessageContent(message)"
              :isUser="true"
              :isError="isError(message)"
              :isStreaming="false"
            />
          </div>
        </div>
      </div>
      
      <!-- 打字指示器，仅在流式加载时显示 -->
      <div v-if="isStreaming && messages.length > 0 && isAssistant(messages[messages.length-1])" 
          class="message-container typing-indicator-container">
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
const isStreamingResponse = computed(() => props.isStreaming);

// 滚动到最新消息
watch(() => props.messages.length, async () => {
  await nextTick();
}, { immediate: true });

// 监听流式消息的变化，确保滚动到底部
watch(() => props.isStreaming, async (newVal) => {
  if (newVal) {
    await nextTick();
  }
});

// 监听消息内容变化，在流式输出时保持滚动
watch(() => props.messages, async () => {
  if (props.isStreaming) {
    await nextTick();
  }
}, { deep: true });


// 将消息格式化为一致的结构
const formattedMessages = computed(() => {
  return props.messages.map(msg => {
    // 如果已经是标准格式但可能缺少某些字段，补全它们
    if (msg.sender) {
      return {
        ...msg,
        message_id: msg.message_id || msg.id || Date.now().toString(),
        components: msg.components || [{
          type: 'text',
          content: msg.message_str || msg.streamContent || msg.content || ''
        }],
        message_str: msg.message_str || msg.streamContent || 
                    (msg.components && msg.components.length > 0 
                      ? msg.components.map(comp => comp.content).join('\n') 
                      : msg.content || ''),
        timestamp: msg.timestamp || Date.now()
      };
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

// 获取消息内容的函数，优先级：streamContent > message_str > components > content
const getMessageContent = (message) => {
  // 优先使用流式内容
  if (message.streamContent !== undefined && message.streamContent !== null) {
    return message.streamContent;
  }
  
  // 其次使用message_str
  if (message.message_str) {
    return message.message_str;
  }
  
  // 再次尝试从components中提取
  if (message.components && message.components.length > 0) {
    return message.components.map(comp => comp.content).join('\n');
  }
  
  // 最后尝试使用content属性
  return message.content || '';
};

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
</script>

<style scoped>
.message-container {
  display: flex;
  margin-bottom: 1rem;
  width: 100%;
}

.message-wrapper {
  transition: opacity 0.2s ease;
}

.loader {
  border: 2px solid rgba(79, 70, 229, 0.2);
  border-top: 2px solid #4f46e5;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.typing-indicator-container {
  height: 24px;
}
</style>
