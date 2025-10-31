import { useEffect, useState } from 'react';
import { Store, ChevronDown, ChevronUp, GripVertical, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useFetchWithCache } from '../hooks/useFetchWithCache';

export function StoreComparison({ filters, onMinimize, isMinimized = false, dragHandleProps }) {
  const [selectedStores, setSelectedStores] = useState([]);
  const [showStoreSelector, setShowStoreSelector] = useState(false);
  const [viewMode, setViewMode] = useState('cards');
  const [hasUserChangedSelection, setHasUserChangedSelection] = useState(false);

  // Buscar lojas disponíveis
  const { data: filterOptions, loading: loadingOptions } = useFetchWithCache(
    'http://localhost:3001/api/filter-options',
    []
  );


  const params = new URLSearchParams();
  if (filters.period) params.append('period', filters.period);
  if (filters.channel && filters.channel !== 'todos') params.append('channel', filters.channel);
  if (filters.channelType && filters.channelType !== 'todos') params.append('channelType', filters.channelType);
  if (filters.store && filters.store !== 'todas') params.append('store', filters.store);
  if (filters.subBrand && filters.subBrand !== 'todas') params.append('subBrand', filters.subBrand);
  if (filters.storeStatus && filters.storeStatus !== 'todas') {
    params.append('storeStatus', filters.storeStatus);
  }

  const { data: storesData, loading: loadingStores, error } = useFetchWithCache(
    `http://localhost:3001/api/store-performance?${params.toString()}`,
    [filters]
  );

  // FILTRAR LOJAS DISPONÍVEIS COM BASE NO storeStatus
  const filteredStores = filterOptions?.stores ? filterOptions.stores.filter(store => {
    if (filters.storeStatus === 'ativas') {
      return store.is_active !== false; // Apenas lojas ativas
    } else if (filters.storeStatus === 'desativadas') {
      return store.is_active === false; // Apenas lojas desativadas
    }
    return true; // 'todas' - inclui todas as lojas
  }) : [];

  // Selecionar automaticamente as primeiras lojas APENAS na primeira carga
  useEffect(() => {
    if (filteredStores && filteredStores.length > 0 && selectedStores.length === 0 && !hasUserChangedSelection) {
      const firstStores = filteredStores.slice(0, 3).map(store => store.id.toString()); // Usa filteredStores
      setSelectedStores(firstStores);
    }
  }, [filteredStores, selectedStores.length, hasUserChangedSelection]);

  // Preparar dados das lojas selecionadas
  const stores = (() => {
    if (!storesData || !filterOptions?.stores) return [];
    
    const uniqueStores = [];
    const processedIds = new Set();

    storesData.forEach(store => {
      // Usar ID como chave primária
      const storeInfo = filterOptions.stores.find(s => 
        s.id.toString() === store.store_id?.toString() || 
        (s.name === store.name && s.city === store.city && s.state === store.state)
      );
      
      if (storeInfo && selectedStores.includes(storeInfo.id.toString())) {
        // Incluir state para diferenciar
        const uniqueKey = `${storeInfo.id}-${storeInfo.name}-${storeInfo.city}-${storeInfo.state}`;
        
        if (!processedIds.has(uniqueKey)) {
          processedIds.add(uniqueKey);
          
          uniqueStores.push({
            ...store,
            id: storeInfo.id,
            name: storeInfo.name,
            city: storeInfo.city,
            state: storeInfo.state,
            uniqueKey: uniqueKey
          });
        }
      }
    });

    return uniqueStores;
  })();

  const loading = loadingOptions || loadingStores;

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

  const formatTime = (seconds) => {
    if (!seconds) return '0min';
    const minutes = Math.floor(seconds / 60);
    return `${minutes}min`;
  };

  const toggleStoreSelection = (storeId) => {
    setHasUserChangedSelection(true);
    setSelectedStores(prev => {
      const stringId = storeId.toString();
      if (prev.includes(stringId)) {
        return prev.filter(id => id !== stringId);
      } else {
        return [...prev, stringId];
      }
    });
  };

  // Preparar dados para o gráfico
  const chartData = stores.map(store => ({
    name: store.name,
    Receita: store.receita || 0,
    Pedidos: store.pedidos || 0,
    'Ticket Médio': store.ticketMedio || 0
  }));

  // Calcular melhor/pior em cada métrica
  const getBestStore = (metric) => {
    if (stores.length === 0) return null;
    return stores.reduce((best, store) => 
      (store[metric] || 0) > (best[metric] || 0) ? store : best
    );
  };

  const getWorstStore = (metric) => {
    if (stores.length === 0) return null;
    return stores.reduce((worst, store) => 
      (store[metric] || 0) < (worst[metric] || 0) ? store : worst
    );
  };

  const renderComparisonIcon = (store, metric) => {
    const best = getBestStore(metric);
    const worst = getWorstStore(metric);
    
    if (!best || !worst || stores.length < 2) return null;
    
    if (store.uniqueKey === best.uniqueKey) {
      return <TrendingUp size={16} className="text-green-600" />;
    } else if (store.uniqueKey === worst.uniqueKey) {
      return <TrendingDown size={16} className="text-red-600" />;
    }
    return <Minus size={16} className="text-gray-400" />;
  };

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-gray-900 mb-2">{payload[0].payload.name}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
            <span className="text-sm text-gray-600">{entry.name}:</span>
            <span className="text-sm font-semibold text-gray-900">
              {entry.name === 'Pedidos' ? formatNumber(entry.value) : formatCurrency(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
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
                <Store size={20} className="text-blue-600" />
                Comparação de Lojas
              </h3>
              {!isMinimized && stores.length > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  Comparando {stores.length} {stores.length === 1 ? 'loja' : 'lojas'}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode */}
            {!isMinimized && stores.length > 0 && (
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
                className="px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="cards">Cards</option>
                <option value="chart">Gráfico</option>
                <option value="table">Tabela</option>
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
          {/* Seletor de Lojas - Minimizável */}
          <div className="mb-6 border rounded-lg">
            <button
              onClick={() => setShowStoreSelector(!showStoreSelector)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">
                  Selecionar Lojas ({selectedStores.length} selecionadas)
                </span>
              </div>
              {showStoreSelector ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            
            {showStoreSelector && filteredStores && (
              <div className="px-4 py-3 border-t bg-gray-50">
                <div className="flex flex-wrap gap-2">
                  {filteredStores.map((store) => { // 👈 Usa filteredStores aqui
                    const isActive = store.is_active !== false;
                    return (
                      <button
                        key={`selector-${store.id}-${store.name}`}
                        onClick={() => toggleStoreSelection(store.id)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          selectedStores.includes(store.id.toString())
                            ? 'bg-blue-600 text-white'
                            : isActive 
                              ? 'bg-white text-gray-700 hover:bg-gray-100 border'
                              : 'bg-gray-100 text-gray-400 border border-gray-300'
                        }`}
                        title={!isActive ? "Loja desativada" : ""}
                      >
                        {store.name} - {store.city} / {store.state}
                        {!isActive && " 🚫"}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-pulse text-gray-400">Carregando dados...</div>
            </div>
          ) : error ? (
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <p className="text-red-600 font-medium">Erro ao carregar dados</p>
                <p className="text-red-500 text-sm mt-1">{error}</p>
              </div>
            </div>
          ) : stores.length === 0 ? (
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <Store size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600 font-medium">
                  {selectedStores.length === 0 ? 'Nenhuma loja selecionada' : 'Nenhum dado encontrado para as lojas selecionadas'}
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  {selectedStores.length === 0 
                    ? 'Selecione pelo menos uma loja para comparar' 
                    : 'Tente ajustar os filtros ou selecionar outras lojas'
                  }
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Cards View */}
              {viewMode === 'cards' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stores.map((store) => (
                    <div key={store.uniqueKey} className="border rounded-lg p-5 hover:shadow-md transition-shadow"> {/* Usando uniqueKey */}
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-semibold text-gray-900 text-lg">{store.name}</h4>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            {store.city && <span>{store.city}</span>}
                            {store.state && <span>({store.state})</span>} {/* Adicionando o state */}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Receita</span>
                          <div className="flex items-center gap-2">
                            {renderComparisonIcon(store, 'receita')}
                            <span className="font-semibold text-gray-900">
                              {formatCurrency(store.receita)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Pedidos</span>
                          <div className="flex items-center gap-2">
                            {renderComparisonIcon(store, 'pedidos')}
                            <span className="font-semibold text-gray-900">
                              {formatNumber(store.pedidos)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Ticket Médio</span>
                          <div className="flex items-center gap-2">
                            {renderComparisonIcon(store, 'ticketMedio')}
                            <span className="font-semibold text-gray-900">
                              {formatCurrency(store.ticketMedio)}
                            </span>
                          </div>
                        </div>

                        {(store.tempoMedioProducao > 0) && (
                          <div className="flex items-center justify-between pt-2 border-t">
                            <span className="text-xs text-gray-500">Tempo Produção</span>
                            <span className="text-xs text-gray-700">
                              {formatTime(store.tempoMedioProducao)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Chart View */}
              {viewMode === 'chart' && (
                <div>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="Receita" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Pedidos" fill="#10B981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Table View */}
              {viewMode === 'table' && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loja</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Receita</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Pedidos</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ticket Médio</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tempo Produção</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {stores.map((store) => (
                        <tr key={store.uniqueKey} className="hover:bg-gray-50"> {/* Usando uniqueKey */}
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">{store.name}</div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              {store.city && <span>{store.city}</span>}
                              {store.state && <span>({store.state})</span>} {/* Adicionando o state */}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {renderComparisonIcon(store, 'receita')}
                              <span className="font-semibold">{formatCurrency(store.receita)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {renderComparisonIcon(store, 'pedidos')}
                              <span className="font-semibold">{formatNumber(store.pedidos)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {renderComparisonIcon(store, 'ticketMedio')}
                              <span className="font-semibold">{formatCurrency(store.ticketMedio)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right text-gray-700">
                            {formatTime(store.tempoMedioProducao)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Minimized State */}
      {isMinimized && (
        <div className="px-4 py-3 bg-gray-50 border-t">
          <p className="text-sm text-gray-500">Clique em expandir para comparar lojas</p>
        </div>
      )}
    </div>
  );
}

export default StoreComparison;