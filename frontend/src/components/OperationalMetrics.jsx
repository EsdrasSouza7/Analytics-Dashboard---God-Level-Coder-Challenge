// components/OperationalMetrics.jsx
import { useState } from 'react';
import { Clock, XCircle, TrendingUp, Utensils, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { useFetchWithCache } from '../hooks/useFetchWithCache';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export function OperationalMetrics({ filters, onMinimize, isMinimized = false, dragHandleProps }) {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Buscar métricas operacionais
  const { data: metrics, loading: metricsLoading } = useFetchWithCache(
    `http://localhost:3001/api/operational-metrics?${new URLSearchParams(filters)}`,
    [filters]
  );

  // Buscar dados por horário
  const { data: timeData, loading: timeLoading } = useFetchWithCache(
    `http://localhost:3001/api/operational-by-hour?${new URLSearchParams(filters)}`,
    [filters]
  );

  // Buscar cancelamentos
  const { data: cancellationData, loading: cancellationLoading } = useFetchWithCache(
    `http://localhost:3001/api/cancellation-metrics?${new URLSearchParams(filters)}`,
    [filters]
  );

  const formatTime = (seconds) => {
    if (!seconds) return '0min';
    const minutes = Math.floor(seconds / 60);
    return `${minutes}min`;
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('pt-BR').format(value || 0);
  };

  const formatPercent = (value) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  // Agrupar dados por turno
  const getShiftData = () => {
    if (!timeData) return [];
    
    const shifts = {
      manha: { start: 6, end: 12, label: 'Manhã (6h-12h)' },
      tarde: { start: 12, end: 18, label: 'Tarde (12h-18h)' },
      noite: { start: 18, end: 24, label: 'Noite (18h-24h)' },
      madrugada: { start: 0, end: 6, label: 'Madrugada (0h-6h)' }
    };

    return Object.entries(shifts).map(([key, shift]) => {
      const shiftData = timeData.filter(d => d.hora >= shift.start && d.hora < shift.end);
      
      return {
        turno: shift.label,
        tempoMedioPreparo: shiftData.reduce((sum, d) => sum + (d.tempo_medio_producao || 0), 0) / (shiftData.length || 1),
        totalPedidos: shiftData.reduce((sum, d) => sum + (d.total_pedidos || 0), 0),
        eficiencia: shiftData.length > 0 ?
            shiftData.reduce((sum, d) => {
                const tempoIdeal = 1200; // 20 minutos
                const tempoAtual = d.tempo_medio_producao || tempoIdeal;
                
                // Eficiência decresce mais rápido quando ultrapassa muito o ideal
                let eficienciaTurno;
                if (tempoAtual <= tempoIdeal) {
                eficienciaTurno = 100; // Perfeito ou melhor
                } else {
                eficienciaTurno = Math.max(0, 100 - ((tempoAtual - tempoIdeal) / tempoIdeal) * 100);
                }
                
                return sum + eficienciaTurno;
            }, 0) / shiftData.length : 0
      };
    });
  };

  const loading = metricsLoading || timeLoading || cancellationLoading;
  const shiftData = getShiftData();

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
                <TrendingUp size={20} className="text-green-600" />
                Operational Efficiency
              </h3>
              {!isMinimized && metrics && (
                <p className="text-sm text-gray-500 mt-1">
                  Tempo médio: {formatTime(metrics.tempo_medio_producao)} • Cancelamentos: {formatPercent(metrics.taxa_cancelamento)}
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
                    activeTab === 'overview' ? 'bg-green-100 text-green-600' : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Visão Geral
                </button>
                <button
                  onClick={() => setActiveTab('shifts')}
                  className={`px-3 py-1.5 text-sm border-x transition-colors ${
                    activeTab === 'shifts' ? 'bg-green-100 text-green-600' : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Turnos
                </button>
                <button
                  onClick={() => setActiveTab('cancellations')}
                  className={`px-3 py-1.5 text-sm transition-colors ${
                    activeTab === 'cancellations' ? 'bg-green-100 text-green-600' : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Cancelamentos
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
              <div className="animate-pulse text-gray-400">Carregando métricas operacionais...</div>
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && metrics && (
                <div className="space-y-6">
                  {/* KPI Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock size={18} className="text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">Tempo Preparo</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-900">
                        {formatTime(metrics.tempo_medio_producao)}
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        {formatTime(metrics.tempo_medio_entrega)} entrega
                      </div>
                    </div>

                    <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                      <div className="flex items-center gap-2 mb-2">
                        <XCircle size={18} className="text-red-600" />
                        <span className="text-sm font-medium text-red-700">Taxa Cancelamento</span>
                      </div>
                      <div className="text-2xl font-bold text-red-900">
                        {formatPercent(metrics.taxa_cancelamento)}
                      </div>
                      <div className="text-xs text-red-600 mt-1">
                        {formatNumber(metrics.total_cancelamentos)} pedidos
                      </div>
                    </div>

                    <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Utensils size={18} className="text-green-600" />
                        <span className="text-sm font-medium text-green-700">Produtividade</span>
                      </div>
                      <div className="text-2xl font-bold text-green-900">
                        {formatNumber(metrics.pedidos_por_hora)}
                      </div>
                      <div className="text-xs text-green-600 mt-1">pedidos/hora</div>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp size={18} className="text-purple-600" />
                        <span className="text-sm font-medium text-purple-700">Eficiência</span>
                      </div>
                      <div className="text-2xl font-bold text-purple-900">
                        {formatPercent(metrics.eficiencia_geral)}
                      </div>
                      <div className="text-xs text-purple-600 mt-1">meta: 85%</div>
                    </div>
                  </div>

                  {/* Gráfico de Tempo por Horário */}
                  {timeData && (
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-4">Tempo de Preparo por Horário</h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={timeData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis 
                            dataKey="hora" 
                            fontSize={12}
                            label={{ value: 'Horário', position: 'insideBottom', offset: -5 }}
                          />
                          <YAxis 
                            fontSize={12}
                            label={{ value: 'Minutos', angle: -90, position: 'insideLeft' }}
                          />
                          <Tooltip 
                            formatter={(value) => [`${Math.round(value/60)}min`, 'Tempo Médio']}
                            labelFormatter={(label) => `${label}h`}
                          />
                          <Bar 
                            dataKey="tempo_medio_producao" 
                            fill="#3B82F6" 
                            radius={[4, 4, 0, 0]}
                            name="Tempo Preparo"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              )}

              {/* Shifts Tab */}
              {activeTab === 'shifts' && shiftData.length > 0 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-4">Desempenho por Turno</h4>
                      <div className="space-y-4">
                        {shiftData.map((shift, index) => (
                          <div key={index} className="border rounded-lg p-3 hover:bg-gray-50">
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-medium text-sm">{shift.turno}</span>
                              <div className="text-right">
                                <span className="font-semibold">{formatNumber(shift.totalPedidos)}</span>
                                <div className="text-xs text-gray-500">pedidos</div>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-gray-500">Tempo Médio:</span>
                                <div className="font-medium">{formatTime(shift.tempoMedioPreparo)}</div>
                              </div>
                              <div>
                                <span className="text-gray-500">Eficiência:</span>
                                <div className="font-medium">{shift.eficiencia.toFixed(1)}/100</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-4">Comparação de Turnos</h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={shiftData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="turno" fontSize={12} angle={-45} textAnchor="end" height={80} />
                          <YAxis fontSize={12} />
                          <Tooltip />
                          <Bar dataKey="totalPedidos" fill="#10B981" radius={[4, 4, 0, 0]} name="Pedidos" />
                          <Bar dataKey="eficiencia" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Eficiência" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Análise de Performance */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-4">Recomendações por Turno</h4>
                    <div className="space-y-3">
                      {shiftData.map((shift, index) => {
                        const recommendations = [];
                        
                        if (shift.tempoMedioPreparo > 1200) { // > 25 minutos //DEBUG Colocar em 1800 depois
                          recommendations.push('⏰ Otimizar tempo de preparo DEBUG: APENAS PARA MOSTRAR.');
                        }
                        if (shift.eficiencia < 100) { //DEBUG Colocar em 50 depois
                          recommendations.push('📊 Revisar alocação de equipe DEBUG: ESSAS RECOMENDAÇÔES SÂO AUTOMATICAS');
                        }
                        if (shift.totalPedidos != 0) { //DEBUG Colocar em '=== 0' depois
                          recommendations.push('🎯 Criar promoções para este horário DEBUG: COM BASE EM METRICAS');
                        }

                        return recommendations.length > 0 ? (
                          <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <h5 className="font-medium text-yellow-800 mb-1">{shift.turno}</h5>
                            <ul className="text-sm text-yellow-700 list-disc list-inside">
                              {recommendations.map((rec, i) => (
                                <li key={i}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        ) : (
                          <div key={index} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <h5 className="font-medium text-green-800">{shift.turno}</h5>
                            <p className="text-sm text-green-700">Performance dentro do esperado ✅</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Cancellations Tab */}
              {activeTab === 'cancellations' && cancellationData && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-4">Análise de Cancelamentos</h4>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                          <span className="text-red-700 font-medium">Taxa Geral</span>
                          <span className="text-red-900 font-bold text-lg">
                            {formatPercent(cancellationData.taxa_cancelamento_geral)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 border rounded-lg">
                            <div className="text-2xl font-bold text-gray-900">
                              {formatNumber(cancellationData.total_cancelamentos)}
                            </div>
                            <div className="text-sm text-gray-600">Total Cancelado</div>
                          </div>
                          
                          <div className="text-center p-3 border rounded-lg">
                            <div className="text-2xl font-bold text-gray-900">
                              {formatNumber(cancellationData.total_pedidos)}
                            </div>
                            <div className="text-sm text-gray-600">Total Pedidos</div>
                          </div>
                        </div>

                        {cancellationData.cancelamentos_por_motivo && (
                          <div className="mt-4">
                            <h5 className="font-medium text-gray-700 mb-2">Principais Motivos</h5>
                            <div className="space-y-2">
                              {cancellationData.cancelamentos_por_motivo.slice(0, 5).map((motivo, index) => (
                                <div key={index} className="flex justify-between text-sm">
                                  <span className="text-gray-600">{motivo.motivo || 'Sem motivo'}</span>
                                  <span className="font-medium">{motivo.quantidade}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-4">Cancelamentos por Horário</h4>
                      {cancellationData.cancelamentos_por_hora && (
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={cancellationData.cancelamentos_por_hora}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="hora" fontSize={12} />
                            <YAxis fontSize={12} />
                            <Tooltip />
                            <Line 
                              type="monotone" 
                              dataKey="taxa_cancelamento" 
                              stroke="#EF4444" 
                              strokeWidth={2}
                              name="Taxa Cancelamento"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </div>
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
          <p className="text-sm text-gray-500">Clique em expandir para ver métricas operacionais</p>
        </div>
      )}
    </div>
  );
}

export default OperationalMetrics;