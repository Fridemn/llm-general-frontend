<template>
  <div class="flex h-screen bg-gray-100">
    <!-- 侧边栏 -->
    <SideNav class="w-64 bg-white shadow-md" />

    <div class="flex-1 flex flex-col">
      <!-- 顶部栏 -->
      <TopBar 
        :selectedModel="selectedModel"
        @model-change="handleModelChange"
      />

      <div class="flex-1 flex">
        <!-- 聊天历史列表 -->
        <ChatHistory 
          class="w-64 bg-white shadow-md"
          :conversations="conversations"
          :activeChat="activeChat"
          @select-chat="handleSelectChat"
          @new-chat="handleNewChat"
        />

        <!-- 主聊天区域 -->
        <div class="flex-1 flex flex-col">
          <!-- 聊天消息列表 -->
          <ChatMessages 
            class="flex-1 overflow-y-auto p-4"
            :messages="currentMessages"
          />

          <!-- 输入区域 -->
          <ChatInput 
            class="p-4 bg-white shadow-t"
            @send-message="handleSendMessage"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import SideNav from './components/SideNav.vue'
import TopBar from './components/TopBar.vue'
import ChatHistory from './components/ChatHistory.vue'
import ChatMessages from './components/ChatMessages.vue'
import ChatInput from './components/ChatInput.vue'

const selectedModel = ref('gpt-3.5')
const activeChat = ref(null)
const conversations = ref([])
const currentMessages = ref([])

const handleModelChange = (model) => {
  selectedModel.value = model
}

const handleSelectChat = (chatId) => {
  activeChat.value = chatId
  // 加载对应的聊天记录
}

const handleNewChat = () => {
  const newChat = {
    id: Date.now(),
    title: '新对话',
    messages: []
  }
  conversations.value.unshift(newChat)
  activeChat.value = newChat.id
  currentMessages.value = []
}

const handleSendMessage = async (content) => {
  // 添加用户消息
  currentMessages.value.push({
    role: 'user',
    content,
    timestamp: new Date()
  })

  try {
    // 这里添加调用AI接口的逻辑
    const aiResponse = await mockAiResponse(content)
    currentMessages.value.push({
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date()
    })
  } catch (error) {
    console.error('发送消息失败:', error)
  }
}

// 模拟AI响应
const mockAiResponse = (content) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`这是对"${content}"的回复...`)
    }, 1000)
  })
}
</script>
