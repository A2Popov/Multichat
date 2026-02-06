import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { usersAPI } from '../services/api'
import axios from '../services/api'

const AdminDashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showBalanceModal, setShowBalanceModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [balanceAmount, setBalanceAmount] = useState('')
  const [balanceDescription, setBalanceDescription] = useState('')
  const [loading, setLoading] = useState(true)
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    is_admin: false,
  })

  useEffect(() => {
    if (!user?.is_admin) {
      navigate('/chat')
      return
    }
    loadData()
  }, [user, navigate])

  const loadData = async () => {
    setLoading(true)
    try {
      const [statsRes, usersRes] = await Promise.all([
        axios.get('/stats/admin/overview'),
        usersAPI.list()
      ])
      setStats(statsRes.data)
      setUsers(usersRes.data)
    } catch (error) {
      console.error('Failed to load admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    try {
      await usersAPI.create(newUser)
      setShowCreateModal(false)
      setNewUser({ username: '', email: '', password: '', is_admin: false })
      loadData()
    } catch (error) {
      alert(error.response?.data?.detail || 'Ошибка при создании пользователя')
    }
  }

  const handleAdjustBalance = async () => {
    if (!balanceAmount || !selectedUser) return
    
    try {
      await axios.post(`/stats/admin/user/${selectedUser.id}/adjust-balance`, null, {
        params: {
          amount: parseFloat(balanceAmount),
          description: balanceDescription || `Корректировка баланса администратором`
        }
      })
      setShowBalanceModal(false)
      setSelectedUser(null)
      setBalanceAmount('')
      setBalanceDescription('')
      loadData()
    } catch (error) {
      alert(error.response?.data?.detail || 'Ошибка при изменении баланса')
    }
  }

  const handleToggleActive = async (userId, isActive) => {
    try {
      await usersAPI.update(userId, { is_active: !isActive })
      loadData()
    } catch (error) {
      alert(error.response?.data?.detail || 'Ошибка при обновлении пользователя')
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) return
    
    try {
      await usersAPI.delete(userId)
      loadData()
    } catch (error) {
      alert(error.response?.data?.detail || 'Ошибка при удалении пользователя')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Загрузка админ-панели...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b-2 border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <button
                onClick={() => navigate('/chat')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Назад к чату
              </button>
              <div className="border-l h-10 border-gray-200"></div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Панель администратора</h1>
                <p className="text-gray-500 mt-1">{user?.username}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="text-red-600 hover:bg-red-50 py-2 px-6 rounded-xl font-bold transition-colors"
            >
              Выйти
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 overflow-hidden mb-8">
          <div className="border-b-2 border-gray-200 bg-gray-50">
            <div className="flex">
              {[
                { id: 'overview', label: 'Обзор', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
                { id: 'users', label: 'Пользователи', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
                { id: 'analytics', label: 'Аналитика', icon: 'M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-6 py-4 font-bold transition-all flex items-center justify-center gap-2 ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-b-4 border-blue-600 bg-white'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                  </svg>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="bg-gradient-to-br from-blue-100 to-indigo-100 p-3 rounded-xl">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{stats?.total_users}</div>
                <div className="text-sm text-gray-500 font-medium">Всего пользователей</div>
                <div className="mt-2 text-xs text-green-600 font-bold">{stats?.active_users} активных</div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="bg-gradient-to-br from-green-100 to-emerald-100 p-3 rounded-xl">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">${stats?.total_revenue?.toFixed(2)}</div>
                <div className="text-sm text-gray-500 font-medium">Общая выручка</div>
                <div className="mt-2 text-xs text-green-600 font-bold">${stats?.revenue_24h?.toFixed(4)} за 24ч</div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="bg-gradient-to-br from-purple-100 to-pink-100 p-3 rounded-xl">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{stats?.total_requests}</div>
                <div className="text-sm text-gray-500 font-medium">Всего запросов</div>
                <div className="mt-2 text-xs text-purple-600 font-bold">{stats?.requests_24h} за 24ч</div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="bg-gradient-to-br from-orange-100 to-red-100 p-3 rounded-xl">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{((stats?.total_tokens || 0) / 1000000).toFixed(1)}M</div>
                <div className="text-sm text-gray-500 font-medium">Всего токенов</div>
              </div>
            </div>

            {/* Top Users */}
            <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Топ пользователей</h3>
              <div className="bg-gray-50 rounded-xl border-2 border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-slate-700 to-slate-900 text-white">
                    <tr>
                      <th className="text-left px-6 py-4 font-bold">Пользователь</th>
                      <th className="text-left px-6 py-4 font-bold">Email</th>
                      <th className="text-right px-6 py-4 font-bold">Запросов</th>
                      <th className="text-right px-6 py-4 font-bold">Потрачено</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats?.top_users?.map((user,index) => (
                      <tr key={user.username} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 font-bold text-gray-900">{user.username}</td>
                        <td className="px-6 py-4 text-gray-600">{user.email}</td>
                        <td className="px-6 py-4 text-right font-bold text-gray-900">{user.request_count}</td>
                        <td className="px-6 py-4 text-right font-bold text-blue-600">${user.total_spent.toFixed(4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Usage by Model */}
            <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Использование по моделям</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stats?.usage_by_model?.map((model) => (
                  <div key={model.model} className="bg-gradient-to-r from-gray-50 to-white p-6 rounded-xl border-2 border-gray-200">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-bold text-gray-900 text-lg">{model.model}</span>
                      <span className="text-2xl font-bold text-blue-600">${model.revenue.toFixed(4)}</span>
                    </div>
                    <div className="text-sm text-gray-600 font-medium">
                      {model.count} запросов
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Управление пользователями</h2>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Создать пользователя
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-slate-700 to-slate-900 text-white">
                  <tr>
                    <th className="text-left px-6 py-4 font-bold">Пользователь</th>
                    <th className="text-left px-6 py-4 font-bold">Email</th>
                    <th className="text-center px-6 py-4 font-bold">Баланс</th>
                    <th className="text-center px-6 py-4 font-bold">Статус</th>
                    <th className="text-center px-6 py-4 font-bold">Роль</th>
                    <th className="text-center px-6 py-4 font-bold">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, index) => (
                    <tr key={u.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 font-bold text-gray-900">{u.username}</td>
                      <td className="px-6 py-4 text-gray-600">{u.email}</td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => {
                            setSelectedUser(u)
                            setShowBalanceModal(true)
                          }}
                          className="font-bold text-green-600 hover:text-green-700 hover:underline"
                        >
                          ${u.balance.toFixed(2)}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                          u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {u.is_active ? 'Активен' : 'Заблокирован'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                          u.is_admin ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {u.is_admin ? 'Администратор' : 'Пользователь'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleToggleActive(u.id, u.is_active)}
                            className="text-blue-600 hover:text-blue-700 font-medium"
                            title={u.is_active ? 'Заблокировать' : 'Разблокировать'}
                          >
                            {u.is_active ? '🔒' : '🔓'}
                          </button>
                          {u.id !== user.id && (
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="text-red-600 hover:text-red-700 font-medium"
                              title="Удалить"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Дневная статистика (последние 30 дней)</h3>
              <div className="bg-gray-50 rounded-xl border-2 border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-slate-700 to-slate-900 text-white">
                    <tr>
                      <th className="text-left px-6 py-4 font-bold">Дата</th>
                      <th className="text-right px-6 py-4 font-bold">Запросов</th>
                      <th className="text-right px-6 py-4 font-bold">Активных пользователей</th>
                      <th className="text-right px-6 py-4 font-bold">Выручка</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats?.daily_stats?.slice().reverse().map((day, index) => (
                      <tr key={day.date} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 font-medium text-gray-900">{new Date(day.date).toLocaleDateString('ru-RU')}</td>
                        <td className="px-6 py-4 text-right font-bold text-gray-900">{day.requests}</td>
                        <td className="px-6 py-4 text-right font-bold text-purple-600">{day.active_users}</td>
                        <td className="px-6 py-4 text-right font-bold text-green-600">${day.revenue.toFixed(4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl border border-gray-200">
            <h3 className="text-2xl font-bold mb-6 text-gray-900">Создать пользователя</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Имя пользователя</label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Пароль</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={newUser.is_admin}
                  onChange={(e) => setNewUser({ ...newUser, is_admin: e.target.checked })}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label className="text-sm font-bold text-gray-700">Администратор</label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 font-bold shadow-md hover:shadow-lg transition-all"
                >
                  Создать
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-xl hover:bg-gray-200 font-bold transition-colors"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Balance Modal */}
      {showBalanceModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl border border-gray-200">
            <h3 className="text-2xl font-bold mb-6 text-gray-900">Изменить баланс</h3>
            <div className="mb-6 bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Пользователь</div>
              <div className="font-bold text-gray-900 text-lg">{selectedUser.username}</div>
              <div className="text-sm text-gray-600 mt-2">Текущий баланс</div>
              <div className="font-bold text-green-600 text-2xl">${selectedUser.balance.toFixed(2)}</div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Сумма (+ пополнить / - списать)</label>
                <input
                  type="number"
                  step="0.01"
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(e.target.value)}
                  placeholder="10.00"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Описание (необязательно)</label>
                <input
                  type="text"
                  value={balanceDescription}
                  onChange={(e) => setBalanceDescription(e.target.value)}
                  placeholder="Причина изменения баланса"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleAdjustBalance}
                  disabled={!balanceAmount}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed font-bold shadow-md hover:shadow-lg transition-all"
                >
                  Применить
                </button>
                <button
                  onClick={() => {
                    setShowBalanceModal(false)
                    setSelectedUser(null)
                    setBalanceAmount('')
                    setBalanceDescription('')
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-xl hover:bg-gray-200 font-bold transition-colors"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
