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
        :class="{ 'justify-end': isUser(message) }"
        ref="messageElements"
      >
        <!-- AI消息 左侧 -->
        <div v-if="!isUser(message)" 
          class="message-wrapper flex max-w-[80%]"
          :class="{ 'opacity-70': isStreamingResponse && index !== messages.length - 1 }"
        >
          <div class="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-2">
            <span v-if="isAssistant(message)" class="material-icons text-sm text-indigo-600">AI</span>
            <span v-else class="material-icons text-sm text-gray-500">info</span>
          </div>
          <div class="relative">
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
            </div>
            
            <!-- AI音频消息 -->
            <div v-if="message.hasAudio" class="mt-2 px-3">
              <audio 
                controls 
                muted
                :class="['w-full ai-audio', 'hide-mute-button']" 
                :id="'audio-' + (message.message_id || Date.now())"
                :key="'audio-key-' + (message.audioBlobUrl || message.audioUrl)"
                @error="handleAudioError($event, message)"
                @play="handleAIAudioPlay($event, message)"
                @pause="handleAIAudioPause($event)"
                @ended="handleAIAudioEnded($event)"
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
            </div>
            
            <!-- 用户音频消息 -->
            <div v-if="message.hasAudio" class="mt-2 px-3 w-full">
              <audio 
                controls 
                class="w-full user-audio"
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
            </div>
          </div>
        </div>
      </div>
      
      <!-- 打字指示器 -->
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
const emit = defineEmits(['play-audio']);

// 监听消息变化和流式响应
watch(() => props.messages.length, async () => await nextTick(), { immediate: true });
watch(() => props.isStreaming, async (newVal) => { if (newVal) await nextTick(); });
watch(() => props.messages, async () => { 
  if (props.isStreaming) await nextTick();
  
  // 为所有音频消息设置正确的类型
  props.messages.forEach(msg => {
    if ((msg.audioUrl || msg.audioBlobUrl) && !msg.audioType) {
      if (msg.audioBlobUrl) {
        msg.audioType = 'audio/wav';
      } else if (msg.audioUrl) {
        msg.audioType = getAudioType(msg.audioUrl);
      }
    }
  });
}, { deep: true });

// 根据URL获取适当的音频MIME类型
const getAudioType = (url) => {
  if (!url) return 'audio/mpeg';
  if (url.endsWith('.mp3')) return 'audio/mpeg';
  if (url.endsWith('.wav')) return 'audio/wav';
  if (url.endsWith('.ogg')) return 'audio/ogg';
  return 'audio/mpeg';
};

// 处理音频加载错误
const handleAudioError = (event, message) => {
  console.error('音频加载失败:', event, message);
  message.audioError = '音频加载失败，请刷新重试';
};

// 将消息格式化为一致的结构
const formattedMessages = computed(() => {
  return props.messages.map(msg => {
    // 已是标准格式但可能缺少某些字段的消息
    if (msg.sender) {
      const hasAudio = !!msg.audioUrl || !!msg.hasAudio || !!msg.audioBlobUrl;
      
      // 确定音频类型
      let audioType = msg.audioType;
      if (!audioType) {
        if (msg.audioBlobUrl) {
          audioType = 'audio/wav';
        } else if (msg.audioUrl) {
          audioType = getAudioType(msg.audioUrl);
        }
      }
      
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
        // 音频属性
        hasAudio: hasAudio,
        audioUrl: msg.audioUrl || '',
        audioBlobUrl: msg.audioBlobUrl || '',
        audioType: audioType,
        isAudioInput: !!msg.isAudioInput
      };
    }
    
    // 处理前端临时创建的消息格式
    return {
      message_id: msg.id || Date.now().toString(),
      sender: {
        role: msg.role || 'user',
        nickname: msg.nickname
      },
      components: [{ type: 'text', content: msg.content || msg.streamContent || '' }],
      message_str: msg.content || msg.streamContent || '',
      timestamp: msg.timestamp || Date.now(),
      isError: msg.isError,
      streamContent: msg.streamContent
    };
  });
});

// 获取消息内容
const getMessageContent = (message) => {
  if (message.streamContent !== undefined && message.streamContent !== null) {
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

// 消息类型判断
const isUser = (message) => message.sender?.role === 'user';
const isAssistant = (message) => message.sender?.role === 'assistant';
const isSystem = (message) => message.sender?.role === 'system';
const isError = (message) => message.isError === true;

// 获取发送者名称
const getSenderName = (message) => {
  if (isUser(message)) return message.sender.nickname || '你';
  if (isAssistant(message)) return message.sender.nickname || 'AI助手';
  return '系统消息';
};

// 音频事件处理
const handleAIAudioPlay = (event, message) => {
  if (!event.target.id) {
    event.target.id = 'audio-' + (message.message_id || Date.now());
  }
  
  window.dispatchEvent(new CustomEvent('ai-audio-play', { 
    detail: { 
      audioUrl: message.audioBlobUrl || message.audioUrl,
      message,
      sourceElementId: event.target.id
    } 
  }));
};

const handleAIAudioPause = () => {
  window.dispatchEvent(new Event('ai-audio-pause'));
};

const handleAIAudioEnded = () => {
  window.dispatchEvent(new Event('ai-audio-ended'));
};
</script>

<style scoped>
.message-container {
  display: flex;
  margin-bottom: 1rem;
  width: 100%;
}

/* 隐藏静音按钮 */
.hide-mute-button::-webkit-media-controls-mute-button,
.hide-mute-button::-webkit-media-controls-volume-slider,
.hide-mute-button::-webkit-media-controls-volume-control-container {
  display: none !important;
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

/* 音频样式 */
.ai-audio {
  border-left: 2px solid #4f46e5;
}

.user-audio {
  border-left: 2px solid #93c5fd;
}
</style>
