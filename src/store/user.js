import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(() => {
    try {
      const storedInfo = localStorage.getItem('userInfo')
      return storedInfo ? JSON.parse(storedInfo) : {}
    } catch (e) {
      console.warn('Failed to parse userInfo from localStorage:', e)
      return {}
    }
  })

  const setUserInfo = (info) => {
    userInfo.value = info
    localStorage.setItem('userInfo', JSON.stringify(info))
  }

  const setToken = (newToken) => {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  const clearUserInfo = () => {
    token.value = ''
    userInfo.value = {}
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
  }

  return {
    token,
    userInfo,
    setUserInfo,
    setToken,
    clearUserInfo
  }
})
