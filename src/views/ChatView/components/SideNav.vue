<template>
  <nav class="h-full flex flex-col py-4">
    <!-- 顶部 Logo 和标题 -->
    <div class="px-4 mb-6 flex items-center">
      <span class="material-icons text-blue-600 text-2xl mr-2">AI</span>
      <h1 class="text-lg font-bold transition-all duration-300 overflow-hidden"
          :class="{ 'opacity-0 w-0': collapsed }">AI助手</h1>
    </div>
    
    <!-- 导航项目 -->
    <div class="flex-1 overflow-y-auto space-y-1 px-2">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="flex items-center py-2 px-3 rounded-lg hover:bg-gray-100 transition-colors"
        :class="[
          isActive(item.path) ? 'bg-blue-50 text-blue-600' : 'text-gray-700',
          collapsed ? 'justify-center' : ''
        ]"
      >
        <span class="material-icons" :class="{ 'mr-3': !collapsed }">{{ item.icon }}</span>
        <span class="transition-all duration-300 overflow-hidden whitespace-nowrap"
              :class="{ 'opacity-0 w-0': collapsed }">{{ item.name }}</span>
      </router-link>
    </div>
    
    <!-- 用户信息/底部菜单 -->
    <div class="mt-auto border-t pt-4 px-2">
      <div 
        class="flex items-center py-2 px-3 rounded-lg hover:bg-gray-100 cursor-pointer"
        :class="{ 'justify-center': collapsed }"
      >
        <span class="material-icons text-gray-600" :class="{ 'mr-3': !collapsed }"></span>
        <span class="transition-all duration-300 overflow-hidden whitespace-nowrap"
              :class="{ 'opacity-0 w-0': collapsed }">设置</span>
      </div>
      
      <div 
        class="flex items-center py-2 px-3 rounded-lg hover:bg-gray-100 cursor-pointer"
        :class="{ 'justify-center': collapsed }"
        @click="handleLogout"
      >
        <span class="material-icons text-gray-600" :class="{ 'mr-3': !collapsed }"></span>
        <span class="transition-all duration-300 overflow-hidden whitespace-nowrap"
              :class="{ 'opacity-0 w-0': collapsed }">退出登录</span>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 接收父组件传递的折叠状态
const props = defineProps({
  collapsed: {
    type: Boolean,
    default: false
  }
})

// 导航项目
const navItems = [
  { name: '聊天', path: '/chat', icon: '' },
  { name: '知识库', path: '/knowledge', icon: '' },
  { name: '文档助手', path: '/docs', icon: '' }
]

// 判断路由是否激活
const isActive = (path) => route.path === path || route.path.startsWith(`${path}/`)

// 退出登录
const handleLogout = () => {
  if (confirm('确定要退出登录吗？')) {
    userStore.logout()
    router.push('/login')
  }
}
</script>
