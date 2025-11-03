
import { useState } from 'react';
import { Users, TrendingUp, Star, RefreshCw, Clock, DollarSign, ShoppingBag, GripVertical, ChevronUp, ChevronDown, AlertTriangle,  CreditCard, Wallet, Globe  } from 'lucide-react';
import { useFetchWithCache } from '../hooks/useFetchWithCache';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';


export function CustomerAnalytics({ filters, onMinimize, isMinimized = false, dragHandleProps }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [retryCount, setRetryCount] = useState(0);
  
  const { data: metrics, loading: metricsLoading, error: metricsError } = useFetchWithCache(
    `http://localhost:3001/api/customer-metrics?${new URLSearchParams(filters)}`,
    [filters, retryCount] // recarregar quando retryCount mudar
  );

  const { data: topCustomers, loading: customersLoading, error: customersError } = useFetchWithCache(
    `http://localhost:3001/api/top-customers?${new URLSearchParams({ ...filters, limit: 10 })}`,
    [filters, retryCount]
  );

  const { data: segmentation, loading: segmentationLoading, error: segmentationError } = useFetchWithCache(
    `http://localhost:3001/api/customer-segmentation?${new URLSearchParams(filters)}`,
    [filters, retryCount]
  );

  const { data: paymentMethods, loading: paymentLoading, error: paymentError } = useFetchWithCache(
    `http://localhost:3001/api/payment-methods?${new URLSearchParams(filters)}`,
    [filters, retryCount]
  );

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  // Verificar se há erro em qualquer uma das requisições
  const hasError = metricsError || customersError || segmentationError || paymentError;

  if (hasError) {
    return (
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 rounded transition-colors">
                <GripVertical size={20} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Users size={20} className="text-purple-600" />
                Customer Analytics
              </h3>
            </div>
          </div>
        </div>
        
        <div className="p-8 text-center">
          <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
          <h4 className="text-lg font-medium text-red-800 mb-2">Erro ao carregar dados</h4>
          <p className="text-red-600 mb-4">
            {metricsError?.message || customersError?.message || segmentationError?.message}
          </p>
          <button
            onClick={handleRetry}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
          >
            <RefreshCw size={16} />
            Tentar Novamente
          </button>
          <p className="text-sm text-gray-500 mt-4">
            Se o erro persistir, verifique o console do servidor para mais detalhes.
          </p>
        </div>
      </div>
    );
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('pt-BR').format(value || 0);
  };

  // Dados para gráfico de INATIVIDADE
  const inactivityData = metrics ? [
    { name: 'Ativos (≤30d)', value: metrics.compraram_30d, color: '#10B981' },
    { name: 'Inativos (31-90d)', value: metrics.compraram_90d - metrics.compraram_30d, color: '#F59E0B' },
    { name: 'Inativos (>90d)', value: metrics.inativos_90d, color: '#EF4444' }
  ] : [];

  const loading = metricsLoading || customersLoading || segmentationLoading || paymentLoading;

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
                <Users size={20} className="text-purple-600" />
                Customer Analytics (Base Cadastro)
            </h3>
            {!isMinimized && metrics && (
                <p className="text-sm text-gray-500 mt-1">
                    {formatNumber(metrics.total_clientes)} clientes • {formatNumber(metrics.clientes_ativos_30d)} cadastrados nos últimos 30 dias
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
                    activeTab === 'overview' ? 'bg-purple-100 text-purple-600' : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Visão Geral
                </button>
                <button
                  onClick={() => setActiveTab('segmentation')}
                  className={`px-3 py-1.5 text-sm border-x transition-colors ${
                    activeTab === 'segmentation' ? 'bg-purple-100 text-purple-600' : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Segmentação
                </button>
                <button
                  onClick={() => setActiveTab('top')}
                  className={`px-3 py-1.5 text-sm border-l transition-colors ${
                    activeTab === 'top' ? 'bg-purple-100 text-purple-600' : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Top Clientes
                </button>
                <button
                  onClick={() => setActiveTab('pay')}
                  className={`px-3 py-1.5 text-sm border-l transition-colors ${
                    activeTab === 'pay' ? 'bg-purple-100 text-purple-600' : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Metodos de Pagamento
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
              <div className="animate-pulse text-gray-400">Carregando análise de clientes...</div>
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && metrics && (
                <div className="space-y-6">
                  {/* KPI Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Users size={18} className="text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">Total Clientes</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-900">
                        {formatNumber(metrics.total_clientes)}
                      </div>
                    </div>

                    <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp size={18} className="text-green-600" />
                        <span className="text-sm font-medium text-green-700">Ativos</span>
                      </div>
                      <div className="text-2xl font-bold text-green-900">
                        {formatNumber(metrics.clientes_ativos)}
                      </div>
                      <div className="text-xs text-green-600 mt-1">
                        {((metrics.clientes_ativos / metrics.total_clientes) * 100).toFixed(1)}% do total
                      </div>
                    </div>

                    <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-100">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign size={18} className="text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-700">Ticket Médio</span>
                      </div>
                      <div className="text-2xl font-bold text-yellow-900">
                        {formatCurrency(metrics.ticket_medio_geral)}
                      </div>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign size={18} className="text-purple-600" />
                        <span className="text-sm font-medium text-purple-700">Frequência</span>
                      </div>
                      <div className="text-2xl font-bold text-purple-900">
                        {parseFloat(metrics.frequencia_media).toFixed(1)}
                      </div>
                      <div className="text-xs text-purple-600 mt-1">pedidos por cliente</div>
                    </div>

                    <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle size={18} className="text-red-600" />
                        <span className="text-sm font-medium text-red-700">Inativos (&gt;30d)</span>
                      </div>
                      <div className="text-2xl font-bold text-red-900">
                        {formatNumber(metrics.clientes_ativos_90d)}
                      </div>
                      <div className="text-xs text-red-600 mt-1">
                        {((metrics.clientes_ativos_90d / metrics.total_clientes) * 100).toFixed(1)}% do total
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-4">Clientes por Período de Atividade</h4>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Últimos 7 dias</span>
                        <div className="text-right">
                            <span className="font-semibold">{formatNumber(metrics.clientes_ativos_7d)}</span>
                            <div className="text-xs text-green-600">Muito Ativo</div>
                        </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">15 dias</span>
                        <div className="text-right">
                            <span className="font-semibold">{formatNumber(metrics.clientes_ativos_15d)}</span>
                            <div className="text-xs text-blue-600">Recentes</div>
                        </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">30 dias</span>
                        <div className="text-right">
                            <span className="font-semibold">{formatNumber(metrics.clientes_ativos_30d)}</span>
                            <div className="text-xs text-yellow-600">Ativos</div>
                        </div>
                        </div>
                        
                        <div className="flex justify-between items-center pt-2 border-t">
                        <span className="text-sm text-gray-600">+30 dias sem comprar</span>
                        <div className="text-right">
                            <span className="font-semibold text-red-600">{formatNumber(metrics.clientes_ativos_90d)}</span>
                            <div className="text-xs text-red-600">Quase Inativos</div>
                        </div>
                        </div>

                        <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">+90 dias sem comprar</span>
                        <div className="text-right">
                            <span className="font-semibold text-red-600">{formatNumber(metrics.clientes_inativos)}</span>
                            <div className="text-xs text-red-600">Inativos</div>
                        </div>
                        </div>
                    </div>
                    </div>

                    <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-4">Eficiência de Retenção</h4>
                    <div className="space-y-4">
                        <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">Clientes Ativos (últimos 30 dias)</span>
                            <span className="font-semibold text-green-600">
                            {((metrics.clientes_ativos / metrics.total_clientes) * 100).toFixed(1)}%
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${(metrics.clientes_ativos / metrics.total_clientes) * 100}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            {formatNumber(metrics.clientes_ativos)} de {formatNumber(metrics.total_clientes)} clientes
                        </p>
                        </div>
                        
                        <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">Clientes Inativos (+90 dias)</span>
                            <span className="font-semibold text-red-600">
                            {((metrics.clientes_inativos / metrics.total_clientes) * 100).toFixed(1)}%
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                            className="bg-red-600 h-2 rounded-full" 
                            style={{ width: `${(metrics.clientes_inativos / metrics.total_clientes) * 100}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            {formatNumber(metrics.clientes_inativos)} clientes sem compra há mais de 90 dias
                        </p>
                        </div>

                        <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">Em Risco (31-90 dias)</span>
                            <span className="font-semibold text-yellow-600">
                            {((metrics.clientes_ativos_90d / metrics.total_clientes) * 100).toFixed(1)}%
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                            className="bg-yellow-600 h-2 rounded-full" 
                            style={{ width: `${(metrics.clientes_ativos_90d / metrics.total_clientes) * 100}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            {formatNumber(metrics.clientes_ativos_90d)} clientes precisam de reengajamento
                        </p>
                        </div>
                    </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Segmentation Tab */}
              {activeTab === 'segmentation' && segmentation && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-4">Segmentação por Valor e Recência</h4>
                      <div className="space-y-4">
                        {segmentation.map((seg, index) => (
                          <div key={index} className="border rounded-lg p-3 hover:bg-gray-50">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <span className="font-medium text-sm">{seg.segmento}</span>
                                <span className="text-xs text-gray-500 ml-2">({seg.status_ativo})</span>
                              </div>
                              <span className="font-semibold text-blue-600">
                                {formatNumber(seg.quantidade_clientes)}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-gray-500">Ticket Médio:</span>
                                <div className="font-medium">{formatCurrency(seg.ticket_medio_segmento)}</div>
                              </div>
                              <div>
                                <span className="text-gray-500">Total Gasto:</span>
                                <div className="font-medium">{formatCurrency(seg.media_gasto)}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-4">Análise por Segmento</h4>
                    <div className="space-y-4">
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex justify-between items-start mb-2">
                            <h5 className="font-medium text-blue-800">Clientes VIP</h5>
                            <span className="text-2xl font-bold text-blue-900">
                            {segmentation.filter(s => s.segmento === 'VIP').reduce((sum, s) => sum + parseInt(s.quantidade_clientes), 0)}
                            </span>
                        </div>
                        <p className="text-blue-700 text-sm">
                            Alto valor de gasto e frequência
                        </p>
                        <div className="text-xs text-blue-600 mt-2">
                            Ticket médio: {formatCurrency(
                            segmentation.filter(s => s.segmento === 'VIP').reduce((sum, s, _, arr) => 
                                sum + (parseFloat(s.ticket_medio_segmento) / arr.length), 0
                            )
                            )}
                        </div>
                        </div>
                        
                        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex justify-between items-start mb-2">
                            <h5 className="font-medium text-green-800">Clientes Ativos</h5>
                            <span className="text-2xl font-bold text-green-900">
                            {formatNumber(metrics.clientes_ativos)}
                            </span>
                        </div>
                        <p className="text-green-700 text-sm">
                            Compraram nos últimos 30 dias
                        </p>
                        <div className="text-xs text-green-600 mt-2">
                            {((metrics.clientes_ativos / metrics.total_clientes) * 100).toFixed(1)}% da base
                        </div>
                        </div>

                        <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="flex justify-between items-start mb-2">
                            <h5 className="font-medium text-purple-800">Frequência Média</h5>
                            <span className="text-2xl font-bold text-purple-900">
                            {parseFloat(metrics?.frequencia_media || 0).toFixed(1)}x
                            </span>
                        </div>
                        <p className="text-purple-700 text-sm">
                            Pedidos por cliente no período
                        </p>
                        </div>

                        <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="flex justify-between items-start mb-2">
                            <h5 className="font-medium text-orange-800">Novos Clientes</h5>
                            <span className="text-2xl font-bold text-orange-900">
                            {segmentation.filter(s => s.segmento === 'Novo').reduce((sum, s) => sum + parseInt(s.quantidade_clientes), 0)}
                            </span>
                        </div>
                        <p className="text-orange-700 text-sm">
                            Primeira compra no período
                        </p>
                        <div className="text-xs text-orange-600 mt-2">
                            Ticket médio: {formatCurrency(
                            segmentation.filter(s => s.segmento === 'Novo').reduce((sum, s, _, arr) => 
                                arr.length > 0 ? sum + (parseFloat(s.ticket_medio_segmento) / arr.length) : 0, 0
                            )
                            )}
                        </div>
                        </div>
                    </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Top Customers Tab (mantido igual) */}
              {activeTab === 'top' && topCustomers && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-gray-900">Top 10 Clientes por Valor</h4>
                    <span className="text-sm text-gray-500">
                      Total: {formatCurrency(topCustomers.reduce((sum, c) => sum + c.totalGasto, 0))}
                    </span>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Pedidos</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Gasto</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ticket Médio</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Última Compra</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {topCustomers.map((customer, index) => (
                          <tr key={customer.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-900">{customer.name}</div>
                              {customer.email && (
                                <div className="text-xs text-gray-500">{customer.email}</div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="font-semibold">{formatNumber(customer.totalPedidos)}</span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="font-semibold text-green-600">
                                {formatCurrency(customer.totalGasto)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="text-gray-700">{formatCurrency(customer.ticketMedio)}</span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="text-sm text-gray-600">
                                {customer.diasDesdeUltimaCompra === 0 ? 'Hoje' : 
                                 customer.diasDesdeUltimaCompra === 1 ? 'Ontem' :
                                 `${customer.diasDesdeUltimaCompra} dias`}
                              </div>
                              {customer.diasDesdeUltimaCompra > 30 && (
                                <div className="text-xs text-red-500">Precisa de atenção</div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {/* NOVA SEÇÃO: Métodos de Pagamento */}
              {activeTab === 'pay' &&  paymentMethods && paymentMethods.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <CreditCard size={18} className="text-blue-600" />
                    Métodos de Pagamento Preferidos pelos Clientes
                  </h4>
                  
                  {/* Cards de Pagamento */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {paymentMethods.slice(0, 6).map((payment, index) => {
                      const total = paymentMethods.reduce((sum, p) => sum + p.transacoes, 0);
                      const percentage = ((payment.transacoes / total) * 100).toFixed(1);
                      
                      return (
                        <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              {payment.online ? (
                                <div className="p-2 bg-blue-100 rounded-lg">
                                  <Globe size={18} className="text-blue-600" />
                                </div>
                              ) : (
                                <div className="p-2 bg-green-100 rounded-lg">
                                  <Wallet size={18} className="text-green-600" />
                                </div>
                              )}
                              <span className="font-semibold text-gray-900 text-sm">
                                {payment.metodo}
                              </span>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              payment.online 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {payment.online ? 'Online' : 'Presencial'}
                            </span>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Transações</span>
                              <span className="font-semibold text-gray-900">
                                {formatNumber(payment.transacoes)}
                              </span>
                            </div>
                            
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Valor Total</span>
                              <span className="font-semibold text-gray-900">
                                {formatCurrency(payment.valor)}
                              </span>
                            </div>
                            
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Ticket Médio</span>
                              <span className="font-semibold text-gray-900">
                                {formatCurrency(payment.valor / payment.transacoes)}
                              </span>
                            </div>
                            
                            {/* Barra de Porcentagem */}
                            <div className="mt-3 pt-3 border-t">
                              <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>% do Total de Transações</span>
                                <span className="font-semibold text-gray-700">{percentage}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all ${
                                    payment.online ? 'bg-blue-600' : 'bg-green-600'
                                  }`}
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Resumo Online vs Presencial */}
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(() => {
                      const onlinePayments = paymentMethods.filter(p => p.online);
                      const presencialPayments = paymentMethods.filter(p => !p.online);
                      
                      const onlineTotal = onlinePayments.reduce((sum, p) => sum + p.valor, 0);
                      const presencialTotal = presencialPayments.reduce((sum, p) => sum + p.valor, 0);
                      const totalValue = onlineTotal + presencialTotal;
                      
                      const onlineTransactions = onlinePayments.reduce((sum, p) => sum + p.transacoes, 0);
                      const presencialTransactions = presencialPayments.reduce((sum, p) => sum + p.transacoes, 0);
                      
                      return (
                        <>
                          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-5">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="p-2 bg-white rounded-lg shadow-sm">
                                <Globe size={24} className="text-blue-600" />
                              </div>
                              <div>
                                <span className="font-semibold text-blue-900 text-sm">Pagamentos Online</span>
                                <div className="text-xs text-blue-700">{onlineTransactions} transações</div>
                              </div>
                            </div>
                            <div className="text-3xl font-bold text-blue-600 mb-2">
                              {formatCurrency(onlineTotal)}
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="text-sm text-blue-700">
                                {((onlineTotal / totalValue) * 100).toFixed(1)}% do total
                              </div>
                              <div className="text-sm text-blue-700">
                                Ticket: {formatCurrency(onlineTotal / onlineTransactions)}
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-5">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="p-2 bg-white rounded-lg shadow-sm">
                                <Wallet size={24} className="text-green-600" />
                              </div>
                              <div>
                                <span className="font-semibold text-green-900 text-sm">Pagamentos Presenciais</span>
                                <div className="text-xs text-green-700">{presencialTransactions} transações</div>
                              </div>
                            </div>
                            <div className="text-3xl font-bold text-green-600 mb-2">
                              {formatCurrency(presencialTotal)}
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="text-sm text-green-700">
                                {((presencialTotal / totalValue) * 100).toFixed(1)}% do total
                              </div>
                              <div className="text-sm text-green-700">
                                Ticket: {formatCurrency(presencialTotal / presencialTransactions)}
                              </div>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Insight Card */}
                  <div className="mt-4 bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <TrendingUp size={18} className="text-purple-600" />
                      </div>
                      <div>
                        <h5 className="font-semibold text-purple-900 mb-1">💡 Insight</h5>
                        <p className="text-sm text-purple-700">
                          {(() => {
                            const onlineTotal = paymentMethods.filter(p => p.online).reduce((s, p) => s + p.valor, 0);
                            const totalValue = paymentMethods.reduce((s, p) => s + p.valor, 0);
                            const onlinePercentage = ((onlineTotal / totalValue) * 100).toFixed(1);
                            
                            if (onlinePercentage > 70) {
                              return `Seus clientes preferem fortemente pagamentos online (${onlinePercentage}%). Continue investindo em experiências digitais e considere oferecer benefícios exclusivos para pagamentos online.`;
                            } else if (onlinePercentage > 40) {
                              return `Há um equilíbrio entre pagamentos online (${onlinePercentage}%) e presenciais. Mantenha ambas as opções bem estruturadas para atender diferentes perfis de clientes.`;
                            } else {
                              return `Pagamentos presenciais dominam (${(100 - onlinePercentage).toFixed(1)}%). Considere incentivar pagamentos online com cashback ou descontos para reduzir custos operacionais.`;
                            }
                          })()}
                        </p>
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
          <p className="text-sm text-gray-500">Clique em expandir para ver a análise de clientes</p>
        </div>
      )}
    </div>
  );
}