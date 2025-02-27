<template>
  <div class="flex h-screen bg-gray-50">
    <!-- 侧边栏 -->
    <SideNav class="w-64 bg-white shadow-sm" />

    <div class="flex-1 flex flex-col">
      <!-- 顶部栏 -->
      <TopBar 
        :selectedModel="selectedModel"
        @model-change="handleModelChange"
        class="border-b"
      />

      <div class="flex-1 flex overflow-hidden">
        <!-- 聊天历史列表 -->
        <ChatHistory 
          class="w-64 bg-white border-r"
          :conversations="conversations"
          :activeChat="activeChat"
          :loading="loadingHistories"
          @select-chat="handleSelectChat"
          @new-chat="handleNewChat"
          @delete-chat="handleDeleteChat"
        />

        <!-- 主聊天区域 -->
        <div class="flex-1 flex flex-col bg-white">
          <!-- 聊天消息列表 -->
          <div class="flex-1 overflow-y-auto conversation-container">
            <ChatMessages 
              :messages="currentMessages"
              :loading="loadingMessages"
              :isStreaming="isStreamingResponse"
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
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useUserStore } from '@/store/user'
import { getUserHistories, getHistory, chat, chatStream, deleteHistory } from '@/api/modules/llm'
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
        // 确保每条消息有正确的格式
        return {
          ...msg,
          // 如果message_str为空但components不为空，从components中提取内容
          message_str: msg.message_str || (msg.components && msg.components.length > 0 
            ? msg.components.map(comp => comp.content).join('\n') 
            : ''),
          // 保存原始components以备用
          components: msg.components || []
        }
      })
    } else if (Array.isArray(response)) {
      // 如果直接返回了消息数组
      currentMessages.value = response.map(msg => {
        return {
          ...msg,
          message_str: msg.message_str || (msg.components && msg.components.length > 0 
            ? msg.components.map(comp => comp.content).join('\n') 
            : ''),
          components: msg.components || []
        }
      })
    } else {
      console.warn('获取聊天记录返回了意外的数据格式:', response)
      currentMessages.value = []
    }
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

// 使用流式请求发送消息
const handleSendMessage = async (content) => {
  // 终止正在进行的流请求
  abortStreamIfActive()
  
  // 记录是否是新会话
  const isNewChat = !activeChat.value
  
  // 添加用户消息 - 使用与API一致的格式
  const userMessage = {
    sender: { role: 'user' },
    components: [{ type: 'text', content }],
    message_str: content,
    timestamp: Date.now()
  }
  currentMessages.value.push(userMessage)

  // 添加一个空的AI回复占位符，用于流式填充
  const aiMessage = {
    sender: { 
      role: 'assistant',
      nickname: selectedModel.value
    },
    streamContent: '',
    timestamp: Date.now(),
    isStreaming: true
  }
  currentMessages.value.push(aiMessage)
  isStreamingResponse.value = true

  try {
    // 创建一个新的AbortController
    streamController.value = new AbortController()
    
    // 构建API请求URL和参数 - 确保不会有重复的斜杠
    const baseApi = import.meta.env.VITE_BASE_API || 'http://127.0.0.1:8000'
    const cleanBaseApi = baseApi.endsWith('/') ? baseApi.slice(0, -1) : baseApi
    const url = `${cleanBaseApi}/llm/chat/stream?token=${userStore.token}`
    
    console.log('流式请求URL:', url)
    
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream'
    }
    const body = JSON.stringify({
      model: selectedModel.value,
      message: content,
      history_id: activeChat.value || "",
      role: 'user'
    })
    
    console.log('流式请求参数:', body)
    
    // 发起流式请求
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: body,
      signal: streamController.value.signal
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`请求失败: ${response.status} - ${errorText}`)
      console.error('响应头:', Object.fromEntries([...response.headers]))
      throw new Error(`请求失败: ${response.status} - ${errorText}`)
    }
    
    // 处理SSE响应
    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''
    
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
        
        // 处理除最后一行外的所有行（最后一行可能不完整）
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
              }
            } catch (e) {
              console.error("解析数据失败:", e, data)
            }
          }
        }
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        throw error
      }
    }
    
    // 流式请求完成后，如果是新会话，则获取最新的会话列表
    if (isNewChat) {
      console.log('新会话消息已发送，获取最新会话列表')
      // 延迟执行，确保后端处理完成
      setTimeout(() => {
        fetchChatHistories(true)
      }, 1000)
    }
    
  } catch (error) {
    console.error('发送消息失败:', error)
    console.error('错误类型:', error.name)
    console.error('错误消息:', error.message)
    
    // 如果是用户中断，不显示错误
    if (error.name !== 'AbortError') {
      // 将流式消息标记为错误
      aiMessage.isError = true
      aiMessage.streamContent = '消息发送失败，请重试: ' + error.message
      currentMessages.value = [...currentMessages.value]
    }
  } finally {
    isStreamingResponse.value = false
    streamController.value = null
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
