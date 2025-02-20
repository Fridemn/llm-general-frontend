import { createRouter, createWebHistory } from 'vue-router'
import LoginOrRegister from '@/views/LoginOrRegister.vue'
import HomeView from '@/views/HomeView.vue'
import test from '@/views/testView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // {
    //   path: '/',
    //   name: 'Login',
    //   component: LoginOrRegister,
    // },
    {
      path: '/',
      name: 'Test',
      component: test,
    },
    // {
    //   path: '/',
    //   name: 'Test',
    //   component: HomeView,
    // }
  ],
})

export default router
