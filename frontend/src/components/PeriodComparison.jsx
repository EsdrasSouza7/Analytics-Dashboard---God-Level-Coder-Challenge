import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Target, Calendar, ArrowRight, ChevronDown, ChevronUp, GripVertical } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

export function PeriodComparison({ filters, isMinimized, onMinimize, dragHandleProps }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('comparison'); // comparison, weekly, goals, trends

  useEffect(() => {
    fetchComparisonData();
  }, [filters]);

  const fetchComparisonData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(filters);
      const response = await fetch(`http://localhost:3001/api/period-comparison?${params}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Erro ao buscar comparação:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercent = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getTrendIcon = (value) => {
    if (value > 0) return <TrendingUp className="text-green-500" size={20} />;
    if (value < 0) return <TrendingDown className="text-red-500" size={20} />;
    return <Minus className="text-gray-400" size={20} />;
  };

  const getTrendColor = (value) => {
    if (value > 0) return 'text-green-600 bg-green-50';
    if (value < 0) return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
            <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 rounded transition-colors">
                <GripVertical size={20} className="text-gray-400" />
            </div>

            <div>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Calendar size={20} className="text-purple-600" />
                Análise Comparativa
                </h3>
                {!isMinimized && data && (
                <p className="text-sm text-gray-500 mt-1">
                    Período atual vs anterior • {formatPercent(data.comparison.revenue.percentChange)} de variação
                </p>
                )}
            </div>
            </div>

            <div className="flex items-center gap-2">
            {!isMinimized && (
                <div className="flex border rounded-lg overflow-hidden">
                <button
                    onClick={() => setActiveTab('comparison')}
                    className={`px-3 py-1.5 text-sm transition-colors ${
                    activeTab === 'comparison' ? 'bg-purple-100 text-purple-600' : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                >
                    Comparação
                </button>
                <button
                    onClick={() => setActiveTab('weekly')}
                    className={`px-3 py-1.5 text-sm border-x transition-colors ${
                    activeTab === 'weekly' ? 'bg-purple-100 text-purple-600' : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                >
                    Evolução Semanal
                </button>
                <button
                    onClick={() => setActiveTab('goals')}
                    className={`px-3 py-1.5 text-sm transition-colors ${
                    activeTab === 'goals' ? 'bg-purple-100 text-purple-600' : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                >
                    Metas
                </button>
                <button
                    onClick={() => setActiveTab('trends')}
                    className={`px-3 py-1.5 text-sm border-l transition-colors ${
                    activeTab === 'trends' ? 'bg-purple-100 text-purple-600' : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                >
                    Tendências
                </button>
                </div>
            )}

            <button
                onClick={onMinimize}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                title={isMinimized ? 'Expandir' : 'Minimizar'}
            >
                {isMinimized ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
            </button>
            </div>
        </div>
        </div>

      {!isMinimized && (
        <div className="p-6">
          {/* Tab: Comparação Período Anterior */}
          {activeTab === 'comparison' && (
            <div className="space-y-6">
              {/* Cards Comparativos */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Receita */}
                <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Receita Total</span>
                    {getTrendIcon(data.comparison.revenue.percentChange)}
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(data.comparison.revenue.current)}
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500">Anterior:</span>
                      <span className="font-medium">{formatCurrency(data.comparison.revenue.previous)}</span>
                    </div>
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${getTrendColor(data.comparison.revenue.percentChange)}`}>
                      {formatPercent(data.comparison.revenue.percentChange)}
                    </div>
                  </div>
                </div>

                {/* Pedidos */}
                <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Total de Pedidos</span>
                    {getTrendIcon(data.comparison.orders.percentChange)}
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-gray-900">
                      {data.comparison.orders.current.toLocaleString('pt-BR')}
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500">Anterior:</span>
                      <span className="font-medium">{data.comparison.orders.previous.toLocaleString('pt-BR')}</span>
                    </div>
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${getTrendColor(data.comparison.orders.percentChange)}`}>
                      {formatPercent(data.comparison.orders.percentChange)}
                    </div>
                  </div>
                </div>

                {/* Ticket Médio */}
                <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Ticket Médio</span>
                    {getTrendIcon(data.comparison.avgTicket.percentChange)}
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(data.comparison.avgTicket.current)}
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500">Anterior:</span>
                      <span className="font-medium">{formatCurrency(data.comparison.avgTicket.previous)}</span>
                    </div>
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${getTrendColor(data.comparison.avgTicket.percentChange)}`}>
                      {formatPercent(data.comparison.avgTicket.percentChange)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Gráfico de Comparação Diária */}
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Comparação Dia a Dia</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data.dailyComparison}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="previous" 
                      name="Período Anterior"
                      stroke="#94a3b8" 
                      fill="#e2e8f0" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="current" 
                      name="Período Atual"
                      stroke="#8b5cf6" 
                      fill="#c4b5fd" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Tab: Evolução Semanal */}
          {activeTab === 'weekly' && (
            <div className="space-y-6">
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Evolução Semana a Semana</h3>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={data.weeklyEvolution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="revenue" name="Receita" fill="#8b5cf6" />
                    <Bar dataKey="orders" name="Pedidos (x100)" fill="#06b6d4" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Resumo Semanal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Melhor Semana</h4>
                  <div className="space-y-2">
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(data.weeklyStats.best.revenue)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {data.weeklyStats.best.week} • {data.weeklyStats.best.orders} pedidos
                    </p>
                  </div>
                </div>
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Crescimento Médio Semanal</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold text-purple-600">
                        {formatPercent(data.weeklyStats.avgGrowth)}
                      </p>
                      {getTrendIcon(data.weeklyStats.avgGrowth)}
                    </div>
                    <p className="text-sm text-gray-600">
                      Tendência {data.weeklyStats.avgGrowth > 0 ? 'positiva' : 'negativa'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Metas */}
          {activeTab === 'goals' && (
            <div className="space-y-6">
              {data.goals.map((goal, idx) => (
                <div key={idx} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Target size={20} className="text-purple-600" />
                      <h4 className="font-semibold">{goal.name}</h4>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      goal.achieved >= 100 
                        ? 'bg-green-100 text-green-700'
                        : goal.achieved >= 75
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {goal.achieved.toFixed(0)}% da meta
                    </div>
                  </div>
                  
                  {/* Barra de Progresso */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">Realizado</span>
                      <span className="font-medium">{formatCurrency(goal.current)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          goal.achieved >= 100 
                            ? 'bg-green-500'
                            : goal.achieved >= 75
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(goal.achieved, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-gray-600">Meta</span>
                      <span className="font-medium">{formatCurrency(goal.target)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>Faltam: {formatCurrency(Math.max(0, goal.target - goal.current))}</span>
                    <span>•</span>
                    <span>{goal.daysLeft} dias restantes</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab: Tendências */}
          {activeTab === 'trends' && (
            <div className="space-y-6">
              {/* Gráfico de Tendência */}
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Análise de Tendências</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="actual" 
                      name="Real"
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      dot={{ fill: '#8b5cf6', r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="trend" 
                      name="Linha de Tendência"
                      stroke="#06b6d4" 
                      strokeDasharray="5 5"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Cards de Insights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4 bg-gradient-to-br from-purple-50 to-white">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <TrendingUp className="text-purple-600" size={20} />
                    Projeção para Próximo Período
                  </h4>
                  <p className="text-2xl font-bold text-purple-600 mb-1">
                    {formatCurrency(data.trendAnalysis.projection)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Baseado na tendência atual
                  </p>
                </div>

                <div className="border rounded-lg p-4 bg-gradient-to-br from-cyan-50 to-white">
                  <h4 className="font-semibold mb-2">Taxa de Crescimento</h4>
                  <p className="text-2xl font-bold text-cyan-600 mb-1">
                    {formatPercent(data.trendAnalysis.growthRate)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Crescimento médio por período
                  </p>
                </div>
              </div>

              {/* Análise Detalhada */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-semibold mb-3">💡 Insights</h4>
                <ul className="space-y-2">
                  {data.trendAnalysis.insights.map((insight, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <ArrowRight className="text-purple-600 flex-shrink-0 mt-0.5" size={16} />
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
        )}
        {/* Minimized State */}
        {isMinimized && (
        <div className="px-4 py-3 bg-gray-50 border-t">
            <p className="text-sm text-gray-500">Clique em expandir para ver análise comparativa</p>
        </div>
        )}
    </div>
  );
}