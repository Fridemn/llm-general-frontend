import axios from 'axios'

const request = axios.create({
  baseURL: import.meta.env.VITE_BASE_API,
  timeout: 600000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
request.interceptors.request.use(
    config => {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`
      }
      return config
    },
    error => {
      return Promise.reject(error)
    }
  )

// 响应拦截器
request.interceptors.response.use(
  response => {
    const res = response.data
    if (res.code && res.code !== 200) {
      console.error(res.message || '错误')
      return Promise.reject(new Error(res.message || '错误'))
    }
    return res
  },
  error => {
    console.error('请求错误:', error)
    const errorMsg = error.response?.data?.message || '网络错误'
    console.error(errorMsg)
    return Promise.reject(error)
  }
)

export default request
