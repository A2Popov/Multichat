import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from '../services/api'

const Profile = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [usageHistory, setUsageHistory] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [statsRes, historyRes, transactionsRes] = await Promise.all([
        axios.get('/stats/user'),
        axios.get('/stats/user/history?limit=20'),
        axios.get('/stats/user/transactions?limit=20')
      ])
      setStats(statsRes.data)
      setUsageHistory(historyRes.data.history)
      setTransactions(transactionsRes.data.transactions)
    } catch (error) {
      console.error('Failed to load profile data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Загрузка профиля...</p>
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
                <h1 className="text-3xl font-bold text-gray-900">Профиль</h1>
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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-gradient-to-br from-green-100 to-emerald-100 p-3 rounded-xl">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">${user?.balance?.toFixed(2)}</div>
            <div className="text-sm text-gray-500 font-medium">Текущий баланс</div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-gradient-to-br from-blue-100 to-indigo-100 p-3 rounded-xl">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">${stats?.total_spent?.toFixed(4)}</div>
            <div className="text-sm text-gray-500 font-medium">Всего потрачено</div>
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
          </div>

          <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-gradient-to-br from-orange-100 to-red-100 p-3 rounded-xl">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{((stats?.total_input_tokens + stats?.total_output_tokens) / 1000).toFixed(1)}K</div>
            <div className="text-sm text-gray-500 font-medium">Всего токенов</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 overflow-hidden">
          <div className="border-b-2 border-gray-200 bg-gray-50">
            <div className="flex">
              {[
                { id: 'overview', label: 'Обзор', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
                { id: 'history', label: 'История использования', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
                { id: 'transactions', label: 'Транзакции', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' }
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

          <div className="p-8">
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Usage by Model */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Использование по моделям</h3>
                  <div className="space-y-3">
                    {stats?.usage_by_model?.map((model) => (
                      <div key={model.model} className="bg-gradient-to-r from-gray-50 to-white p-5 rounded-xl border-2 border-gray-200">
                        <div className="flex justify-between items-center mb-3">
                          <span className="font-bold text-gray-900 text-lg">{model.model}</span>
                          <span className="text-2xl font-bold text-blue-600">${model.total_cost.toFixed(4)}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="text-gray-500 font-medium mb-1">Запросов</div>
                            <div className="text-gray-900 font-bold">{model.count}</div>
                          </div>
                          <div>
                            <div className="text-gray-500 font-medium mb-1">Входных токенов</div>
                            <div className="text-gray-900 font-bold">{model.total_input.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-gray-500 font-medium mb-1">Выходных токенов</div>
                            <div className="text-gray-900 font-bold">{model.total_output.toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Last 7 Days */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Последние 7 дней</h3>
                  <div className="bg-gray-50 rounded-xl border-2 border-gray-200 overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-slate-700 to-slate-900 text-white">
                        <tr>
                          <th className="text-left px-6 py-4 font-bold">Дата</th>
                          <th className="text-right px-6 py-4 font-bold">Запросов</th>
                          <th className="text-right px-6 py-4 font-bold">Стоимость</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats?.usage_by_day?.map((day, index) => (
                          <tr key={day.date} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-6 py-4 font-medium text-gray-900">{new Date(day.date).toLocaleDateString('ru-RU')}</td>
                            <td className="px-6 py-4 text-right font-bold text-gray-900">{day.requests}</td>
                            <td className="px-6 py-4 text-right font-bold text-blue-600">${day.cost.toFixed(4)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Последние запросы</h3>
                <div className="bg-gray-50 rounded-xl border-2 border-gray-200 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-slate-700 to-slate-900 text-white">
                      <tr>
                        <th className="text-left px-6 py-4 font-bold">Дата</th>
                        <th className="text-left px-6 py-4 font-bold">Модель</th>
                        <th className="text-center px-6 py-4 font-bold">Тип</th>
                        <th className="text-right px-6 py-4 font-bold">Токены</th>
                        <th className="text-right px-6 py-4 font-bold">Стоимость</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usageHistory.map((log, index) => (
                        <tr key={log.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4 text-sm font-medium text-gray-600">
                            {new Date(log.created_at).toLocaleString('ru-RU')}
                          </td>
                          <td className="px-6 py-4 font-bold text-gray-900">{log.model}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                              log.session_type === 'arena' 
                                ? 'bg-purple-100 text-purple-700' 
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {log.session_type === 'arena' ? 'ИИ-баттл' : 'Чат'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-gray-700">
                            {(log.input_tokens + log.output_tokens).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-blue-600">
                            ${log.cost.toFixed(4)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'transactions' && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">История транзакций</h3>
                {transactions.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <svg className="mx-auto h-16 w-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <p className="text-gray-500 font-medium">Нет транзакций</p>
                    <p className="text-sm text-gray-400 mt-1">Пополнения баланса будут отображаться здесь</p>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl border-2 border-gray-200 overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-slate-700 to-slate-900 text-white">
                        <tr>
                          <th className="text-left px-6 py-4 font-bold">Дата</th>
                          <th className="text-left px-6 py-4 font-bold">Описание</th>
                          <th className="text-right px-6 py-4 font-bold">Сумма</th>
                          <th className="text-right px-6 py-4 font-bold">Баланс после</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((tx, index) => (
                          <tr key={tx.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-6 py-4 text-sm font-medium text-gray-600">
                              {new Date(tx.created_at).toLocaleString('ru-RU')}
                            </td>
                            <td className="px-6 py-4 text-gray-900 font-medium">{tx.description}</td>
                            <td className={`px-6 py-4 text-right font-bold ${
                              tx.amount > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {tx.amount > 0 ? '+' : ''} ${tx.amount.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-gray-900">
                              ${tx.balance_after.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
