import { useState } from 'react';
import { Package, TrendingUp, Star, Zap, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { useFetchWithCache } from '../hooks/useFetchWithCache';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

export function ProductPerformance({ filters, onMinimize, isMinimized = false, dragHandleProps }) {
  const [activeTab, setActiveTab] = useState('profitability');
  const [timeRange, setTimeRange] = useState('30d');
  
  // ✅ CORREÇÃO: Só buscar dados da aba ativa
  const shouldFetchProfitability = activeTab === 'profitability' && !isMinimized;
  const shouldFetchSeasonality = activeTab === 'seasonality' && !isMinimized;
  const shouldFetchCombinations = activeTab === 'combinations' && !isMinimized;
  const shouldFetchCategories = activeTab === 'categories' && !isMinimized;
  
  const { data: profitableProducts, loading: productsLoading } = useFetchWithCache(
    shouldFetchProfitability 
      ? `http://localhost:3001/api/profitable-products?${new URLSearchParams({ ...filters, limit: 500 })}`
      : null,
    [filters, shouldFetchProfitability]
  );

  const { data: seasonalityData, loading: seasonalityLoading } = useFetchWithCache(
    shouldFetchSeasonality
      ? `http://localhost:3001/api/product-seasonality?${new URLSearchParams({ ...filters})}`
      : null,
    [filters, shouldFetchSeasonality]
  );

  const { data: combinationsData, loading: combinationsLoading } = useFetchWithCache(
    shouldFetchCombinations
      ? `http://localhost:3001/api/product-combinations?${new URLSearchParams({ ...filters, limit: 15 })}`
      : null,
    [filters, shouldFetchCombinations]
  );

  const { data: categoriesData, loading: categoriesLoading } = useFetchWithCache(
    shouldFetchCategories
      ? `http://localhost:3001/api/category-performance?${new URLSearchParams(filters)}`
      : null,
    [filters, shouldFetchCategories]
  );

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('pt-BR').format(value || 0);
  };

  const formatPercent = (value) => {
    return `${((value || 0) * 100).toFixed(1)}%`;
  };

  // Calcular "lucratividade" aproximada (baseada no preço médio)
  const calculateProfitabilityScore = (product) => {
    // Simular margem baseada no preço (produtos mais caros tendem a ter melhor margem)
    const priceScore = Math.min(product.precoMedio / 50, 1); // Normalizar para 0-1
    const volumeScore = Math.min(product.quantidade / 100, 1); // Normalizar volume
    return (priceScore * 0.6 + volumeScore * 0.4) * 100; // Score 0-100
  };

  const loading = productsLoading || seasonalityLoading || combinationsLoading || categoriesLoading;

  // Cores para gráficos
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#8DD1E1'];

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
                <Package size={20} className="text-orange-600" />
                Product Performance Deep Dive
              </h3>
              {!isMinimized && profitableProducts && (
                <p className="text-sm text-gray-500 mt-1">
                  {profitableProducts.length} produtos analisados • Top 1: {profitableProducts[0]?.name}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isMinimized && (
              <>
                <div className="flex border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setActiveTab('profitability')}
                    className={`px-3 py-1.5 text-sm transition-colors ${
                      activeTab === 'profitability' ? 'bg-orange-100 text-orange-600' : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Lucratividade
                  </button>
                  <button
                    onClick={() => setActiveTab('seasonality')}
                    className={`px-3 py-1.5 text-sm border-x transition-colors ${
                      activeTab === 'seasonality' ? 'bg-orange-100 text-orange-600' : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Sazonalidade
                  </button>
                  <button
                    onClick={() => setActiveTab('combinations')}
                    className={`px-3 py-1.5 text-sm transition-colors ${
                      activeTab === 'combinations' ? 'bg-orange-100 text-orange-600' : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Combinações
                  </button>
                  <button
                    onClick={() => setActiveTab('categories')}
                    className={`px-3 py-1.5 text-sm border-l transition-colors ${
                      activeTab === 'categories' ? 'bg-orange-100 text-orange-600' : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Categorias
                  </button>
                </div>
              </>
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
              <div className="animate-pulse text-gray-400">Analisando performance dos produtos...</div>
            </div>
          ) : (
            <>
              {/* Profitability Tab */}
              {activeTab === 'profitability' && profitableProducts && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Produtos por Lucratividade */}
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <TrendingUp size={18} className="text-green-600" />
                        Top Produtos por Valor
                      </h4>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {profitableProducts.slice(0, 10).map((product, index) => {
                          const profitability = calculateProfitabilityScore(product);
                          
                          return (
                            <div key={product.id || index} className="border rounded-lg p-3 hover:bg-gray-50">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-start gap-2">
                                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-600 font-medium text-xs">
                                    {index + 1}
                                  </div>
                                  <div>
                                    <div className="font-medium text-gray-900 text-sm">
                                      {product.name}
                                    </div>
                                    {product.categoria && (
                                      <div className="text-xs text-gray-500">{product.categoria}</div>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-semibold text-green-600">
                                    {formatCurrency(product.receita)}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {formatNumber(product.quantidade)} vendas
                                  </div>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-3 gap-2 text-xs mt-2">
                                <div>
                                  <div className="text-gray-500">Preço Médio</div>
                                  <div className="font-medium">{formatCurrency(product.precoMedio)}</div>
                                </div>
                                <div>
                                  <div className="text-gray-500">Score</div>
                                  <div className="font-medium">{profitability.toFixed(0)}/100</div>
                                </div>
                                <div>
                                  <div className="text-gray-500">% Cat.</div>
                                  <div className="font-medium">{formatPercent(product.percentual_categoria)}</div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Análise de Performance */}
                    <div className="space-y-4">
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3">Métricas Gerais</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-900">
                              {formatCurrency(profitableProducts.reduce((sum, p) => sum + p.receita, 0))}
                            </div>
                            <div className="text-sm text-blue-700">Receita Total</div>
                          </div>
                          <div className="text-center p-3 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-900">
                              {formatNumber(profitableProducts.reduce((sum, p) => sum + p.quantidade, 0))}
                            </div>
                            <div className="text-sm text-green-700">Unidades Vendidas</div>
                          </div>
                        </div>
                      </div>

                      {/* Produtos em Destaque */}
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                          <Star size={16} className="text-yellow-500" />
                          Destaques
                        </h4>
                        <div className="space-y-2">
                          {profitableProducts.slice(0, 3).map((product, index) => (
                            <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <span className="text-sm font-medium">{product.name}</span>
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                +{formatPercent(product.crescimento || 0.15)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Gráfico de Receita vs Quantidade */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-4">Receita vs Volume de Vendas</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={profitableProducts.slice(0, 8)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="name" 
                          fontSize={12} 
                          angle={-45} 
                          textAnchor="end"
                          height={80}
                          tick={{ fontSize: 10 }}
                        />
                        <YAxis fontSize={12} />
                        <Tooltip 
                          formatter={(value, name) => [
                            name === 'Receita' ? formatCurrency(value) : formatNumber(value),
                            name === 'Receita' ? 'Receita' : 'Quantidade',
                          ]}
                        />
                        <Bar 
                          dataKey="receita" 
                          fill="#10B981" 
                          radius={[4, 4, 0, 0]}
                          name="Receita"
                        />
                        <Bar 
                          dataKey="quantidade" 
                          fill="#3B82F6" 
                          radius={[4, 4, 0, 0]}
                          name="Quantidade"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Seasonality Tab */}
              {activeTab === 'seasonality' && seasonalityData && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-4">Variação Sazonal</h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={seasonalityData?.timeSeries || []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis 
                                dataKey="periodo" 
                                fontSize={12}
                            />
                            <YAxis fontSize={12} />
                            <Tooltip 
                                formatter={(value) => [formatNumber(value), 'Vendas']}
                            />
                            <Line 
                                type="monotone" 
                                dataKey="vendas"
                                stroke="#FF8042" 
                                strokeWidth={2}
                                dot={{ fill: '#FF8042', r: 4 }}
                                name="Vendas"
                            />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-4">Produtos Sazonais</h4>
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {seasonalityData?.top_sazonais?.map((produto, index) => (
                          <div key={index} className="flex justify-between items-center p-2 border rounded hover:bg-gray-50">
                            <div>
                              <div className="font-medium text-sm">{produto.nome}</div>
                              <div className="text-xs text-gray-500">Variação: {formatPercent(produto.variacao)}</div>
                            </div>
                            <div className="text-right">
                              <div className={`text-sm font-medium ${produto.variacao > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {produto.variacao > 0 ? '↑' : '↓'} {Math.abs(produto.variacao * 100).toFixed(1)}%
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Combinations Tab */}
              {activeTab === 'combinations' && combinationsData && (
                <div className="space-y-6">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                      <Zap size={18} className="text-purple-600" />
                      Combinações Mais Populares
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {combinationsData.map((combo, index) => (
                        <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start gap-2 mb-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-600 font-medium text-sm">
                              {index + 1}
                            </div>
                            <div>
                              <h5 className="font-medium text-gray-900 text-sm leading-tight">
                                {combo.produto_principal}
                              </h5>
                              <p className="text-xs text-gray-500 mt-1">
                                + {combo.item_combinado}
                              </p>
                            </div>
                          </div>
                          
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Frequência:</span>
                              <span className="font-medium">{formatNumber(combo.frequencia)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Receita:</span>
                              <span className="font-medium text-green-600">{formatCurrency(combo.receita_total)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Ticket Médio:</span>
                              <span className="font-medium">{formatCurrency(combo.ticket_medio_combinacao)}</span>
                            </div>
                            {combo.incremento_ticket > 0 && (
                                <div className="flex justify-between">
                                <span className="text-gray-600">Incremento:</span>
                                <span className="font-medium text-blue-600">+{formatCurrency(combo.incremento_ticket)}</span>
                                </div>
                            )}
                          </div>
                          
                          <div className="mt-3 pt-2 border-t">
                            <div className="text-xs text-gray-500">
                              {formatPercent(combo.percentual_pedidos)} dos pedidos
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Categories Tab */}
              {activeTab === 'categories' && categoriesData && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-4">Performance por Categoria</h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={categoriesData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ categoria, percent }) => `${categoria} (${(percent * 100).toFixed(0)}%)`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="receita"
                          >
                            {categoriesData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [formatCurrency(value), 'Receita']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-4">Detalhes por Categoria</h4>
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {categoriesData.map((categoria, index) => (
                          <div key={index} className="flex justify-between items-center p-3 border rounded hover:bg-gray-50">
                            <div>
                              <div className="font-medium text-sm">{categoria.categoria}</div>
                              <div className="text-xs text-gray-500">
                                {formatNumber(categoria.quantidade)} itens • {formatNumber(categoria.pedidos)} pedidos
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">{formatCurrency(categoria.receita)}</div>
                              <div className="text-xs text-gray-500">
                                {formatCurrency(categoria.ticket_medio)} médio
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
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
          <p className="text-sm text-gray-500">Clique em expandir para ver análise de produtos</p>
        </div>
      )}
    </div>
  );
}

export default ProductPerformance;