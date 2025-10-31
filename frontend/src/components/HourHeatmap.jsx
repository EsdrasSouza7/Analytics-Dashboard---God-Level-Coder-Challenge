import { useState } from 'react';
import { Clock, ChevronDown, ChevronUp, GripVertical, Sun, Moon } from 'lucide-react';
import { useFetchWithCache } from '../hooks/useFetchWithCache';
import { LoadingSpinner } from './LoadingSpinner';

export function HourHeatmap({ filters, onMinimize, isMinimized = false, dragHandleProps }) {
  const [metric, setMetric] = useState('pedidos'); // pedidos, receita
  const { data, loading, error } = useFetchWithCache(
    buildHeatmapUrl(filters),
    [filters]
  );

  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const horas = Array.from({ length: 24 }, (_, i) => i);

  // Função para construir a URL
  function buildHeatmapUrl(filters) {
    const params = new URLSearchParams();
    if (filters.period) params.append('period', filters.period);
    if (filters.channel && filters.channel !== 'todos') params.append('channel', filters.channel);
    if (filters.channelType && filters.channelType !== 'todos') params.append('channelType', filters.channelType);
    if (filters.store && filters.store !== 'todas') params.append('store', filters.store);
    if (filters.subBrand && filters.subBrand !== 'todas') params.append('subBrand', filters.subBrand);
    
    return `http://localhost:3001/api/sales-by-hour?${params.toString()}`;
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('pt-BR').format(value || 0);
  };

  // Obter valor para dia/hora específico
  const getValue = (dia, hora) => {
    const point = data?.find(d => d.diaSemana === diasSemana[dia] && d.hora === hora);
    return point ? (metric === 'pedidos' ? point.pedidos : point.receita) : 0;
  };

  // Calcular max para normalizar cores
  const maxValue = data?.length > 0 ? Math.max(...data.map(d => metric === 'pedidos' ? d.pedidos : d.receita), 1) : 1;

  // Gerar cor baseada no valor (heatmap)
  const getColor = (value) => {
    if (value === 0) return 'bg-gray-50';
    const intensity = (value / maxValue);
    
    if (intensity < 0.2) return 'bg-blue-100';
    if (intensity < 0.4) return 'bg-blue-200';
    if (intensity < 0.6) return 'bg-blue-300';
    if (intensity < 0.8) return 'bg-blue-400';
    return 'bg-blue-600';
  };

  // Obter texto branco para cores escuras
  const getTextColor = (value) => {
    const intensity = (value / maxValue);
    return intensity >= 0.8 ? 'text-white' : 'text-gray-900';
  };

  // Encontrar horário de pico
  const peakHour = data?.length > 0 ? data.reduce((peak, current) => {
    const currentValue = metric === 'pedidos' ? current.pedidos : current.receita;
    const peakValue = metric === 'pedidos' ? peak.pedidos : peak.receita;
    return currentValue > peakValue ? current : peak;
  }, data[0]) : null;

  // Agrupar por período do dia
  const getPeriodStats = (startHour, endHour) => {
    const periodData = data?.filter(d => d.hora >= startHour && d.hora < endHour) || [];
    const total = periodData.reduce((sum, d) => sum + (metric === 'pedidos' ? d.pedidos : d.receita), 0);
    return total;
  };

  const periods = [
    { name: 'Madrugada', icon: Moon, hours: '00h-06h', start: 0, end: 6, value: getPeriodStats(0, 6) },
    { name: 'Manhã', icon: Sun, hours: '06h-12h', start: 6, end: 12, value: getPeriodStats(6, 12) },
    { name: 'Tarde', icon: Sun, hours: '12h-18h', start: 12, end: 18, value: getPeriodStats(12, 18) },
    { name: 'Noite', icon: Moon, hours: '18h-00h', start: 18, end: 24, value: getPeriodStats(18, 24) }
  ];

  const maxPeriodValue = Math.max(...periods.map(p => p.value), 1);

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
                <Clock size={20} className="text-blue-600" />
                Mapa de Calor - Vendas por Horário
              </h3>
              {!isMinimized && peakHour && (
                <p className="text-sm text-gray-500 mt-1">
                  Pico: {peakHour.diaSemana} às {peakHour.hora}h - {metric === 'pedidos' ? formatNumber(metric === 'pedidos' ? peakHour.pedidos : peakHour.receita) : formatCurrency(peakHour.receita)}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Métrica */}
            {!isMinimized && (
              <select
                value={metric}
                onChange={(e) => setMetric(e.target.value)}
                className="px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pedidos">Pedidos</option>
                <option value="receita">Receita</option>
              </select>
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
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="p-4 border-b bg-gray-50">
                <div className="h-6 bg-gray-200 rounded w-64 animate-pulse"></div>
              </div>
              <div className="p-6">
                <LoadingSpinner text="Carregando mapa de calor..." />
              </div>
            </div>
          ) : error ? (
            <div className="h-96 flex items-center justify-center">
              <div className="text-center">
                <p className="text-red-600 font-medium">Erro ao carregar dados</p>
                <p className="text-red-500 text-sm mt-1">{error}</p>
              </div>
            </div>
          ) : data.length === 0 ? (
            <div className="h-96 flex items-center justify-center">
              <div className="text-center">
                <Clock size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600 font-medium">Nenhum dado encontrado</p>
                <p className="text-gray-500 text-sm mt-1">
                  Tente ajustar os filtros para ver resultados
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Resumo por Período */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {periods.map((period, index) => (
                  <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-2">
                      <period.icon size={18} className="text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">{period.name}</span>
                    </div>
                    <div className="text-xs text-gray-500 mb-2">{period.hours}</div>
                    <div className="text-lg font-bold text-gray-900">
                      {metric === 'pedidos' ? formatNumber(period.value) : formatCurrency(period.value)}
                    </div>
                    {/* Barra de comparação */}
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${(period.value / maxPeriodValue) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Heatmap */}
              <div className="overflow-x-auto">
                <div className="inline-block min-w-full">
                  <div className="flex">
                    {/* Coluna de dias */}
                    <div className="flex-shrink-0 w-16">
                      <div className="h-10"></div> {/* Espaço para header de horas */}
                      {diasSemana.map((dia, index) => (
                        <div 
                          key={index} 
                          className="h-12 flex items-center justify-center text-sm font-medium text-gray-700 border-r"
                        >
                          {dia}
                        </div>
                      ))}
                    </div>

                    {/* Grid de horas */}
                    <div className="flex-1 overflow-x-auto">
                      <div className="flex">
                        {horas.map((hora) => (
                          <div key={hora} className="flex-shrink-0" style={{ width: '48px' }}>
                            {/* Header de horas */}
                            <div className="h-10 flex items-center justify-center text-xs font-medium text-gray-600 border-b">
                              {hora}h
                            </div>
                            {/* Células do heatmap */}
                            {diasSemana.map((_, diaIndex) => {
                              const value = getValue(diaIndex, hora);
                              return (
                                <div
                                  key={`${diaIndex}-${hora}`}
                                  className={`h-12 border border-gray-200 flex items-center justify-center text-xs font-medium cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all ${getColor(value)} ${getTextColor(value)}`}
                                  title={`${diasSemana[diaIndex]} ${hora}h: ${metric === 'pedidos' ? formatNumber(value) : formatCurrency(value)}`}
                                >
                                  {value > 0 ? (metric === 'pedidos' ? value : Math.round(value / 1000) + 'k') : ''}
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Legenda */}
              <div className="mt-6 flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>Intensidade:</span>
                  <div className="flex items-center gap-1">
                    <div className="w-6 h-6 bg-gray-50 border rounded"></div>
                    <span className="text-xs">Vazio</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-6 h-6 bg-blue-100 border rounded"></div>
                    <span className="text-xs">Baixo</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-6 h-6 bg-blue-300 border rounded"></div>
                    <span className="text-xs">Médio</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-6 h-6 bg-blue-600 border rounded"></div>
                    <span className="text-xs">Alto</span>
                  </div>
                </div>

                <div className="text-sm text-gray-500">
                  💡 Passe o mouse sobre as células para ver detalhes
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Minimized State */}
      {isMinimized && (
        <div className="px-4 py-3 bg-gray-50 border-t">
          <p className="text-sm text-gray-500">Clique em expandir para ver o mapa de calor</p>
        </div>
      )}
    </div>
  );
}

export default HourHeatmap;