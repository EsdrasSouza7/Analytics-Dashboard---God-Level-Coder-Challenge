import { useState } from 'react';
import { Truck, MapPin, Clock, TrendingUp, ChevronDown, ChevronUp, GripVertical, Star } from 'lucide-react';
import { useFetchWithCache } from '../hooks/useFetchWithCache';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, ScatterChart, Scatter, ZAxis } from 'recharts';
import { useEffect } from 'react';

export function DeliveryMetrics({ filters, isMinimized, onMinimize, dragHandleProps }) {
  const [activeTab, setActiveTab] = useState('overview');

  const shouldFetchOverview = activeTab === 'overview' && !isMinimized;
  const shouldFetchRegions = activeTab === 'regions' && !isMinimized;
  const shouldFetchPlatforms = activeTab === 'platforms' && !isMinimized;
  const shouldFetchTiming = activeTab === 'timing' && !isMinimized;

  const { data: overviewData, loading: overviewLoading } = useFetchWithCache(
    shouldFetchOverview 
      ? `http://localhost:3001/api/delivery-overview?${new URLSearchParams(filters)}`
      : null,
    [filters, shouldFetchOverview]
  );

  const { data: regionsData, loading: regionsLoading } = useFetchWithCache(
    shouldFetchRegions
      ? `http://localhost:3001/api/delivery-regions?${new URLSearchParams(filters)}`
      : null,
    [filters, shouldFetchRegions]
  );

  const { data: platformsData, loading: platformsLoading } = useFetchWithCache(
    shouldFetchPlatforms
      ? `http://localhost:3001/api/delivery-platforms?${new URLSearchParams(filters)}`
      : null,
    [filters, shouldFetchPlatforms]
  );

  const { data: timingData, loading: timingLoading } = useFetchWithCache(
    shouldFetchTiming
      ? `http://localhost:3001/api/delivery-timing?${new URLSearchParams(filters)}`
      : null,
    [filters, shouldFetchTiming]
  );

  const loading = overviewLoading || regionsLoading || platformsLoading || timingLoading;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatTime = (seconds) => {
    if (!seconds) return '0min';
    const minutes = Math.floor(seconds / 60);
    return `${minutes}min`;
  };

  const formatPercent = (value) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getPerformanceColor = (avgTime) => {
    if (avgTime < 1800) return 'text-green-600 bg-green-50'; // < 30min
    if (avgTime < 2700) return 'text-yellow-600 bg-yellow-50'; // < 45min
    return 'text-red-600 bg-red-50'; // > 45min
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

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
                <Truck size={20} className="text-blue-600" />
                Delivery Performance
              </h3>
              {!isMinimized && overviewData && (
                <p className="text-sm text-gray-500 mt-1">
                  {overviewData.total_deliveries?.toLocaleString('pt-BR')} entregas • Tempo médio: {formatTime(overviewData.avg_delivery_time)}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isMinimized && (
              <div className="flex border rounded-lg overflow-hidden">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-3 py-1.5 text-sm transition-colors ${
                    activeTab === 'overview' ? 'bg-blue-100 text-blue-600' : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Visão Geral
                </button>
                <button
                  onClick={() => setActiveTab('regions')}
                  className={`px-3 py-1.5 text-sm border-x transition-colors ${
                    activeTab === 'regions' ? 'bg-blue-100 text-blue-600' : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Por Região
                </button>
                <button
                  onClick={() => setActiveTab('platforms')}
                  className={`px-3 py-1.5 text-sm transition-colors ${
                    activeTab === 'platforms' ? 'bg-blue-100 text-blue-600' : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Plataformas
                </button>
                <button
                  onClick={() => setActiveTab('timing')}
                  className={`px-3 py-1.5 text-sm border-l transition-colors ${
                    activeTab === 'timing' ? 'bg-blue-100 text-blue-600' : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Análise Temporal
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

      {/* Content */}
      {!isMinimized && (
        <div className="p-6">
          {loading ? (
            <div className="h-96 flex items-center justify-center">
              <div className="animate-pulse text-gray-400">Analisando dados de delivery...</div>
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && overviewData && (
                <div className="space-y-6">
                  {/* KPI Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="border rounded-lg p-4 bg-gradient-to-br from-blue-50 to-white">
                      <div className="flex items-center gap-2 mb-2">
                        <Truck size={18} className="text-blue-600" />
                        <span className="text-sm font-medium text-gray-600">Total Entregas</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        {overviewData.total_deliveries?.toLocaleString('pt-BR')}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatPercent(overviewData.delivery_rate)} do total de pedidos
                      </p>
                    </div>

                    <div className="border rounded-lg p-4 bg-gradient-to-br from-green-50 to-white">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock size={18} className="text-green-600" />
                        <span className="text-sm font-medium text-gray-600">Tempo Médio</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatTime(overviewData.avg_delivery_time)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Produção: {formatTime(overviewData.avg_production_time)}
                      </p>
                    </div>

                    <div className="border rounded-lg p-4 bg-gradient-to-br from-purple-50 to-white">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp size={18} className="text-purple-600" />
                        <span className="text-sm font-medium text-gray-600">Taxa de Entrega</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatPercent(overviewData.success_rate)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {overviewData.delivered_count} entregues
                      </p>
                    </div>

                    <div className="border rounded-lg p-4 bg-gradient-to-br from-yellow-50 to-white">
                      <div className="flex items-center gap-2 mb-2">
                        <Star size={18} className="text-yellow-600" />
                        <span className="text-sm font-medium text-gray-600">Taxa da Entrega</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(overviewData.avg_delivery_fee)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Total: {formatCurrency(overviewData.total_delivery_fees)}
                      </p>
                    </div>
                  </div>
                  

                  {/* Distribuição por Status e Tipo */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-4">Status das Entregas</h4>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={overviewData.status_distribution || []}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ status, percent }) => `${status} (${(percent * 100).toFixed(0)}%)`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="count"
                          >
                            {(overviewData.status_distribution || []).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-4">Tipos de Entrega</h4>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={overviewData.delivery_types || []}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="type" fontSize={12} />
                          <YAxis fontSize={12} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Entregas" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* Regions Tab */}
              {activeTab === 'regions' && regionsData && (
                <div className="space-y-6">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                      <MapPin size={18} className="text-blue-600" />
                      Performance por Região
                    </h4>
                    <div className="space-y-3">
                      {regionsData.map((region, index) => (
                        <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h5 className="font-semibold text-gray-900">{region.neighborhood || region.city || 'Região Desconhecida'}</h5>
                              <p className="text-sm text-gray-500">{region.city} - {region.state}</p>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getPerformanceColor(region.avg_delivery_time)}`}>
                              {formatTime(region.avg_delivery_time)}
                            </div>
                          </div>

                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <div className="text-gray-500 text-xs">Entregas</div>
                              <div className="font-semibold">{region.total_deliveries}</div>
                            </div>
                            <div>
                              <div className="text-gray-500 text-xs">Taxa Entrega</div>
                              <div className="font-semibold">{formatCurrency(region.avg_delivery_fee)}</div>
                            </div>
                            <div>
                              <div className="text-gray-500 text-xs">Produção</div>
                              <div className="font-semibold">{formatTime(region.avg_production_time)}</div>
                            </div>
                            <div>
                              <div className="text-gray-500 text-xs">Distância Média</div>
                              <div className="font-semibold">{region.avg_distance?.toFixed(1) || 0} km</div>
                            </div>
                          </div>

                          {/* Barra de Performance */}
                          <div className="mt-3 pt-3 border-t">
                            <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                              <span>Eficiência de Entrega</span>
                              <span className="ml-auto font-semibold">{region.efficiency_score}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all ${
                                  region.efficiency_score >= 80 ? 'bg-green-500' :
                                  region.efficiency_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${region.efficiency_score}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mapa de Calor de Tempo de Entrega */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-4">Tempo de Entrega por Região</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={regionsData.slice(0, 10)} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis type="number" fontSize={12} />
                        <YAxis 
                          type="category" 
                          dataKey="neighborhood" 
                          fontSize={11} 
                          width={100}
                        />
                        <Tooltip 
                          formatter={(value) => [formatTime(value), 'Tempo de Entrega']}
                        />
                        <Bar dataKey="avg_delivery_time" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Platforms Tab */}
              {activeTab === 'platforms' && platformsData && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {platformsData.map((platform, index) => (
                      <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-semibold text-gray-900">{platform.platform_name || 'Plataforma Desconhecida'}</h5>
                          <div className={`px-2 py-1 rounded text-xs font-semibold ${getPerformanceColor(platform.avg_delivery_time)}`}>
                            {formatTime(platform.avg_delivery_time)}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                          <div>
                            <div className="text-gray-500 text-xs">Pedidos</div>
                            <div className="font-semibold text-lg">{platform.total_orders}</div>
                          </div>
                          <div>
                            <div className="text-gray-500 text-xs">Receita</div>
                            <div className="font-semibold text-lg text-green-600">
                              {formatCurrency(platform.total_revenue)}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 text-xs border-t pt-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Ticket Médio:</span>
                            <span className="font-medium">{formatCurrency(platform.avg_ticket)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Taxa Delivery:</span>
                            <span className="font-medium">{formatCurrency(platform.avg_delivery_fee)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Taxa Entregador:</span>
                            <span className="font-medium">{formatCurrency(platform.avg_courier_fee)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Produção:</span>
                            <span className="font-medium">{formatTime(platform.avg_production_time)}</span>
                          </div>
                        </div>

                        {/* Participação de Mercado */}
                        <div className="mt-3 pt-3 border-t">
                          <div className="text-xs text-gray-500">
                            {formatPercent(platform.market_share)} do mercado
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Comparação de Plataformas */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-4">Comparação de Performance</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={platformsData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="platform_name" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip />
                        <Bar dataKey="total_orders" fill="#3B82F6" name="Pedidos" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="avg_delivery_time" fill="#10B981" name="Tempo (s)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Timing Tab */}
              {activeTab === 'timing' && timingData && (
                <div className="space-y-6">
                  {/* Evolução ao Longo do Tempo */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-4">Evolução do Tempo de Entrega</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={timingData.timeline || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip formatter={(value) => [formatTime(value), 'Tempo']} />
                        <Line 
                          type="monotone" 
                          dataKey="avg_delivery_time" 
                          stroke="#3B82F6" 
                          strokeWidth={2}
                          dot={{ fill: '#3B82F6', r: 4 }}
                          name="Tempo de Entrega"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="avg_production_time" 
                          stroke="#10B981" 
                          strokeWidth={2}
                          dot={{ fill: '#10B981', r: 4 }}
                          name="Tempo de Produção"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Performance por Hora do Dia */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-4">Performance por Hora do Dia</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={timingData.hourly || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="hour" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip formatter={(value) => [formatTime(value), 'Tempo Médio']} />
                        <Bar dataKey="avg_time" fill="#6366F1" radius={[4, 4, 0, 0]} name="Tempo Médio" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Minimized State */}
      {isMinimized && (
        <div className="px-4 py-3 bg-gray-50 border-t">
          <p className="text-sm text-gray-500">Clique em expandir para ver métricas de delivery</p>
        </div>
      )}
    </div>
  );
}

export default DeliveryMetrics;