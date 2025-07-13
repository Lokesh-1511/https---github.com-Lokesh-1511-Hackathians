import axios from 'axios'

const API_BASE_URL = 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add request interceptor for debugging
api.interceptors.request.use((config) => {
  console.log('🚀 API Request:', {
    method: config.method?.toUpperCase(),
    url: config.url,
    fullURL: config.baseURL + config.url,
    data: config.data
  })
  
  const token = localStorage.getItem('agrichain_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}, (error) => {
  console.error('❌ Request Error:', error)
  return Promise.reject(error)
})

// Add response interceptor for debugging
api.interceptors.response.use((response) => {
  console.log('✅ API Response:', {
    status: response.status,
    url: response.config.url,
    data: response.data
  })
  return response
}, (error) => {
  console.error('❌ API Error:', {
    status: error.response?.status,
    message: error.message,
    url: error.config?.url,
    fullURL: error.config?.baseURL + error.config?.url
  })
  return Promise.reject(error)
})

// API functions
export const apiService = {
  // Health check
  healthCheck: () => api.get('/health'),

  // Firebase Authentication
  register: (data) => api.post('/register', data),
  login: (data) => api.post('/login', data),

  // Legacy OTP functions (keeping for backward compatibility)
  generateOTP: (data) => api.post('/generate-otp', data),
  verifyOTP: (data) => api.post('/verify-otp', data),

  // Get user profile
  getProfile: () => api.get('/profile'),

  // Get all users (admin)
  getUsers: () => api.get('/users'),
}

export default api
