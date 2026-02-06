import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../services/api';
import { filesAPI } from '../services/api';

export default function Arena() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [availableModels, setAvailableModels] = useState([]);
  const [selectedModels, setSelectedModels] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalCost, setTotalCost] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);
  const [arbitrationSummary, setArbitrationSummary] = useState(null);
  const [arbitrationLoading, setArbitrationLoading] = useState(false);

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      const { data } = await axios.get('/arena/models');
      console.log('Arena models loaded:', data);
      setAvailableModels(data);
    } catch (error) {
      console.error('Failed to load models:', error);
      alert('Ошибка загрузки моделей: ' + (error.response?.data?.detail || error.message));
    }
  };

  const toggleModel = (modelId) => {
    if (selectedModels.includes(modelId)) {
      setSelectedModels(selectedModels.filter(id => id !== modelId));
    } else {
      if (selectedModels.length < 5) {
        setSelectedModels([...selectedModels, modelId]);
      } else {
        alert('Максимум 5 моделей');
      }
    }
  };

  const handleCompare = async () => {
    if (selectedModels.length < 2) {
      alert('Выберите минимум 2 модели');
      return;
    }

    if (!prompt.trim()) {
      alert('Введите запрос');
      return;
    }

    setLoading(true);
    setResponses([]);
    setTotalCost(0);

    try {
      // Upload files if any selected
      const fileIds = []
      for (const file of selectedFiles) {
        const response = await filesAPI.upload(file)
        fileIds.push(response.data.id)
      }
      
      const requestData = {
        models: selectedModels,
        prompt: prompt
      }
      
      if (fileIds.length > 0) {
        requestData.file_ids = fileIds
      }
      
      const { data } = await axios.post('/arena/compare', requestData);

      setResponses(data.responses);
      setTotalCost(data.total_cost);
      setSelectedFiles([]);
    } catch (error) {
      console.error('Failed to compare:', error);
      alert(error.response?.data?.detail || 'Ошибка при сравнении моделей');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    setSelectedFiles(prev => [...prev, ...files])
  }

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const clearResults = () => {
    setResponses([]);
    setTotalCost(0);
    setPrompt('');
    setArbitrationSummary(null);
  };

  const handleArbitration = async () => {
    if (responses.length < 2) {
      alert('Нужно минимум 2 ответа для арбитража');
      return;
    }

    // Filter out error responses
    const validResponses = responses.filter(r => !r.error);
    if (validResponses.length < 2) {
      alert('Нужно минимум 2 успешных ответа для арбитража');
      return;
    }

    setArbitrationLoading(true);

    try {
      const requestData = {
        prompt: prompt,
        responses: validResponses.map(r => ({
          model: r.model,
          model_name: r.model_name,
          response: r.response
        }))
      };

      const { data } = await axios.post('/arbitration/summarize', requestData);
      setArbitrationSummary(data.summary);
    } catch (error) {
      console.error('Failed to arbitrate:', error);
      alert(error.response?.data?.detail || 'Ошибка при арбитраже');
    } finally {
      setArbitrationLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <button
                onClick={() => navigate('/chat')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Назад
              </button>
              <div className="border-l h-10 border-gray-200"></div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900 tracking-tight">ИИ-баттл</h1>
                <p className="text-gray-500 mt-2 text-sm">Сравнение ответов разных моделей на один запрос</p>
              </div>
            </div>
            <div className="text-right bg-gradient-to-br from-blue-50 to-indigo-50 px-6 py-3 rounded-xl border border-blue-100">
              <div className="text-xs text-gray-600 uppercase tracking-wide font-semibold mb-1">Баланс</div>
              <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                ${user?.balance?.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Model Selection */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Выбор моделей</h2>
            <div className="text-sm font-medium text-gray-500 bg-gray-100 px-4 py-2 rounded-lg">
              {selectedModels.length} / 5 выбрано
            </div>
          </div>
          {availableModels.length === 0 ? (
            <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
              <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-base font-medium">Нет доступных моделей</p>
              <p className="text-sm mt-1">Проверьте настройки API ключей</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {availableModels.map((model) => (
                <button
                  key={model.id}
                  onClick={() => toggleModel(model.id)}
                  disabled={loading}
                  className={`p-5 rounded-xl border-2 transition-all duration-200 ${
                    selectedModels.includes(model.id)
                      ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-md scale-105'
                      : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className={`font-bold text-sm mb-1 ${selectedModels.includes(model.id) ? 'text-blue-700' : 'text-gray-900'}`}>
                    {model.name}
                  </div>
                  <div className={`text-xs ${selectedModels.includes(model.id) ? 'text-blue-600' : 'text-gray-500'}`}>
                    {model.provider}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Prompt Input */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Ваш запрос</h2>
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
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={loading}
            placeholder="Введите запрос для сравнения моделей..."
            className="w-full p-5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none text-gray-900 placeholder-gray-400"
            rows="5"
          />
          <div className="mt-6 flex gap-4">
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
              disabled={loading}
              className="px-6 py-4 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors border-2 border-gray-200 font-medium text-gray-700 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              Файлы
            </button>
            <button
              onClick={handleCompare}
              disabled={loading || selectedModels.length < 2 || !prompt.trim()}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Сравниваю...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Сравнить модели
                </>
              )}
            </button>
            {responses.length > 0 && (
              <button
                onClick={clearResults}
                disabled={loading}
                className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 font-bold transition-all duration-200"
              >
                <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Очистить
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        {responses.length > 0 && (
          <div>
            {/* Total Cost */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 mb-6 shadow-sm">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-bold text-green-900 text-lg">Общая стоимость запроса</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-bold text-green-600">${totalCost.toFixed(4)}</span>
                  <button
                    onClick={handleArbitration}
                    disabled={arbitrationLoading || loading}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:from-gray-300 disabled:to-gray-400 font-bold shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                  >
                    {arbitrationLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Анализ...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Суммировать результаты
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Arbitration Summary */}
            {arbitrationSummary && (
              <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 border-2 border-purple-200 rounded-2xl p-8 mb-6 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-2xl font-bold text-purple-900">Арбитраж ИИ</h3>
                </div>
                <div className="prose prose-purple max-w-none whitespace-pre-wrap text-gray-800 leading-relaxed bg-white/60 p-6 rounded-xl border border-purple-100">
                  {arbitrationSummary}
                </div>
              </div>
            )}

            {/* Responses Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {responses.map((response, index) => (
                <div
                  key={index}
                  className={`bg-white rounded-2xl shadow-lg overflow-hidden border-2 transition-all hover:shadow-xl ${
                    response.error ? 'border-red-300' : 'border-gray-100'
                  }`}
                >
                  {/* Model Header */}
                  <div className="bg-gradient-to-r from-slate-700 to-slate-900 text-white p-6">
                    <h3 className="font-bold text-xl mb-1">{response.model_name}</h3>
                    <div className="text-xs uppercase tracking-wider opacity-75 font-medium">{response.model_id}</div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    {response.error ? (
                      <div className="text-red-700 bg-red-50 p-4 rounded-xl border-2 border-red-200">
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <div className="font-bold mb-1">Ошибка</div>
                            <div className="text-sm">{response.error}</div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="prose prose-sm max-w-none mb-6 whitespace-pre-wrap text-gray-700 leading-relaxed">
                          {response.response}
                        </div>

                        {/* Stats */}
                        <div className="border-t-2 border-gray-100 pt-4 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 text-sm font-medium">Входных токенов</span>
                            <span className="font-bold text-gray-900">{response.input_tokens.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 text-sm font-medium">Выходных токенов</span>
                            <span className="font-bold text-gray-900">{response.output_tokens.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg border border-green-200 mt-4">
                            <span className="text-green-700 font-bold text-sm">Стоимость</span>
                            <span className="font-bold text-green-600 text-lg">${response.cost.toFixed(4)}</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12">
            <div className="flex flex-col items-center justify-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-blue-600"></div>
                <div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
              </div>
              <p className="text-gray-900 font-bold text-lg mt-6">Получаю ответы от {selectedModels.length} моделей</p>
              <p className="text-sm text-gray-500 mt-2">Параллельная обработка запросов...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
