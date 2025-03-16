import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import LoginOrRegister from '@/views/LoginOrRegister/index.vue'
import Chat from '@/views/ChatView/index.vue'
import test from '@/views/testView.vue'
import Live2dView from '@/views/Live2dView/index.vue'
import { useUserStore } from '@/store/user'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/login',
      name: 'login',
      component: LoginOrRegister,
      meta: {
        title: '登录/注册'
      }
    },
    {
      path: '/test',
      name: 'test',
      component: test,
      meta: {
        requiresAuth: true, // 需要登录才能访问
        title: '测试页面'
      }
    },
    {
      path: '/live2d',
      name: 'live2d',
      component: Live2dView
    },
    {
      path: '/chat',
      name: 'Chat',
      component: Chat,
      meta: {
        requiresAuth: true, // 需要登录才能访问
        title: '聊天页面'
      }
    }
  ]
})

// 全局路由守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  if (to.meta.requiresAuth && !userStore.token) {
    next('/login')
  } else {
    next()
  }
})

export default router
