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
          <div class="relative"> <!-- 添加relative定位以支持绝对定位的播放按钮 -->
            <div class="text-xs text-gray-500 mb-1 ml-1">
              {{ getSenderName(message) }}
            </div>
            
            <!-- 错误消息 -->
            <div v-if="message.isError" class="text-red-500 whitespace-pre-wrap px-3 py-2 bg-red-50 rounded-lg">
              {{ getMessageContent(message) }}
            </div>
            
            <!-- 流式消息 -->
            <div v-else-if="message.isStreaming" class="whitespace-pre-wrap px-3 py-2 bg-gray-50 rounded-lg">
              {{ message.streamContent }}<span class="animate-pulse">▌</span>
            </div>
            
            <!-- 正常文本消息 -->
            <div v-else class="whitespace-pre-wrap px-3 py-2 bg-gray-50 rounded-lg">
              {{ getMessageContent(message) }}
              
              <!-- 音频播放图标按钮 - 在消息旁边 -->
              <button 
                v-if="message.hasAudio || message.audioUrl || message.audioBlobUrl"
                @click="$emit('play-audio', message)"
                class="live2d-play-btn"
                title="用数字人播放"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </button>
            </div>
            
            <!-- 音频消息 - 优先使用缓存的blob URL -->
            <div v-if="message.hasAudio" class="mt-2 px-3">
              <audio 
                controls 
                class="w-full" 
                :key="Date.now() + (message.audioBlobUrl || message.audioUrl)"
                @error="handleAudioError($event, message)"
              >
                <source 
                  :src="message.audioBlobUrl || message.audioUrl" 
                  :type="message.audioType || getAudioType(message.audioUrl)"
                >
                您的浏览器不支持音频播放
              </audio>
              <div v-if="!message.audioBlobUrl && message.audioUrl" class="text-xs text-gray-400 mt-1">
                加载音频中...
              </div>
              <div v-if="message.audioError" class="text-xs text-red-500 mt-1">
                {{ message.audioError }}
              </div>
              <div v-if="debug" class="text-xs text-gray-400 mt-1">
                Debug: {{ message.audioBlobUrl || message.audioUrl }} ({{ message.audioType || getAudioType(message.audioUrl) }})
              </div>
            </div>
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
            <div class="whitespace-pre-wrap px-3 py-2 bg-blue-50 rounded-lg relative">
              {{ getMessageContent(message) }}
              
              <!-- 用户消息的音频播放图标按钮 -->
              <button 
                v-if="message.hasAudio || message.audioUrl || message.audioBlobUrl"
                @click="$emit('play-audio', message)"
                class="live2d-play-btn live2d-play-btn-user"
                title="用数字人播放"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </button>
            </div>
            
            <!-- 用户音频消息 -->
            <div v-if="message.hasAudio" class="mt-2 px-3 w-full">
              <audio 
                controls 
                class="w-full"
                :key="Date.now() + (message.audioBlobUrl || message.audioUrl)"
                @error="handleAudioError($event, message)"
              >
                <source 
                  :src="message.audioBlobUrl || message.audioUrl" 
                  :type="message.audioType || getAudioType(message.audioUrl)"
                >
                您的浏览器不支持音频播放
              </audio>
              <div v-if="!message.audioBlobUrl && message.audioUrl" class="text-xs text-gray-400 mt-1 text-right">
                加载音频中...
              </div>
              <div v-if="message.audioError" class="text-xs text-red-500 mt-1 text-right">
                {{ message.audioError }}
              </div>
              <div v-if="debug" class="text-xs text-gray-400 mt-1">
                Debug: {{ message.audioBlobUrl || message.audioUrl }} ({{ message.audioType || getAudioType(message.audioUrl) }})
              </div>
            </div>
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


// 根据URL获取适当的音频MIME类型
const getAudioType = (url) => {
  if (!url) return 'audio/mpeg';
  if (url.endsWith('.mp3')) return 'audio/mpeg';
  if (url.endsWith('.wav')) return 'audio/wav';
  if (url.endsWith('.ogg')) return 'audio/ogg';
  return 'audio/mpeg'; // 默认类型
};

// 处理音频加载错误
const handleAudioError = (event, message) => {
  console.error('音频加载失败:', event, message);
  message.audioError = '音频加载失败，请刷新重试';
};

// 添加调试模式
const debug = ref(false); // 可以设置为true以显示调试信息

// 将消息格式化为一致的结构
const formattedMessages = computed(() => {
  return props.messages.map(msg => {
    // 如果已经是标准格式但可能缺少某些字段，补全它们
    if (msg.sender) {
      // 检查是否有音频URL或blob URL
      const hasAudio = !!msg.audioUrl || !!msg.hasAudio || !!msg.audioBlobUrl;
      
      // 确定音频类型
      let audioType = msg.audioType;
      if (!audioType) {
        if (msg.audioBlobUrl) {
          audioType = 'audio/wav'; // 录音通常是WAV格式
        } else if (msg.audioUrl) {
          audioType = getAudioType(msg.audioUrl);
        }
      }
      
      // 检查是否是录音类型的消息
      const isAudioInput = !!msg.isAudioInput;
      
      return {
        ...msg,
        message_id: msg.message_id || msg.id || Date.now().toString(),
        components: msg.components || [{
          type: 'text',
          content: msg.message_str || msg.streamContent || msg.content || ''
        }],
        message_str: msg.message_str || msg.streamContent || 
                    (msg.components && msg.components.length > 0 
                      ? msg.components.filter(c => c.type === 'text').map(comp => comp.content).join('\n') 
                      : msg.content || ''),
        timestamp: msg.timestamp || Date.now(),
        // 确保音频属性被正确传递
        hasAudio: hasAudio,
        audioUrl: msg.audioUrl || '',
        audioBlobUrl: msg.audioBlobUrl || '',
        audioType: audioType,
        isAudioInput: isAudioInput
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

// 添加对音频元素的处理
watch(() => props.messages, async (newMessages) => {
  await nextTick();
  
  // 尝试为所有有音频但没有设置audioType的消息设置正确的类型
  newMessages.forEach(msg => {
    if ((msg.audioUrl || msg.audioBlobUrl) && !msg.audioType) {
      if (msg.audioBlobUrl) {
        msg.audioType = 'audio/wav'; // 本地录音通常是WAV格式
      } else if (msg.audioUrl) {
        msg.audioType = getAudioType(msg.audioUrl);
      }
    }
  });
  
}, { deep: true });

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

defineEmits(['play-audio'])
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

/* 数字人播放按钮样式 */
.live2d-play-btn {
  position: absolute;
  right: -8px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: #4f46e5;
  color: white;
  border: 2px solid white;
  cursor: pointer;
  transition: all 0.2s ease;
  opacity: 0.8;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.live2d-play-btn:hover {
  opacity: 1;
  transform: translateY(-50%) scale(1.1);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
}

.live2d-play-btn-user {
  right: auto;
  left: -8px;
}

/* 播放图标内部样式 */
.live2d-play-btn svg {
  width: 14px;
  height: 14px;
}
</style>
