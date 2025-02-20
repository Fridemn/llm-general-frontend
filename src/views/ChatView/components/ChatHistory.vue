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
      <div
        v-for="chat in conversations"
        :key="chat.id"
        @click="$emit('select-chat', chat.id)"
        class="p-3 hover:bg-gray-100 cursor-pointer transition-colors"
        :class="{ 'bg-gray-100': chat.id === activeChat }"
      >
        <div class="text-sm font-medium truncate">{{ chat.title }}</div>
        <div class="text-xs text-gray-500 mt-1">
          {{ formatDate(chat.lastMessage?.timestamp) }}
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
    type: [Number, null],
    default: null
  }
})

defineEmits(['new-chat', 'select-chat'])

const formatDate = (timestamp) => {
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleDateString()
}
</script>
