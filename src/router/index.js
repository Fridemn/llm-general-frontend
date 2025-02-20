import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import LoginOrRegister from '@/views/LoginOrRegister/index.vue'
import Chat from '@/views/ChatView/index.vue'
import test from '@/views/testView.vue'

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
  // 设置页面标题
  document.title = to.meta.title || '默认标题'

  // 检查是否需要登录权限
  if (to.matched.some(record => record.meta.requiresAuth)) {
    // 检查是否已登录
    const token = localStorage.getItem('token')
    if (!token) {
      // 未登录则重定向到登录页
      next({
        path: '/login',
        query: { redirect: to.fullPath } // 保存要跳转的路由，登录后直接跳转
      })
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router
