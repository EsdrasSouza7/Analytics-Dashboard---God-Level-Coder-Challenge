import { useState } from 'react';
import { Sparkles, Send, Loader, CheckCircle, AlertCircle, Table, BarChart3, Download, ChevronDown, ChevronUp, GripVertical, Shield } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';


export function AIQueryBuilder({ filters, onMinimize, isMinimized = false, dragHandleProps }) {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // table, chart

  const suggestions = [
    "Mostre as vendas por canal nos últimos 30 dias",
    "Quais os 10 produtos mais vendidos este mês?",
    "Qual o ticket médio por loja?",
    "Mostre vendas por dia da semana",
    "Quantos clientes compraram mais de 3 vezes?",
    "Qual o tempo médio de entrega por canal?",
    "Mostre os métodos de pagamento mais usados",
    "Compare vendas de delivery vs presencial"
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('http://localhost:3001/api/ai-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: question.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar pergunta');
      }

      setResult(data);
      
      // Auto-detectar melhor visualização
      autoDetectVisualization(data.data);

    } catch (err) {
      console.error('Erro:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const autoDetectVisualization = (data) => {
    if (!data || data.length === 0) return;

    const keys = Object.keys(data[0]);
    const hasNumericValue = keys.some(k => typeof data[0][k] === 'number');
    
    if (hasNumericValue && data.length > 1) {
      setViewMode('chart');
    } else {
      setViewMode('table');
    }
  };

  const formatValue = (value) => {
    if (typeof value === 'number') {
      if (value > 1000) {
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(value);
      }
      return new Intl.NumberFormat('pt-BR').format(value);
    }
    return value;
  };

  const exportToCSV = () => {
    if (!result?.data) return;

    const headers = Object.keys(result.data[0]);
    const csvContent = [
      headers.join(','),
      ...result.data.map(row => 
        headers.map(h => row[h]).join(',')
      )
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai_query_${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const renderChart = () => {
    if (!result?.data || !Array.isArray(result.data) || result.data.length === 0) return null;

    const data = result.data;
    const keys = Object.keys(data[0]);
    const labelKey = keys[0];
    const valueKeys = keys.filter(k => typeof data[0][k] === 'number');

    if (valueKeys.length === 0) return null;

    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

    return (
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={labelKey} />
          <YAxis />
          <Tooltip formatter={(value) => formatValue(value)} />
          <Legend />
          {valueKeys.map((key, index) => (
            <Bar 
              key={key} 
              dataKey={key} 
              fill={COLORS[index % COLORS.length]} 
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              {...dragHandleProps}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-white/50 rounded transition-colors"
            >
              <GripVertical size={20} className="text-gray-400" />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Sparkles size={20} className="text-purple-600" />
                AI Query Builder (BETA)
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Pergunte o que quiser sobre seus dados / Função em <strong>BETA</strong> pode ocorrer erros ou limitações nos Dados
              </p>
            </div>
          </div>

          <button
            onClick={onMinimize}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            {isMinimized ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div className="p-6">
          {/* Input de Pergunta */}
          <form onSubmit={handleSubmit} className="mb-6">
            <div className="relative">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ex: Mostre as vendas por canal nos últimos 30 dias"
                className="w-full px-4 py-3 pr-12 border-2 border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !question.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? <Loader size={20} className="animate-spin" /> : <Send size={20} />}
              </button>
            </div>
          </form>
            <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
            <Shield size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
                <strong>Modo somente leitura:</strong> Você pode apenas consultar dados. 
                Não é possível modificar, criar ou deletar informações.
            </div>
            </div>

          {/* Sugestões */}
          {!result && !loading && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">💡 Sugestões:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => setQuestion(suggestion)}
                    className="text-left px-4 py-2 text-sm bg-gray-50 hover:bg-purple-50 border border-gray-200 hover:border-purple-300 rounded-lg transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader size={48} className="animate-spin text-purple-600 mb-4" />
              <p className="text-gray-600">Processando sua pergunta com IA...</p>
              <p className="text-sm text-gray-500 mt-1">Gerando SQL e consultando banco de dados</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                <h4 className="font-medium text-red-800">
                    {result?.error === 'Query bloqueada por segurança' 
                    ? '🔒 Query Bloqueada'
                    : 'Erro ao processar pergunta'
                    }
                </h4>
                <p className="text-red-600 text-sm mt-1">
                    {result?.message || error}
                </p>
                {result?.blockedKeyword && (
                    <p className="text-red-500 text-xs mt-2">
                    Palavra-chave bloqueada: <code className="bg-red-100 px-2 py-0.5 rounded">{result.blockedKeyword}</code>
                    </p>
                )}
                <p className="text-red-500 text-xs mt-2">
                    💡 Tente perguntas como: "Mostre as vendas...", "Quais os produtos...", "Compare..."
                </p>
                </div>
            </div>
            )}

          {/* Result */}
          {result && (
            <div className="space-y-4">
              {/* Success Header */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                <CheckCircle size={20} className="text-green-600" />
                <div className="flex-1">
                  <h4 className="font-medium text-green-800">Query executada com sucesso!</h4>
                  <p className="text-green-600 text-sm">{result.rowCount} resultado(s) encontrado(s)</p>
                </div>
              </div>

              {/* SQL Query */}
              <details className="bg-gray-50 border rounded-lg">
                <summary className="px-4 py-3 cursor-pointer hover:bg-gray-100 font-medium text-sm">
                  Ver SQL gerado pela IA
                </summary>
                <div className="px-4 py-3 border-t">
                  <pre className="text-xs bg-gray-900 text-green-400 p-3 rounded overflow-x-auto">
                    {result.sql}
                  </pre>
                </div>
              </details>

              {/* Controls */}
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      viewMode === 'table'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Table size={16} className="inline mr-2" />
                    Tabela
                  </button>
                  <button
                    onClick={() => setViewMode('chart')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      viewMode === 'chart'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <BarChart3 size={16} className="inline mr-2" />
                    Gráfico
                  </button>
                </div>

                <button
                  onClick={exportToCSV}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  <Download size={16} className="inline mr-2" />
                  Exportar CSV
                </button>
              </div>

                {/* Data Visualization */}
                {viewMode === 'table' && result?.data && result.data.length > 0 && (
                <div className="border rounded-lg overflow-x-auto">
                    <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                        {Object.keys(result.data[0]).map(key => (
                            <th key={key} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            {key}
                            </th>
                        ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {result.data.map((row, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                            {Object.values(row).map((value, i) => (
                            <td key={i} className="px-4 py-3 text-sm text-gray-900">
                                {formatValue(value)}
                            </td>
                            ))}
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
                )}

                {/* Mensagem para quando não há dados */}
                {viewMode === 'table' && result?.data && result.data.length === 0 && (
                <div className="border rounded-lg p-8 text-center text-gray-500">
                    Nenhum dado encontrado para exibir em tabela.
                </div>
                )}

              {viewMode === 'chart' && (
                <div className="border rounded-lg p-4">
                  {renderChart()}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Minimized */}
      {isMinimized && (
        <div className="px-4 py-3 bg-gray-50 border-t">
          <p className="text-sm text-gray-500">Faça perguntas sobre seus dados usando IA</p>
        </div>
      )}
    </div>
  );
}

export default AIQueryBuilder;