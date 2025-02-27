<template>
  <div class="h-full flex flex-col border-r">
    <div class="p-4">
      <button
        @click="$emit('new-chat')"
        class="w-full py-2 px-4 flex items-center justify-center bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        <span class="material-icons mr-1 text-sm">add</span>
        新建对话
      </button>
    </div>

    <div class="flex-1 overflow-y-auto">
      <!-- 加载状态 -->
      <div v-if="loading" class="flex justify-center items-center p-4">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
      </div>
      
      <!-- 无会话状态 -->
      <div v-else-if="conversations.length === 0" class="flex flex-col items-center justify-center p-6 text-gray-500">
        <span class="material-icons text-3xl mb-2">chat_bubble_outline</span>
        <span>暂无对话历史</span>
        <p class="text-xs mt-2">点击"新建对话"开始聊天</p>
      </div>
      
      <!-- 会话列表 -->
      <div
        v-else
        v-for="chat in conversations"
        :key="chat.history_id || chat.id"
        class="p-3 hover:bg-gray-100 cursor-pointer transition-colors relative group"
        :class="{ 
          'bg-gray-100': (chat.history_id || chat.id) === activeChat,
          'border-l-4 border-blue-500': (chat.history_id || chat.id) === activeChat
        }"
      >
        <!-- 会话信息 -->
        <div @click="$emit('select-chat', chat.history_id || chat.id)" class="pr-6">
          <div class="text-sm font-medium truncate">{{ chat.title }}</div>
          <div class="text-xs text-gray-500 mt-1 flex items-center">
            <span class="material-icons text-xs mr-1">access_time</span>
            {{ formatDate(chat.update_time || chat.lastMessage?.timestamp) }}
            <span v-if="chat.message_count" class="ml-2">({{ chat.message_count }}条)</span>
          </div>
        </div>
        
        <!-- 删除按钮 -->
        <button
          @click.stop="$emit('delete-chat', chat.history_id || chat.id)"
          class="absolute right-2 top-2 opacity-0 group-hover:opacity-100 p-1 rounded-full text-gray-500 hover:bg-gray-200 hover:text-red-500 transition-all"
          title="删除对话"
        >
          <span class="material-icons text-sm">delete</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  conversations: {
    type: Array,
    default: () => []
  },
  activeChat: {
    type: [Number, String, null],
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  }
})

defineEmits(['new-chat', 'select-chat', 'delete-chat'])

const formatDate = (timestamp) => {
  if (!timestamp) return '刚刚'
  
  const date = new Date(timestamp)
  const now = new Date()
  
  // 如果是今天，只显示时间
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})
  }
  
  // 否则显示完整日期
  return date.toLocaleDateString()
}
</script>

<style scoped>
.group:hover .opacity-0 {
  opacity: 1;
}
</style>
