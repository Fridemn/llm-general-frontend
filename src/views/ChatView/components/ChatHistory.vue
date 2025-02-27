<template>
  <div class="h-full flex flex-col border-r">
    <div class="p-4">
      <button
        @click="$emit('new-chat')"
        class="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        新建对话
      </button>
    </div>

    <div class="flex-1 overflow-y-auto">
      <div v-if="loading" class="p-3 text-center text-gray-500">
        <span>加载中...</span>
      </div>
      <div v-else-if="conversations.length === 0" class="p-3 text-center text-gray-500">
        <span>暂无对话历史</span>
      </div>
      <div
        v-else
        v-for="chat in conversations"
        :key="chat.history_id || chat.id"
        class="p-3 hover:bg-gray-100 cursor-pointer transition-colors relative group"
        :class="{ 'bg-gray-100': (chat.history_id || chat.id) === activeChat }"
      >
        <div @click="$emit('select-chat', chat.history_id || chat.id)">
          <div class="text-sm font-medium truncate">{{ chat.title }}</div>
          <div class="text-xs text-gray-500 mt-1">
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
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleDateString()
}
</script>

<style scoped>
.group:hover .opacity-0 {
  opacity: 1;
}
</style>
