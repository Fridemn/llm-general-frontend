import axios from 'axios'
import { useUserStore } from '@/store/user'

const request = axios.create({
  baseURL: import.meta.env.VITE_BASE_API,
  timeout: 10000
})

request.interceptors.request.use(
  config => {
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

request.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    if (error.response?.status === 401) {
      const userStore = useUserStore()
      userStore.clearUserInfo()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default request
