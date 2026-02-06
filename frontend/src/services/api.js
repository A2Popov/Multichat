import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  login: (username, password) =>
    api.post('/auth/login', new URLSearchParams({ username, password }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }),
  getMe: () => api.get('/auth/me'),
}

export const usersAPI = {
  list: () => api.get('/users'),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.patch(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
}

export const chatAPI = {
  getModels: () => api.get('/chat/models'),
  getSessions: () => api.get('/chat/sessions'),
  createSession: (model, title) => api.post('/chat/sessions', { model, title }),
  getMessages: (sessionId) => api.get(`/chat/sessions/${sessionId}/messages`),
  sendMessage: (sessionId, content, fileIds = null) => {
    const params = fileIds ? { file_ids: fileIds.join(',') } : {}
    return api.post(`/chat/sessions/${sessionId}/messages`, { content }, { params })
  },
  renameSession: (sessionId, title) => api.patch(`/chat/sessions/${sessionId}`, { title }),
  deleteSession: (sessionId) => api.delete(`/chat/sessions/${sessionId}`),
}

export const filesAPI = {
  upload: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  list: () => api.get('/files'),
  delete: (fileId) => api.delete(`/files/${fileId}`)
}

export default api
