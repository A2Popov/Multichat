import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { chatAPI, filesAPI } from '../services/api'

const Chat = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sessions, setSessions] = useState([])
  const [currentSession, setCurrentSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showNewChatModal, setShowNewChatModal] = useState(false)
  const [newChatModel, setNewChatModel] = useState('')
  const [availableModels, setAvailableModels] = useState([])
  const [contextMenu, setContextMenu] = useState(null)
  const [showRenameModal, setShowRenameModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedSession, setSelectedSession] = useState(null)
  const [renameTitle, setRenameTitle] = useState('')
  const [selectedFiles, setSelectedFiles] = useState([])
  const [uploadedFiles, setUploadedFiles] = useState([])
  const fileInputRef = useRef(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    loadModels()
    loadSessions()
  }, [])

  useEffect(() => {
    if (currentSession) {
      loadMessages(currentSession.id)
    }
  }, [currentSession])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const handleClick = () => setContextMenu(null)
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadModels = async () => {
    try {
      const response = await chatAPI.getModels()
      setAvailableModels(response.data.models)
      if (response.data.models.length > 0) {
        setNewChatModel(response.data.models[0].id)
      }
    } catch (error) {
      console.error('Failed to load models:', error)
    }
  }

  const loadSessions = async () => {
    try {
      const response = await chatAPI.getSessions()
      setSessions(response.data)
      if (response.data.length > 0 && !currentSession) {
        setCurrentSession(response.data[0])
      }
    } catch (error) {
      console.error('Failed to load sessions:', error)
    }
  }

  const loadMessages = async (sessionId) => {
    try {
      const response = await chatAPI.getMessages(sessionId)
      setMessages(response.data)
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }

  const createNewSession = async () => {
    try {
      const response = await chatAPI.createSession(newChatModel)
      setSessions([response.data, ...sessions])
      setCurrentSession(response.data)
      setMessages([])
      setShowNewChatModal(false)
    } catch (error) {
      console.error('Failed to create session:', error)
      alert(error.response?.data?.detail || 'Failed to create session')
    }
  }

  const handleContextMenu = (e, session) => {
    e.preventDefault()
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      session
    })
  }

  const handleRename = () => {
    setSelectedSession(contextMenu.session)
    setRenameTitle(contextMenu.session.title)
    setShowRenameModal(true)
    setContextMenu(null)
  }

  const handleDeleteConfirm = () => {
    setSelectedSession(contextMenu.session)
    setShowDeleteModal(true)
    setContextMenu(null)
  }

  const renameSession = async () => {
    if (!renameTitle.trim()) return
    
    try {
      await chatAPI.renameSession(selectedSession.id, renameTitle)
      await loadSessions()
      if (currentSession?.id === selectedSession.id) {
        setCurrentSession({ ...currentSession, title: renameTitle })
      }
      setShowRenameModal(false)
      setSelectedSession(null)
      setRenameTitle('')
    } catch (error) {
      console.error('Failed to rename session:', error)
      alert(error.response?.data?.detail || 'Ошибка при переименовании')
    }
  }

  const deleteSession = async () => {
    try {
      await chatAPI.deleteSession(selectedSession.id)
      const newSessions = sessions.filter(s => s.id !== selectedSession.id)
      setSessions(newSessions)
      
      if (currentSession?.id === selectedSession.id) {
        setCurrentSession(newSessions[0] || null)
        setMessages([])
      }
      
      setShowDeleteModal(false)
      setSelectedSession(null)
    } catch (error) {
      console.error('Failed to delete session:', error)
      alert(error.response?.data?.detail || 'Ошибка при удалении')
    }
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!input.trim() || !currentSession || loading) return

    setLoading(true)
    const userMessage = input
    setInput('')

    try {
      // Upload files if any selected
      const fileIds = []
      for (const file of selectedFiles) {
        const response = await filesAPI.upload(file)
        fileIds.push(response.data.id)
      }
      
      // Send message with file IDs
      const response = await chatAPI.sendMessage(
        currentSession.id, 
        userMessage, 
        fileIds.length > 0 ? fileIds : null
      )
      
      await loadMessages(currentSession.id)
      setSelectedFiles([])
      setUploadedFiles([])
    } catch (error) {
      console.error('Failed to send message:', error)
      alert(error.response?.data?.detail || 'Failed to send message')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    setSelectedFiles(prev => [...prev, ...files])
  }

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar */}
      <div className="w-72 bg-white border-r border-gray-200 flex flex-col shadow-lg">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-br from-slate-700 to-slate-900 text-white">
          <h1 className="text-2xl font-bold tracking-tight">MultiChat</h1>
          <p className="text-sm opacity-90 mt-1">{user?.username}</p>
          <div className="mt-3 bg-white/10 rounded-lg p-3 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-wider opacity-75 mb-1">Баланс</p>
            <p className="text-lg font-bold">${user?.balance?.toFixed(2) || '0.00'}</p>
          </div>
        </div>

        <div className="p-4 space-y-3">
          <button
            onClick={() => setShowNewChatModal(true)}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 font-bold shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Новый чат
          </button>
          <button
            onClick={() => navigate('/arena')}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-xl hover:from-purple-700 hover:to-pink-700 font-bold shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            ИИ-баттл
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => setCurrentSession(session)}
              onContextMenu={(e) => handleContextMenu(e, session)}
              className={`p-4 cursor-pointer rounded-xl transition-all duration-200 ${
                currentSession?.id === session.id 
                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-sm' 
                  : 'hover:bg-gray-50 border-2 border-transparent'
              }`}
            >
              <div className="text-sm font-bold truncate text-gray-900">{session.title}</div>
              <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                <span className="font-medium">{session.model}</span>
                <span className="opacity-50">•</span>
                <span>{new Date(session.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-200 space-y-2">
          <button
            onClick={() => navigate('/profile')}
            className="w-full text-center bg-gray-100 text-gray-700 hover:bg-gray-200 py-2 px-4 rounded-lg font-medium transition-colors"
          >
            Мой профиль
          </button>
          {user?.is_admin && (
            <a
              href="/admin"
              className="block text-center bg-gray-100 text-gray-700 hover:bg-gray-200 py-2 px-4 rounded-lg font-medium transition-colors"
            >
              Панель админа
            </a>
          )}
          <button
            onClick={logout}
            className="w-full text-red-600 hover:bg-red-50 py-2 px-4 rounded-lg font-medium transition-colors"
          >
            Выйти
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentSession ? (
          <>
            <div className="bg-white border-b-2 border-gray-200 p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900">{currentSession.title}</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm font-medium text-gray-600">Модель:</span>
                <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">{currentSession.model}</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-gray-50 to-white">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-2xl px-6 py-4 rounded-2xl shadow-md ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                        : 'bg-white text-gray-800 border-2 border-gray-100'
                    }`}
                  >
                    <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
                    {message.attachments && message.attachments.length > 0 && (
                      <div className={`mt-3 pt-3 border-t ${
                        message.role === 'user' ? 'border-white/20' : 'border-gray-200'
                      }`}>
                        {message.attachments.map((attachment, idx) => (
                          <div key={idx} className={`text-xs flex items-center gap-2 ${
                            message.role === 'user' ? 'text-white/90' : 'text-gray-600'
                          }`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                            {attachment.filename}
                          </div>
                        ))}
                      </div>
                    )}
                    {message.tokens && (
                      <div className={`text-xs mt-2 pt-2 border-t ${
                        message.role === 'user' ? 'border-white/20 text-white/70' : 'border-gray-200 text-gray-500'
                      }`}>
                        {message.tokens.toLocaleString()} токенов
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white text-gray-800 border-2 border-gray-200 px-6 py-4 rounded-2xl shadow-md flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    <div className="font-medium">Обдумывает ответ...</div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="bg-white border-t-2 border-gray-200 p-6 shadow-lg">
              {selectedFiles.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {selectedFiles.map((file, idx) => (
                    <div key={idx} className="bg-gray-100 rounded-lg px-3 py-2 flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      <span className="text-gray-700 max-w-[150px] truncate">{file.name}</span>
                      <span className="text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <form onSubmit={sendMessage} className="flex gap-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  multiple
                  accept=".txt,.csv,.pdf,.docx,.doc,.png,.jpg,.jpeg,.webp"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-4 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors border-2 border-gray-200"
                  disabled={loading}
                  title="Прикрепить файл"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </button>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Введите сообщение..."
                  className="flex-1 px-6 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-gray-900 placeholder-gray-400 text-lg"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed font-bold transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Отправить
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
            <div className="text-center">
              <div className="mb-6">
                <svg className="mx-auto h-24 w-24 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold mb-3 text-gray-900">Добро пожаловать в MultiChat</h2>
              <p className="text-gray-500 text-lg mb-8">Выберите чат или создайте новый</p>
              <button
                onClick={() => setShowNewChatModal(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 font-bold shadow-lg hover:shadow-xl transition-all duration-200 inline-flex items-center gap-3"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Создать новый чат
              </button>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl border border-gray-200">
            <h3 className="text-2xl font-bold mb-6 text-gray-900">Новый чат</h3>
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                Выберите AI модель
              </label>
              {availableModels.length > 0 ? (
                <select
                  value={newChatModel}
                  onChange={(e) => setNewChatModel(e.target.value)}
                  className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium"
                >
                  {availableModels.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name} ({model.provider})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-gray-500 bg-gray-50 p-4 rounded-xl border-2 border-dashed border-gray-200 text-center">
                  Нет доступных моделей. Проверьте API ключи.
                </div>
              )}
              <p className="text-xs text-gray-500 mt-3">
                Примечание: Модель нельзя изменить после создания чата
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={createNewSession}
                disabled={availableModels.length === 0}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed font-bold shadow-md hover:shadow-lg transition-all"
              >
                Создать
              </button>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-xl hover:bg-gray-200 font-bold transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-white rounded-xl shadow-2xl border-2 border-gray-200 py-2 z-50 min-w-[200px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleRename}
            className="w-full px-4 py-3 text-left hover:bg-blue-50 flex items-center gap-3 text-gray-700 hover:text-blue-600 transition-colors font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Переименовать
          </button>
          <button
            onClick={handleDeleteConfirm}
            className="w-full px-4 py-3 text-left hover:bg-red-50 flex items-center gap-3 text-gray-700 hover:text-red-600 transition-colors font-medium border-t border-gray-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Удалить
          </button>
        </div>
      )}

      {/* Rename Modal */}
      {showRenameModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl border border-gray-200">
            <h3 className="text-2xl font-bold mb-6 text-gray-900">Переименовать чат</h3>
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                Новое название
              </label>
              <input
                type="text"
                value={renameTitle}
                onChange={(e) => setRenameTitle(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && renameSession()}
                placeholder="Введите название чата..."
                className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={renameSession}
                disabled={!renameTitle.trim()}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed font-bold shadow-md hover:shadow-lg transition-all"
              >
                Сохранить
              </button>
              <button
                onClick={() => {
                  setShowRenameModal(false)
                  setSelectedSession(null)
                  setRenameTitle('')
                }}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-xl hover:bg-gray-200 font-bold transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl border border-gray-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-red-100 p-3 rounded-xl">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Удалить чат?</h3>
                <p className="text-gray-600 mt-1">Это действие нельзя отменить</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 mb-6 border-2 border-gray-200">
              <p className="text-sm font-bold text-gray-900">{selectedSession?.title}</p>
              <p className="text-xs text-gray-500 mt-1">Все сообщения будут удалены</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={deleteSession}
                className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-3 px-6 rounded-xl hover:from-red-700 hover:to-red-800 font-bold shadow-md hover:shadow-lg transition-all"
              >
                Удалить
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedSession(null)
                }}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-xl hover:bg-gray-200 font-bold transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Chat
