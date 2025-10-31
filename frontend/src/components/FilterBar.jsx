import { useState, useEffect } from 'react';
import { Filter, Calendar, X } from 'lucide-react';

export function FilterBar({ filters, onChange }) {
  const [options, setOptions] = useState({
    stores: [],
    channels: [],
    subBrands: []
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Carregar opções de filtros
    fetch('http://localhost:3001/api/filter-options')
      .then(res => res.json())
      .then(data => {
        setOptions(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Erro ao carregar filtros:', err);
        setLoading(false);
      });
  }, []);

  const handleChange = (key, value) => {
    onChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onChange({
      period: '30d',
      channel: 'todos',
      channelType: 'todos',
      store: 'todas',
      subBrand: 'todas',
      storeStatus: 'ativas'
    });
    setShowAdvanced(false);
  };

  const hasActiveFilters = () => {
    return filters.channel !== 'todos' || 
           filters.channelType !== 'todos' ||
           filters.store !== 'todas' || 
           filters.subBrand !== 'todas' ||
           filters.storeStatus !== 'ativas';
  };

  if (loading) {
    return (
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="animate-pulse flex gap-4">
            <div className="h-10 bg-gray-200 rounded w-40"></div>
            <div className="h-10 bg-gray-200 rounded w-40"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        {/* Filtros Principais */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Período */}
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-gray-400" />
            <select 
              value={filters.period || '30d'}
              onChange={(e) => handleChange('period', e.target.value)}
              className="px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="90d">Últimos 3 meses</option>
              <option value="180d">Últimos 6 meses</option>
              <option value="365d">Último ano</option>
            </select>
          </div>

          {/* Canal */}
          <select 
            value={filters.channel || 'todos'}
            onChange={(e) => handleChange('channel', e.target.value)}
            className="px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="todos">Todos os canais</option>
            {options.channels.map(channel => (
              <option key={channel.id} value={channel.name}>
                {channel.name} ({channel.type === 'P' ? 'Presencial' : 'Delivery'})
              </option>
            ))}
          </select>

          {/* Loja */}
          <select 
          value={filters.store || 'todas'}
          onChange={(e) => handleChange('store', e.target.value)}
          className="px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
          <option value="todas">Todas as lojas</option>
          {options.stores
            .filter(store => store.is_active !== false || filters.storeStatus === 'todas')
            .map(store => (
            <option key={store.id} value={store.id}>
              {store.name} {store.city && `- ${store.city}`} {store.state && `/ ${store.state}`}
              {store.is_active === false && " (Desativada)"}
            </option>
            ))}
          </select>

          {/* Botão Filtros Avançados */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            <Filter size={16} />
            Filtros Avançados
            {hasActiveFilters() && (
              <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                Ativos
              </span>
            )}
          </button>

          {/* Limpar Filtros */}
          {hasActiveFilters() && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <X size={16} />
              Limpar
            </button>
          )}
        </div>

        {/* Filtros Avançados (Expansível) */}
        {showAdvanced && (
          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Tipo de Canal */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Tipo de Canal
                  </label>
                  <select 
                    value={filters.channelType || 'todos'}
                    onChange={(e) => handleChange('channelType', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="todos">Todos</option>
                    <option value="P">Presencial</option>
                    <option value="D">Delivery</option>
                  </select>
                </div>

                {/*Lojas Desativadas*/}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Status da Loja
                  </label>
                  <select 
                    value={filters.storeStatus || 'ativas'}
                    onChange={(e) => handleChange('storeStatus', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="ativas">Apenas Ativas</option>
                    <option value="todas">Incluir Desativadas</option>
                  </select>
                </div>
              {/* Sub-Brand */}
              {options.subBrands.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Sub-Marca
                  </label>
                  <select 
                    value={filters.subBrand || 'todas'}
                    onChange={(e) => handleChange('subBrand', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="todas">Todas</option>
                    {options.subBrands.map(subBrand => (
                      <option key={subBrand.id} value={subBrand.id}>
                        {subBrand.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Datas Customizadas */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Período Customizado
                </label>
                <div className="space-y-2">
                  <input
                    type="date"
                    value={filters.startDate || ''}
                    onChange={(e) => handleChange('startDate', e.target.value)}
                    max={filters.endDate || new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Data inicial"
                  />
                  <input
                    type="date"
                    value={filters.endDate || ''}
                    onChange={(e) => handleChange('endDate', e.target.value)}
                    min={filters.startDate || ''}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Data final"
                  />
                  {(filters.startDate || filters.endDate) && (
                    <button
                      onClick={() => {
                        handleChange('startDate', '');
                        handleChange('endDate', '');
                      }}
                      className="w-full px-2 py-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                    >
                      Limpar datas
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Tags de Filtros Ativos */}
            {hasActiveFilters() && (
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-xs font-medium text-gray-500">Filtros ativos:</span>
                
                {filters.channel !== 'todos' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                    Canal: {filters.channel}
                    <button
                      onClick={() => handleChange('channel', 'todos')}
                      className="hover:bg-blue-100 rounded-full p-0.5"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}

                {filters.channelType !== 'todos' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                    Tipo: {filters.channelType === 'P' ? 'Presencial' : 'Delivery'}
                    <button
                      onClick={() => handleChange('channelType', 'todos')}
                      className="hover:bg-blue-100 rounded-full p-0.5"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}

                {filters.store !== 'todas' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                    Loja: {options.stores.find(s => s.id.toString() === filters.store)?.name}
                    <button
                      onClick={() => handleChange('store', 'todas')}
                      className="hover:bg-blue-100 rounded-full p-0.5"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}

                {filters.storeStatus !== 'ativas' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                    Status: {filters.storeStatus === 'todas' ? 'Todas' : 'Apenas Desativadas'}
                    <button
                      onClick={() => handleChange('storeStatus', 'ativas')}
                      className="hover:bg-blue-100 rounded-full p-0.5"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}

                {filters.subBrand !== 'todas' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                    Sub-Marca: {options.subBrands.find(sb => sb.id.toString() === filters.subBrand)?.name}
                    <button
                      onClick={() => handleChange('subBrand', 'todas')}
                      className="hover:bg-blue-100 rounded-full p-0.5"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default FilterBar;