<template>
  <nav class="h-full p-4 flex flex-col">
    <div class="space-y-2">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="flex items-center p-2 rounded-lg hover:bg-gray-100 transition-colors"
        :class="{ 'bg-gray-100': isActive(item.path) }"
      >
        <span class="material-icons mr-2">{{ item.icon }}</span>
        {{ item.name }}
      </router-link>
    </div>
    
    <div class="mt-auto">
      <div class="flex items-center p-2 text-gray-600">
        <span class="material-icons mr-2">account_circle</span>
        {{ userStore.userInfo.username || '未登录' }}
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/store/user'

const route = useRoute()
const userStore = useUserStore()

const navItems = [
  { name: '聊天', path: '/chat', icon: 'chat' },
  { name: '模型市场', path: '/models', icon: 'store' },
  { name: '设置', path: '/settings', icon: 'settings' }
]

const isActive = (path) => route.path === path
</script>
