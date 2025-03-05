<template>
  <div class="flex flex-col h-full">
    <div class="flex items-center justify-between p-4" :class="{'justify-center': collapsed}">
      <h2 v-if="!collapsed" class="text-lg font-medium">聊天历史</h2>
      <button 
        @click="$emit('new-chat')" 
        class="hover:bg-gray-100 p-2 rounded-full"
        :title="collapsed ? '新建聊天' : ''"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>
    
    <div class="flex-1 overflow-y-auto px-2">
      <div v-if="loading" class="flex justify-center py-4">
        <svg class="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
      
      <div v-else-if="conversations.length === 0" class="text-center py-4 text-gray-500">
        <span v-if="!collapsed">没有聊天记录</span>
      </div>
      
      <div v-else class="space-y-1">
        <div
          v-for="chat in conversations"
          :key="chat.history_id || chat.id"
          @click="$emit('select-chat', chat.history_id || chat.id)"
          class="cursor-pointer rounded p-2 transition"
          :class="[
            (chat.history_id || chat.id) === activeChat 
              ? 'bg-blue-100 text-blue-800' 
              : 'hover:bg-gray-100',
            collapsed ? 'flex justify-center' : ''
          ]"
        >
          <div v-if="collapsed" class="w-6 h-6 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clip-rule="evenodd" />
            </svg>
          </div>
          <div v-else class="flex justify-between items-center">
            <div class="truncate flex-1">{{ chat.title || '新对话' }}</div>
            <button 
              @click.stop="$emit('delete-chat', chat.history_id || chat.id)" 
              class="opacity-0 group-hover:opacity-100 hover:text-red-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
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
  },
  collapsed: {
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
