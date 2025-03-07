<template>
  <div class="border-t bg-white">
    <div class="flex items-center p-3">
      <textarea
        v-model="message"
        placeholder="输入消息..."
        class="flex-1 resize-none border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        rows="2"
        @keydown.enter.exact.prevent="sendMessage"
        :disabled="disabled || isRecording"
      ></textarea>
      <div class="flex ml-2">
        <!-- 录音按钮 (STT功能) -->
        <button
          @click="toggleRecording"
          class="mr-2 p-2 rounded-lg flex items-center justify-center"
          :class="isRecording ? 'bg-red-500 text-white animate-pulse' : (isSttEnabled ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600')"
          title="语音输入 (STT)"
          :disabled="disabled"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clip-rule="evenodd" />
          </svg>
        </button>
        
        <!-- TTS开关按钮 -->
        <button
          @click="toggleTts"
          class="mr-2 p-2 rounded-lg flex items-center justify-center"
          :class="isTtsEnabled ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'"
          title="文本转语音 (TTS)"
          :disabled="disabled || isRecording"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
        
        <!-- 发送按钮 -->
        <button
          @click="sendMessage"
          class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="(!message.trim() && !hasRecordedAudio) || disabled"
        >
          <span class="material-icons">send</span>
        </button>
      </div>
    </div>
    
    <!-- 录音状态提示和控制 -->
    <div v-if="isRecording || hasRecordedAudio" class="px-3 pb-3 flex items-center">
      <div v-if="isRecording" class="text-red-500 flex items-center">
        <span class="inline-block w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse"></span>
        正在录音... {{ recordingTime }}秒
      </div>
      <div v-else-if="hasRecordedAudio" class="text-green-500 flex items-center">
        <span class="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
        录音完成 ({{ recordingTime }}秒)
        <button @click="playRecording" class="ml-2 text-blue-500 hover:text-blue-700">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
          </svg>
        </button>
        <button @click="clearRecording" class="ml-2 text-red-500 hover:text-red-700">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
    
    <!-- 语音功能状态提示 -->
    <div v-if="isTtsEnabled || isSttEnabled" class="px-3 pb-2 text-sm text-gray-500 flex items-center">
      <span v-if="isTtsEnabled && isSttEnabled">
        <span class="inline-block w-2 h-2 bg-purple-500 rounded-full mr-1"></span>
        TTS + STT 模式已启用
      </span>
      <span v-else-if="isTtsEnabled">
        <span class="inline-block w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
        TTS 模式已启用
      </span>
      <span v-else-if="isSttEnabled">
        <span class="inline-block w-2 h-2 bg-green-500 rounded-full mr-1"></span>
        STT 模式已启用
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['send-message'])

const message = ref('')
const isTtsEnabled = ref(false)
const isSttEnabled = ref(false)
const isRecording = ref(false)
const hasRecordedAudio = ref(false)
const recordingTime = ref(0)
const timerInterval = ref(null)
const mediaRecorder = ref(null)
const audioChunks = ref([])
const audioBlob = ref(null)
const audioUrl = ref(null)
const audioElement = ref(null)

// 切换TTS功能
const toggleTts = () => {
  // 录音中不允许操作
  if (isRecording.value) return
  
  // 切换TTS状态
  isTtsEnabled.value = !isTtsEnabled.value
  console.log('TTS功能已' + (isTtsEnabled.value ? '启用' : '禁用'))
}

// 切换录音状态
const toggleRecording = async () => {
  if (isRecording.value) {
    stopRecording()
  } else {
    await startRecording()
  }
}

// 开始录音
const startRecording = async () => {
  try {
    // 清除之前的录音
    clearRecording()
    
    // 启用STT模式
    isSttEnabled.value = true
    
    // 请求用户授权使用麦克风
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    
    // 创建媒体录制器
    mediaRecorder.value = new MediaRecorder(stream)
    audioChunks.value = []
    
    // 设置录音数据处理
    mediaRecorder.value.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.value.push(event.data)
      }
    }
    
    // 录音结束后的处理
    mediaRecorder.value.onstop = () => {
      // 创建音频Blob
      audioBlob.value = new Blob(audioChunks.value, { type: 'audio/wav' })
      
      // 创建音频URL以供播放
      if (audioUrl.value) {
        URL.revokeObjectURL(audioUrl.value)
      }
      audioUrl.value = URL.createObjectURL(audioBlob.value)
      
      // 创建音频元素
      if (!audioElement.value) {
        audioElement.value = new Audio(audioUrl.value)
      } else {
        audioElement.value.src = audioUrl.value
      }
      
      // 更新状态
      isRecording.value = false
      hasRecordedAudio.value = true
      
      // 停止定时器
      clearInterval(timerInterval.value)
      timerInterval.value = null
      
      // 关闭麦克风流
      stream.getTracks().forEach(track => track.stop())
    }
    
    // 开始录音
    mediaRecorder.value.start()
    isRecording.value = true
    
    // 开始计时
    recordingTime.value = 0
    timerInterval.value = setInterval(() => {
      recordingTime.value += 1
    }, 1000)
    
  } catch (err) {
    console.error('录音启动失败:', err)
    alert('无法访问麦克风，请检查权限设置。')
  }
}

// 停止录音
const stopRecording = () => {
  if (mediaRecorder.value && isRecording.value) {
    mediaRecorder.value.stop()
  }
}

// 播放录音
const playRecording = () => {
  if (audioElement.value && audioUrl.value) {
    audioElement.value.play()
  }
}

// 清除录音
const clearRecording = () => {
  if (isRecording.value) {
    stopRecording()
  }
  
  if (audioUrl.value) {
    URL.revokeObjectURL(audioUrl.value)
    audioUrl.value = null
  }
  
  audioBlob.value = null
  hasRecordedAudio.value = false
  recordingTime.value = 0
  audioChunks.value = []
  
  if (audioElement.value) {
    audioElement.value.src = ''
  }
  
  // 如果没有正在录音，则也关闭STT模式
  if (!isRecording.value) {
    isSttEnabled.value = false
  }
}

// 发送消息
const sendMessage = () => {
  if (props.disabled) return
  
  // 获取当前的TTS和STT状态
  const useTts = isTtsEnabled.value
  const useStt = isSttEnabled.value
  
  if (hasRecordedAudio.value && audioBlob.value) {
    // 发送录音 - 强制使用STT
    emit('send-message', '', useTts, audioBlob.value, true)
    clearRecording()
  } else if (message.value.trim()) {
    // 发送文本消息
    console.log('发送消息:', message.value.trim(), '使用TTS:', useTts, '使用STT:', useStt)
    emit('send-message', message.value.trim(), useTts, null, useStt)
    message.value = ''
  }
}

// 组件卸载时清理资源
onUnmounted(() => {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
  }
  
  if (audioUrl.value) {
    URL.revokeObjectURL(audioUrl.value)
  }
  
  if (isRecording.value && mediaRecorder.value) {
    mediaRecorder.value.stop()
  }
})
</script>
