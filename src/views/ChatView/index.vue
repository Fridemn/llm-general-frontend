<template>
  <div class="flex h-screen bg-gray-50">
    <!-- 侧边栏 -->
    <div class="relative" :class="sideNavCollapsed ? 'w-14' : 'w-64'">
      <SideNav 
        class="bg-white shadow-sm h-full transition-all duration-300"
        :collapsed="sideNavCollapsed"
      />
      <button 
        @click="toggleSideNav" 
        class="absolute top-4 right-0 transform translate-x-1/2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100 z-10"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" :class="{'rotate-180': sideNavCollapsed}" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>

    <div class="flex-1 flex flex-col">
      <!-- 顶部栏 -->
      <TopBar 
        :selectedModel="selectedModel"
        @model-change="handleModelChange"
        class="border-b"
      />

      <div class="flex-1 flex overflow-hidden">
        <!-- 聊天历史列表 -->
        <div class="relative transition-all duration-300" :class="chatHistoryCollapsed ? 'w-14' : 'w-64'">
          <ChatHistory 
            class="bg-white border-r h-full"
            :conversations="conversations"
            :activeChat="activeChat"
            :loading="loadingHistories"
            :collapsed="chatHistoryCollapsed"
            @select-chat="handleSelectChat"
            @new-chat="handleNewChat"
            @delete-chat="handleDeleteChat"
          />
          <button 
            @click="toggleChatHistory" 
            class="absolute top-4 right-0 transform translate-x-1/2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100 z-10"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" :class="{'rotate-180': !chatHistoryCollapsed}" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>

        <!-- 主聊天区域 -->
        <div class="flex-1 flex flex-col bg-white">
          <!-- 聊天消息列表 -->
          <div class="flex-1 overflow-y-auto conversation-container">
            <ChatMessages 
              :messages="currentMessages"
              :loading="loadingMessages"
              :isStreaming="isStreamingResponse"
              @play-audio="handleAudioPlay"
            />
          </div>

          <!-- 输入区域 -->
          <ChatInput 
            class="border-t"
            @send-message="handleSendMessage"
            :disabled="isStreamingResponse"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, inject } from 'vue'
import { useUserStore } from '@/store/user'
import { 
  getUserHistories, 
  getHistory, 
  deleteHistory, 
  summarizeHistoryTitle 
} from '@/api/modules/llm'
import SideNav from './components/SideNav.vue'
import TopBar from './components/TopBar.vue'
import ChatHistory from './components/ChatHistory.vue'
import ChatMessages from './components/ChatMessages.vue'
import ChatInput from './components/ChatInput.vue'

const userStore = useUserStore()
const selectedModel = ref('gpt-3.5-turbo')
const activeChat = ref(null)
const conversations = ref([])
const currentMessages = ref([])
const loadingHistories = ref(false)
const loadingMessages = ref(false)
const isStreamingResponse = ref(false)
const streamController = ref(null)
// 记录上次总结标题时的消息数量
const lastSummarizedCount = ref(0)
// 记录当前会话的消息数量
const currentMessageCount = ref(0)

// 侧边栏折叠状态
const sideNavCollapsed = ref(false)
const chatHistoryCollapsed = ref(false)

// 添加音频缓存
const audioCache = ref(new Map()) // 用于缓存已下载的音频URL

// 获取Live2D控制接口
const live2dControls = inject('live2dControls')

// 切换侧边栏折叠状态
const toggleSideNav = () => {
  sideNavCollapsed.value = !sideNavCollapsed.value
}

const toggleChatHistory = () => {
  chatHistoryCollapsed.value = !chatHistoryCollapsed.value
}

// 终止正在进行的流式请求
const abortStreamIfActive = () => {
  if (streamController.value) {
    streamController.value.abort()
    streamController.value = null
    isStreamingResponse.value = false
  }
}

onMounted(() => {
  fetchChatHistories()
})

onBeforeUnmount(() => {
  abortStreamIfActive()
  
  // 清理音频缓存
  audioCache.value.forEach((blobUrl) => {
    URL.revokeObjectURL(blobUrl)
  })
  audioCache.value.clear()
})

// 获取聊天历史
const fetchChatHistories = async (isAfterNewMessage = false) => {
  if (!userStore.token) return

  loadingHistories.value = true
  try {
    const { request, source } = getUserHistories(userStore.token)
    const response = await request
    
    console.log('获取历史会话列表:', response)
    
    // 处理响应数据
    let histories = [];
    if (response) {
      if (Array.isArray(response)) {
        histories = response;
      } else if (response.histories) {
        histories = response.histories;
      } else {
        histories = Array.isArray(response) ? response : [response];
      }
    }
    
    // 保存会话列表
    conversations.value = histories;
    
    // 如果是新消息发送后的请求，且当前无activeChat，则选择最新的会话
    if (isAfterNewMessage && !activeChat.value && histories.length > 0) {
      // 按更新时间排序，选择最新的
      const sortedHistories = [...histories].sort((a, b) => {
        const timeA = new Date(a.update_time || a.create_time || 0);
        const timeB = new Date(b.update_time || b.create_time || 0);
        return timeB - timeA; // 降序，最新的在前
      });
      
      if (sortedHistories.length > 0) {
        const newHistoryId = sortedHistories[0].history_id || sortedHistories[0].id;
        console.log('新消息后，选择最新会话:', newHistoryId);
        activeChat.value = newHistoryId;
      }
    }
    // 普通加载，如果无activeChat则选择第一个会话
    else if (!activeChat.value && histories.length > 0) {
      handleSelectChat(histories[0].history_id || histories[0].id);
    }
  } catch (error) {
    console.error('获取聊天历史失败:', error);
    conversations.value = [];
  } finally {
    loadingHistories.value = false;
  }
};

const handleModelChange = (model) => {
  selectedModel.value = model
}

const handleSelectChat = async (chatId) => {
  activeChat.value = chatId
  // 加载对应的聊天记录
  loadingMessages.value = true
  currentMessages.value = [] // 清空当前消息，避免闪烁
  
  try {
    const { request, source } = getHistory(chatId, userStore.token)
    const response = await request
    
    console.log('获取聊天记录响应:', response)
    
    // 检查API返回的消息格式
    if (response && response.messages) {
      // 处理消息内容，确保格式一致
      currentMessages.value = response.messages.map(msg => {
        // 提前处理音频组件
        const processedMsg = processMessageComponents(msg)
        return processedMsg
      })
    } else if (Array.isArray(response)) {
      // 如果直接返回了消息数组
      currentMessages.value = response.map(msg => {
        // 提前处理音频组件
        return processMessageComponents(msg)
      })
    } else {
      console.warn('获取聊天记录返回了意外的数据格式:', response)
      currentMessages.value = []
    }
    
    // 重置总结计数器
    lastSummarizedCount.value = currentMessages.value.length > 6 ? 6 : 0
    currentMessageCount.value = currentMessages.value.length
    
  } catch (error) {
    console.error('加载聊天记录失败:', error)
    currentMessages.value = [{
      sender: { role: 'system' },
      components: [{ type: 'text', content: '加载聊天记录失败，请重试' }],
      message_str: '加载聊天记录失败，请重试',
      isError: true
    }]
  } finally {
    loadingMessages.value = false
  }
}

/**
 * 处理消息组件，解析音频组件并添加到消息对象
 */
const processMessageComponents = (msg) => {
  // 基本消息格式
  const processedMsg = {
    ...msg,
    components: msg.components || [],
    hasAudio: false,
    audioUrl: '',
  }
  
  // 如果没有组件，尝试从message_str创建文本组件
  if (!processedMsg.components.length && processedMsg.message_str) {
    processedMsg.components = [{ type: 'text', content: processedMsg.message_str }]
  }
  
  // 确保message_str存在
  if (!processedMsg.message_str) {
    // 从组件提取文本内容构建message_str
    const textComponents = processedMsg.components.filter(c => c.type === 'text')
    if (textComponents.length > 0) {
      processedMsg.message_str = textComponents.map(c => c.content).join('\n')
    }
  }
  
  // 处理音频组件
  const audioComponent = processedMsg.components.find(c => c.type === 'audio')
  if (audioComponent && audioComponent.content) {
    const baseApi = import.meta.env.VITE_BASE_API
    const cleanBaseApi = baseApi.endsWith('/') ? baseApi.slice(0, -1) : baseApi
    
    // 设置音频URL和标记
    processedMsg.hasAudio = true
    processedMsg.audioUrl = `${cleanBaseApi}${audioComponent.content}`
    
    // 打印调试信息，看看音频路径是否正确
    console.log(`处理音频组件: ${processedMsg.sender?.role}, URL: ${processedMsg.audioUrl}`)
    
    // 如果组件有额外信息，保存下来
    if (audioComponent.extra) {
      processedMsg.audioExtra = audioComponent.extra
      
      // 检查音频extra字段中的transcript
      if (audioComponent.extra.transcript && !processedMsg.message_str) {
        processedMsg.message_str = audioComponent.extra.transcript
      }
      
      // 用于调试
      console.log('音频组件额外信息:', audioComponent.extra)
    }
    
    // 检查音频缓存
    if (audioCache.value.has(processedMsg.audioUrl)) {
      processedMsg.audioBlobUrl = audioCache.value.get(processedMsg.audioUrl)
      console.log('从缓存加载音频:', processedMsg.audioUrl)
    } else {
      // 异步加载音频
      loadAudioAndCache(processedMsg)
    }
  }
  
  return processedMsg
}

/**
 * 加载音频并缓存
 */
const loadAudioAndCache = async (message) => {
  if (!message.audioUrl) return
  
  try {
    console.log('开始加载音频:', message.audioUrl)
    
    // 打印更多调试信息
    console.log('音频所属消息:', {
      role: message.sender?.role,
      components: message.components,
      hasAudio: message.hasAudio
    })
    
    const response = await fetch(message.audioUrl)
    
    if (!response.ok) {
      console.error('音频加载失败:', response.status, response.statusText)
      return
    }
    
    // 检查内容类型
    const contentType = response.headers.get('content-type')
    console.log('音频内容类型:', contentType)
    
    const blob = await response.blob()
    
    // 根据实际内容类型创建正确的blob
    const audioType = contentType || 
                      (message.audioUrl.endsWith('.mp3') ? 'audio/mpeg' : 
                      (message.audioUrl.endsWith('.wav') ? 'audio/wav' : 'audio/mpeg'))
    
    const typedBlob = new Blob([blob], { type: audioType })
    const blobUrl = URL.createObjectURL(typedBlob)
    
    // 存入缓存
    audioCache.value.set(message.audioUrl, blobUrl)
    
    // 更新消息对象
    message.audioBlobUrl = blobUrl
    message.audioType = audioType
    
    // 强制视图更新
    currentMessages.value = [...currentMessages.value]
    
    console.log('音频加载并缓存成功:', message.audioUrl, '-> Blob URL:', blobUrl)
  } catch (error) {
    console.error('加载音频文件失败:', error, message.audioUrl)
  }
}

// 播放音频并同步Live2D口型变化 - 修复函数
const playAudioWithLive2D = (audioUrl) => {
  console.log('播放音频并同步Live2D口型:', audioUrl);
  
  // 如果Live2D控制接口可用且Live2D模型可见
  if (live2dControls && live2dControls.isVisible.value) {
    try {
      // 通知Live2D开始说话（传递音频URL）
      live2dControls.speak(audioUrl);
      
      // 无需创建额外的Audio元素，Live2dView组件内部会处理播放
      console.log('已通知Live2D组件播放音频');
    } catch (error) {
      console.error('通知Live2D组件播放音频失败:', error);
      // 如果Live2D组件处理失败，回退到普通播放
      const audio = new Audio(audioUrl);
      audio.play().catch(e => console.error('直接播放音频失败:', e));
    }
  } else {
    // 如果Live2D不可见，直接播放音频
    console.log('Live2D不可见，直接播放音频');
    const audio = new Audio(audioUrl);
    audio.play().catch(error => console.error('播放音频失败:', error));
  }
}

// 修改ChatMessages组件中的音频播放处理
const handleAudioPlay = (message) => {
  console.log('处理音频播放:', message);
  
  if (message && message.audioBlobUrl) {
    console.log('使用audioBlobUrl播放:', message.audioBlobUrl);
    playAudioWithLive2D(message.audioBlobUrl);
  } else if (message && message.audioUrl) {
    console.log('尝试使用audioUrl播放:', message.audioUrl);
    // 先检查是否需要下载音频
    if (!audioCache.value.has(message.audioUrl)) {
      console.log('音频未缓存，先加载再播放');
      loadAudioAndCache(message).then(() => {
        if (message.audioBlobUrl) {
          console.log('音频已加载，现在播放:', message.audioBlobUrl);
          playAudioWithLive2D(message.audioBlobUrl);
        } else {
          console.warn('音频加载后但未找到audioBlobUrl');
        }
      }).catch(error => {
        console.error('加载音频时出错:', error);
      });
    } else {
      console.log('使用缓存的音频播放');
      playAudioWithLive2D(audioCache.value.get(message.audioUrl));
    }
  } else {
    console.warn('消息没有可播放的音频');
  }
}

// 处理新聊天
const handleNewChat = () => {
  activeChat.value = null
  currentMessages.value = []
  // 服务端会在第一条消息发送后创建新对话
}

// 处理删除聊天历史
const handleDeleteChat = async (historyId) => {
  // 用户确认
  if (!confirm('确定要删除此对话吗？此操作不可撤销。')) {
    return
  }
  
  try {
    const { request, source } = deleteHistory(historyId, userStore.token)
    await request
    
    // 从会话列表中移除
    conversations.value = conversations.value.filter(chat => 
      (chat.history_id || chat.id) !== historyId
    )
    
    // 如果删除的是当前选中的会话，重置当前会话
    if (activeChat.value === historyId) {
      // 如果还有其他会话，选择第一个
      if (conversations.value.length > 0) {
        handleSelectChat(conversations.value[0].history_id || conversations.value[0].id)
      } else {
        // 否则创建新会话
        handleNewChat()
      }
    }
  } catch (error) {
    console.error('删除聊天历史失败:', error)
    alert('删除失败，请重试')
  }
}

// 处理发送消息，支持文本和语音输入
const handleSendMessage = async (content, useTts = false, audioBlob = null, useStt = false) => {
  // 终止正在进行的流请求
  abortStreamIfActive()
  
  // 记录是否是新会话
  const isNewChat = !activeChat.value
  
  // 添加用户消息 - 使用与API一致的格式
  const userMessage = {
    sender: { role: 'user' },
    components: [{ 
      type: audioBlob ? 'audio' : 'text', 
      content: audioBlob ? '语音输入...' : content 
    }],
    message_str: audioBlob ? '语音输入...' : content,
    timestamp: Date.now(),
    isAudioInput: !!audioBlob
  }
  
  // 如果是音频消息，生成本地预览URL
  if (audioBlob) {
    userMessage.audioBlobUrl = URL.createObjectURL(audioBlob)
    userMessage.hasAudio = true
    userMessage.audioType = 'audio/wav' // 明确指定类型为wav
    
    // 将Blob URL添加到缓存，以便后续使用
    if (!audioCache.value.has(userMessage.audioBlobUrl)) {
      audioCache.value.set(userMessage.audioBlobUrl, userMessage.audioBlobUrl)
    }
    
    console.log('已创建用户音频预览URL:', userMessage.audioBlobUrl)
  }
  
  currentMessages.value.push(userMessage)

  // 添加一个AI回复占位符
  const aiMessage = {
    sender: { 
      role: 'assistant',
      nickname: selectedModel.value
    },
    timestamp: Date.now()
  }
  
  // 根据TTS和STT的组合决定是否使用流式输出
  const useStream = determineStreamMode(useTts, useStt)
  aiMessage.isStreaming = useStream
  
  if (useStream) {
    aiMessage.streamContent = ''
  }
  
  currentMessages.value.push(aiMessage)
  isStreamingResponse.value = true

  try {
    // 构建API请求URL和参数
    const baseApi = import.meta.env.VITE_BASE_API
    const cleanBaseApi = baseApi.endsWith('/') ? baseApi.slice(0, -1) : baseApi
    const url = `${cleanBaseApi}/llm/chat?token=${userStore.token}`
    
    // 使用FormData构建请求
    const formData = new FormData()
    formData.append('model', selectedModel.value)
    
    // 根据输入类型设置参数
    if (audioBlob) {
      // 语音输入模式
      formData.append('message', '')  // 语音模式下消息为空
      formData.append('stream', useStream ? 'true' : 'false')
      formData.append('stt', 'true')   // 启用语音转文字
      formData.append('tts', useTts ? 'true' : 'false')  // 可选择是否启用TTS
      
      // 添加音频文件
      formData.append('audio_file', audioBlob, 'recording.wav')
      
      console.log('发送录音，参数:', {
        model: selectedModel.value,
        history_id: activeChat.value || "",
        role: 'user',
        stream: useStream,
        stt: true,
        tts: useTts,
        audio_file: '(二进制音频数据)'
      })
    } else {
      // 文本输入模式
      formData.append('message', content)
      formData.append('stream', useStream ? 'true' : 'false')
      formData.append('tts', useTts ? 'true' : 'false')
      formData.append('stt', useStt ? 'true' : 'false')
      
      console.log('发送文本消息，参数:', {
        model: selectedModel.value,
        message: content,
        history_id: activeChat.value || "",
        role: 'user',
        stream: useStream,
        tts: useTts,
        stt: useStt
      })
    }
    
    // 公共参数
    formData.append('history_id', activeChat.value || "")
    formData.append('role', 'user')
    
    // 创建请求控制器
    streamController.value = new AbortController()
    
    if (!useStream) {
      // 非流式请求，获取完整响应
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        signal: streamController.value.signal
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('请求失败:', response.status, errorText)
        throw new Error(`请求失败: ${response.status} - ${errorText}`)
      }
      
      // 解析完整响应
      const result = await response.json()
      console.log('完整响应数据:', result)

      // 如果是STT+TTS模式，需要确保用户的音频消息保持可见和可播放
      if (useStt && audioBlob && result.response_message) {
        // 找到用户消息的索引
        const userMsgIndex = currentMessages.value.length - 2;
        if (userMsgIndex >= 0 && currentMessages.value[userMsgIndex].isAudioInput) {
          // 如果有转录结果，更新用户消息的文本
          if (result.transcription) {
            currentMessages.value[userMsgIndex].message_str = result.transcription;
            console.log('更新了用户消息的转录文本:', result.transcription);
          }
          
          // 确保音频组件正确设置
          currentMessages.value[userMsgIndex].hasAudio = true;
          
          // 强制更新视图
          currentMessages.value = [...currentMessages.value];
        }
      }
      
      // 处理带音频的响应
      if (result && result.response_message) {
        const responseMsg = result.response_message
        console.log('处理响应消息:', responseMsg)
        
        // 更新AI消息
        aiMessage.message_str = responseMsg.message_str || ''
        aiMessage.components = responseMsg.components || []
        aiMessage.isStreaming = false
        
        // 处理音频组件
        const audioComponent = responseMsg.components?.find(c => c.type === 'audio')
        if (audioComponent && audioComponent.content) {
          // 添加音频URL，拼接baseApi
          const audioPath = audioComponent.content
          aiMessage.audioUrl = `${cleanBaseApi}${audioPath}`
          aiMessage.hasAudio = true
          console.log('音频URL已设置:', aiMessage.audioUrl)
          
          // 加载并缓存音频
          loadAudioAndCache(aiMessage)
        }
        
        // 如果还有audio_url字段，也处理一下
        if (result.audio_url) {
          aiMessage.audioUrl = `${cleanBaseApi}${result.audio_url}`
          aiMessage.hasAudio = true
          console.log('从根级audio_url设置音频URL:', aiMessage.audioUrl)
          
          // 加载并缓存音频
          loadAudioAndCache(aiMessage)
        }
        
        // 强制Vue更新视图
        currentMessages.value = [...currentMessages.value]
      } else if (result.error) {
        aiMessage.message_str = `错误: ${result.error}`
        aiMessage.isError = true
        currentMessages.value = [...currentMessages.value]
      } else if (result.audio_url) {
        // 直接从根级别获取音频URL
        aiMessage.audioUrl = `${cleanBaseApi}${result.audio_url}`
        aiMessage.hasAudio = true
        // 确保有文本内容
        if (!aiMessage.message_str && result.response_message) {
          aiMessage.message_str = result.response_message
        }
        console.log('从根级别设置音频URL:', aiMessage.audioUrl)
        // 强制Vue更新视图
        currentMessages.value = [...currentMessages.value]
      }
    } else {
      // 流式请求处理
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        signal: streamController.value.signal
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`请求失败: ${response.status} - ${errorText}`)
      }
      
      // 处理SSE响应
      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let buffer = ''
      let tokenInfo = null
      let messageId = null
      let historyId = null
      let transcription = null
      
      try {
        while (true) {
          const { done, value } = await reader.read()
          
          if (done) {
            console.log('流式请求完成')
            break
          }
          
          // 解码二进制数据
          const chunk = decoder.decode(value, { stream: true })
          
          // 将新块添加到缓冲区并按行分割
          buffer += chunk
          const lines = buffer.split('\n')
          
          // 处理除最后一行外的所有行
          buffer = lines.pop() || ''
          
          for (const line of lines) {
            if (!line.trim()) continue
            
            if (line.startsWith('data:')) {
              const data = line.substring(5).trim()
              
              if (data === '[DONE]') {
                continue
              }
              
              try {
                const parsed = JSON.parse(data)
                
                if (parsed.text) {
                  // 更新流式内容
                  aiMessage.streamContent = (aiMessage.streamContent || '') + parsed.text
                  
                  // 强制Vue更新视图
                  currentMessages.value = [...currentMessages.value]
                } else if (parsed.error) {
                  aiMessage.streamContent = `错误: ${parsed.error}`
                  aiMessage.isError = true
                  currentMessages.value = [...currentMessages.value]
                } else if (parsed.token_info) {
                  // 保存token统计信息
                  tokenInfo = {
                    input: parsed.token_info.input_tokens,
                    output: parsed.token_info.output_tokens
                  }
                  messageId = parsed.token_info.message_id
                  if (parsed.token_info.history_id) {
                    historyId = parsed.token_info.history_id
                  }
                } else if (parsed.transcription && audioBlob) {
                  // 处理转录结果 - 更新用户消息的内容
                  transcription = parsed.transcription
                  const userIndex = currentMessages.value.length - 2
                  if (userIndex >= 0 && currentMessages.value[userIndex].isAudioInput) {
                    currentMessages.value[userIndex].message_str = transcription
                    
                    // 确保音频组件正确设置
                    currentMessages.value[userIndex].hasAudio = true
                    
                    currentMessages.value = [...currentMessages.value]
                  }
                }
              } catch (e) {
                console.error("解析数据失败:", e, data)
              }
            }
          }
        }
        
        // 流式输出完成后，把结果保存到message_str中
        if (aiMessage.streamContent) {
          aiMessage.message_str = aiMessage.streamContent
          aiMessage.isStreaming = false
          currentMessages.value = [...currentMessages.value]
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          throw error
        }
      }
    }
    
    // 更新会话列表
    if (isNewChat) {
      console.log('新会话消息已发送，获取最新会话列表')
      setTimeout(() => {
        fetchChatHistories(true)
      }, 1000)
    } else {
      // 检查是否需要自动总结标题
      const newMsgCount = currentMessages.value.length
      if (newMsgCount <= 6 && newMsgCount % 2 === 0 && newMsgCount > lastSummarizedCount.value) {
        setTimeout(() => {
          sumTitleIfNeeded(activeChat.value)
        }, 1000)
      }
    }
    
  } catch (error) {
    console.error('发送消息失败:', error)
    
    // 如果是用户中断，不显示错误
    if (error.name !== 'AbortError') {
      aiMessage.isError = true
      aiMessage.message_str = '消息发送失败，请重试: ' + error.message
      currentMessages.value = [...currentMessages.value]
    }
  } finally {
    isStreamingResponse.value = false
    streamController.value = null
  }
}

/**
 * 根据TTS和STT状态确定是否使用流式输出
 * 规则：
 * 1. 当不使用TTS和STT时，stream为true
 * 2. 当使用TTS，不使用STT时，stream为false
 * 3. 当使用STT，不使用TTS时，stream为true
 * 4. 当TTS和STT都使用时，stream为false
 */
const determineStreamMode = (useTts, useStt) => {
  // 当需要TTS时，不使用流式输出
  if (useTts) {
    return false  // TTS需要非流式
  }
  
  // 其他情况下使用流式输出
  return true
}

// 监听消息数变化，触发标题总结
watch(() => currentMessages.value.length, (newCount, oldCount) => {
  // 当消息数量增加，且不在流式输出中，且有活跃会话时
  if (newCount > oldCount && !isStreamingResponse.value && activeChat.value) {
    currentMessageCount.value = newCount
    
    // 如果是偶数（一问一答完成）且不超过6条且大于上次总结的消息数
    if (newCount <= 6 && newCount % 2 === 0 && newCount > lastSummarizedCount.value) {
      // 延迟执行，确保消息已保存
      setTimeout(() => {
        sumTitleIfNeeded(activeChat.value)
      }, 1000)
    }
  }
})

/**
 * 自动总结标题
 * 规则：当消息数量为2、4、6时调用API总结标题
 */
const sumTitleIfNeeded = async (historyId) => {
  // 获取当前消息数量
  const msgCount = currentMessages.value.length
  
  // 只在消息数为2、4、6且大于上次总结时的数量时才总结
  if (!historyId || msgCount > 6 || msgCount % 2 !== 0 || msgCount <= lastSummarizedCount.value) {
    return false
  }
  
  console.log(`消息数量为${msgCount}条，开始总结标题`)
  
  try {
    // 调用总结API
    const { request } = summarizeHistoryTitle(historyId, userStore.token)
    const response = await request
    
    console.log('标题总结结果:', response)
    
    // 更新上次总结的消息数量
    lastSummarizedCount.value = msgCount
    
    // 如果API返回了新标题，更新本地会话列表
    if (response && response.title) {
      const chatIndex = conversations.value.findIndex(c => 
        (c.history_id || c.id) === historyId
      )
      
      if (chatIndex !== -1) {
        conversations.value[chatIndex].title = response.title
        // 强制Vue更新视图
        conversations.value = [...conversations.value]
        return true
      }
    }
    return false
  } catch (error) {
    console.error('自动总结标题失败:', error)
    return false
  }
}
</script>

<style>
.conversation-container::-webkit-scrollbar {
  width: 6px;
}

.conversation-container::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.conversation-container::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 3px;
}

.conversation-container::-webkit-scrollbar-thumb:hover {
  background-color: #94a3b8;
}
</style>
