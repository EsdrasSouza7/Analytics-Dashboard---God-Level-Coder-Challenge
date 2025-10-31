import { useEffect, useState } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ChevronDown, ChevronUp, GripVertical, TrendingUp, Calendar, BarChart3, LineChart as LineChartIcon, AreaChart as AreaChartIcon } from 'lucide-react';
import { useFetchWithCache } from '../hooks/useFetchWithCache';
  
export function RevenueChart({ filters, onMinimize, isMinimized = false, dragHandleProps }) {
  const params = new URLSearchParams();
  const [chartType, setChartType] = useState('line'); // line, area, bar
  const [viewMode, setViewMode] = useState('revenue'); // revenue, orders, both

  if (filters.period) params.append('period', filters.period);
  if (filters.channel && filters.channel !== 'todos') params.append('channel', filters.channel);
  if (filters.channelType && filters.channelType !== 'todos') params.append('channelType', filters.channelType);
  if (filters.store && filters.store !== 'todas') params.append('store', filters.store);
  if (filters.subBrand && filters.subBrand !== 'todas') params.append('subBrand', filters.subBrand);

  const { data, loading, error } = useFetchWithCache(
    `http://localhost:3001/api/revenue-timeline?${params.toString()}`,
    [filters]
  );

  // Loading skeleton melhorado
  if (loading && !data) {
    return (
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>
        <div className="p-6">
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Carregando dados...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  // Calcular estatísticas
  const stats = data.length > 0 ? {
    total: data.reduce((sum, d) => sum + d.value, 0),
    average: data.reduce((sum, d) => sum + d.value, 0) / data.length,
    max: Math.max(...data.map(d => d.value)),
    min: Math.min(...data.map(d => d.value)),
    totalOrders: data.reduce((sum, d) => sum + (d.pedidos || 0), 0)
  } : null;

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-gray-900 mb-2">
          {payload[0].payload.date}
        </p>
        {viewMode === 'both' || viewMode === 'revenue' ? (
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-blue-600"></div>
            <span className="text-sm text-gray-600">Receita:</span>
            <span className="text-sm font-semibold text-gray-900">
              {formatCurrency(payload[0].value)}
            </span>
          </div>
        ) : null}
        {viewMode === 'both' || viewMode === 'orders' ? (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-600"></div>
            <span className="text-sm text-gray-600">Pedidos:</span>
            <span className="text-sm font-semibold text-gray-900">
              {formatNumber(payload[0].payload.pedidos)}
            </span>
          </div>
        ) : null}
      </div>
    );
  };

  const renderChart = () => {
    const commonProps = {
      data: data,
      margin: { top: 10, right: 30, left: 0, bottom: 0 }
    };

    const chartConfig = (
      <>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey="date" 
          fontSize={12}
          stroke="#9ca3af"
        />
        <YAxis 
          fontSize={12}
          stroke="#9ca3af"
          tickFormatter={(value) => {
            if (viewMode === 'orders') return formatNumber(value);
            return value >= 1000 ? `${(value/1000).toFixed(0)}k` : value;
          }}
        />
        <Tooltip content={<CustomTooltip />} />
        {viewMode === 'both' && <Legend />}
      </>
    );

    switch (chartType) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            {chartConfig}
            {(viewMode === 'both' || viewMode === 'revenue') && (
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#3B82F6" 
                fill="#3B82F6" 
                fillOpacity={0.2}
                strokeWidth={2}
                name="Receita"
              />
            )}
            {(viewMode === 'both' || viewMode === 'orders') && (
              <Area 
                type="monotone" 
                dataKey="pedidos" 
                stroke="#10B981" 
                fill="#10B981" 
                fillOpacity={0.2}
                strokeWidth={2}
                name="Pedidos"
              />
            )}
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            {chartConfig}
            {(viewMode === 'both' || viewMode === 'revenue') && (
              <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Receita" />
            )}
            {(viewMode === 'both' || viewMode === 'orders') && (
              <Bar dataKey="pedidos" fill="#10B981" radius={[4, 4, 0, 0]} name="Pedidos" />
            )}
          </BarChart>
        );

      default: // line
        return (
          <LineChart {...commonProps}>
            {chartConfig}
            {(viewMode === 'both' || viewMode === 'revenue') && (
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#3B82F6" 
                strokeWidth={3}
                dot={{ fill: '#3B82F6', r: 4 }}
                activeDot={{ r: 6 }}
                name="Receita"
              />
            )}
            {(viewMode === 'both' || viewMode === 'orders') && (
              <Line 
                type="monotone" 
                dataKey="pedidos" 
                stroke="#10B981" 
                strokeWidth={3}
                dot={{ fill: '#10B981', r: 4 }}
                activeDot={{ r: 6 }}
                name="Pedidos"
              />
            )}
          </LineChart>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Drag Handle */}
            <div 
              {...dragHandleProps}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 rounded transition-colors"
              title="Arraste para reordenar"
            >
              <GripVertical size={20} className="text-gray-400" />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp size={20} className="text-blue-600" />
                {viewMode === 'orders' ? 'Pedidos ao Longo do Tempo' : 'Receita ao Longo do Tempo'}
              </h3>
              {!isMinimized && stats && (
                <p className="text-sm text-gray-500 mt-1">
                  Total: {viewMode === 'orders' ? formatNumber(stats.totalOrders) : formatCurrency(stats.total)} • 
                  Média: {viewMode === 'orders' ? formatNumber(Math.round(stats.totalOrders / data.length)) : formatCurrency(stats.average)}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Controles do Gráfico */}
            {!isMinimized && (
              <>
                {/* View Mode */}
                <select
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value)}
                  className="px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="revenue">Receita</option>
                  <option value="orders">Pedidos</option>
                  <option value="both">Ambos</option>
                </select>

                {/* Chart Type */}
                <div className="flex border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setChartType('line')}
                    className={`p-2 transition-colors ${chartType === 'line' ? 'bg-blue-100 text-blue-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    title="Gráfico de Linha"
                  >
                    <LineChartIcon size={18} />
                  </button>
                  <button
                    onClick={() => setChartType('area')}
                    className={`p-2 border-x transition-colors ${chartType === 'area' ? 'bg-blue-100 text-blue-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    title="Gráfico de Área"
                  >
                    <AreaChartIcon size={18} />
                  </button>
                  <button
                    onClick={() => setChartType('bar')}
                    className={`p-2 transition-colors ${chartType === 'bar' ? 'bg-blue-100 text-blue-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    title="Gráfico de Barras"
                  >
                    <BarChart3 size={18} />
                  </button>
                </div>
              </>
            )}

            {/* Minimize Button */}
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

      {/* Content */}
      {!isMinimized && (
        <div className="p-6">
          {loading ? (
            <div className="h-80 flex items-center justify-center">
              <div className="animate-pulse space-y-4 w-full">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          ) : error ? (
            <div className="h-80 flex items-center justify-center">
              <div className="text-center">
                <p className="text-red-600 font-medium">Erro ao carregar gráfico</p>
                <p className="text-red-500 text-sm mt-1">{error}</p>
              </div>
            </div>
          ) : data.length === 0 ? (
            <div className="h-80 flex items-center justify-center">
              <div className="text-center">
                <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600 font-medium">Nenhum dado encontrado</p>
                <p className="text-gray-500 text-sm mt-1">
                  Tente ajustar os filtros para ver resultados
                </p>
              </div>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={320}>
                {renderChart()}
              </ResponsiveContainer>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6 pt-6 border-t">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Maior Valor</p>
                  <p className="font-semibold text-gray-900">
                    {viewMode === 'orders' ? formatNumber(stats.max) : formatCurrency(stats.max)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Menor Valor</p>
                  <p className="font-semibold text-gray-900">
                    {viewMode === 'orders' ? formatNumber(stats.min) : formatCurrency(stats.min)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Média Diária</p>
                  <p className="font-semibold text-gray-900">
                    {viewMode === 'orders' ? formatNumber(Math.round(stats.totalOrders / data.length)) : formatCurrency(stats.average)}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Minimized State */}
      {isMinimized && (
        <div className="px-4 py-3 bg-gray-50 border-t">
          <p className="text-sm text-gray-500">Clique em expandir para ver o gráfico</p>
        </div>
      )}
    </div>
  );
}

export default RevenueChart;