import { useState } from 'react';
import { Package, ChevronDown, ChevronUp, GripVertical } from 'lucide-react';
import { useFetchWithCache } from '../hooks/useFetchWithCache';
import { TableSkeleton } from './LoadingSpinner';

export function TopProducts({ filters, limit = 10, onMinimize, isMinimized = false, dragHandleProps }) {
  const [sortBy, setSortBy] = useState('receita'); // receita, vendas, quantidade
  const { data: products, loading, error } = useFetchWithCache(
    buildProductsUrl(filters, limit),
    [filters, limit]
  );

  // Função para construir a URL
  function buildProductsUrl(filters, limit) {
    const params = new URLSearchParams();
    
    if (filters.period) params.append('period', filters.period);
    if (filters.channel && filters.channel !== 'todos') params.append('channel', filters.channel);
    if (filters.channelType && filters.channelType !== 'todos') params.append('channelType', filters.channelType);
    if (filters.store && filters.store !== 'todas') params.append('store', filters.store);
    if (filters.subBrand && filters.subBrand !== 'todas') params.append('subBrand', filters.subBrand);
    params.append('limit', limit.toString());
    
    return `http://localhost:3001/api/top-products?${params.toString()}`;
  }

  // Formatar moeda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  // Formatar número
  const formatNumber = (value) => {
    return new Intl.NumberFormat('pt-BR').format(value || 0);
  };

  // Ordenar produtos
  const sortedProducts = products ? [...products].sort((a, b) => {
    switch (sortBy) {
      case 'receita':
        return b.receita - a.receita;
      case 'vendas':
        return b.vendas - a.vendas;
      case 'quantidade':
        return b.quantidade - a.quantidade;
      default:
        return 0;
    }
  }) : [];

  // Loading skeleton
  if (loading && !products) {
    return (
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="p-6 border-b">
          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>
        <div className="p-6">
          <TableSkeleton rows={5} />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium">Erro ao carregar produtos</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  // No data
  if (products.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center py-12">
          <Package size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-600 font-medium">Nenhum produto encontrado</p>
          <p className="text-gray-500 text-sm mt-1">
            Tente ajustar os filtros para ver resultados
          </p>
        </div>
      </div>
    );
  }

  // Calcular totais
  const totals = products.reduce((acc, product) => ({
    receita: acc.receita + product.receita,
    vendas: acc.vendas + product.vendas,
    quantidade: acc.quantidade + product.quantidade
  }), { receita: 0, vendas: 0, quantidade: 0 });

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b bg-gray-50">
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
                <Package size={20} className="text-blue-600" />
                Top Produtos
              </h3>
              {!isMinimized && (
                <p className="text-sm text-gray-500 mt-1">
                  {products.length} produtos • {formatCurrency(totals.receita)} em vendas
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Ordenação (só quando expandido) */}
            {!isMinimized && (
              <>
                <span className="text-sm text-gray-600">Ordenar por:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="receita">Receita</option>
                  <option value="vendas">Vendas</option>
                  <option value="quantidade">Quantidade</option>
                </select>
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

      {/* Tabela Desktop */}
      {!isMinimized && (
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Produto
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vendas
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantidade
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Receita
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Preço Médio
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                % Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedProducts.map((product, index) => {
              const percentual = (product.receita / totals.receita * 100).toFixed(1);
              
              return (
                <tr 
                  key={index} 
                  className="hover:bg-gray-50 transition-colors"
                >
                  {/* Posição */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600 font-medium text-sm">
                      {index + 1}
                    </div>
                  </td>

                  {/* Produto */}
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">
                        {product.name}
                      </div>
                      {product.categoria && (
                        <div className="text-sm text-gray-500">
                          {product.categoria}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Vendas */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="text-gray-900 font-medium">
                      {formatNumber(product.vendas)}
                    </span>
                  </td>

                  {/* Quantidade */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="text-gray-700">
                      {formatNumber(product.quantidade)}
                    </span>
                  </td>

                  {/* Receita */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="text-gray-900 font-semibold">
                      {formatCurrency(product.receita)}
                    </span>
                  </td>

                  {/* Preço Médio */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="text-gray-700">
                      {formatCurrency(product.precoMedio)}
                    </span>
                  </td>

                  {/* Percentual */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${percentual}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 font-medium">
                        {percentual}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Footer com totais */}
          <tfoot className="bg-gray-50 border-t">
            <tr>
              <td colSpan="2" className="px-6 py-4 text-sm font-semibold text-gray-900">
                TOTAL
              </td>
              <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                {formatNumber(totals.vendas)}
              </td>
              <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                {formatNumber(totals.quantidade)}
              </td>
              <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                {formatCurrency(totals.receita)}
              </td>
              <td colSpan="2"></td>
            </tr>
          </tfoot>
        </table>
      </div>
      )}

      {/* Cards Mobile */}
      {!isMinimized && (
        <div className="md:hidden divide-y">
        {sortedProducts.map((product, index) => {
          const percentual = (product.receita / totals.receita * 100).toFixed(1);
          
          return (
            <div key={index} className="p-4">
              {/* Header */}
              <div className="flex items-start gap-3 mb-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600 font-medium text-sm flex-shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 truncate">
                    {product.name}
                  </h4>
                  {product.categoria && (
                    <p className="text-sm text-gray-500">{product.categoria}</p>
                  )}
                </div>
              </div>

              {/* Métricas */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Receita</p>
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(product.receita)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Vendas</p>
                  <p className="font-medium text-gray-900">
                    {formatNumber(product.vendas)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Quantidade</p>
                  <p className="text-gray-700">
                    {formatNumber(product.quantidade)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Preço Médio</p>
                  <p className="text-gray-700">
                    {formatCurrency(product.precoMedio)}
                  </p>
                </div>
              </div>

              {/* Barra de progresso */}
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${percentual}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-600 font-medium">
                  {percentual}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Minimized State */}
      {isMinimized && (
        <div className="px-4 py-3 bg-gray-50 border-t">
          <p className="text-sm text-gray-500">Clique em expandir para ver a tabela de produtos</p>
        </div>
      )}
    </div>
  );
}

export default TopProducts;