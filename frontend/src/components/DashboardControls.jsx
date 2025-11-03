import { useState } from 'react';
import { Plus, Columns, X, Search, BarChart3, Users, Store, Clock, Package, Gauge, TrendingUp, Download, Sparkles } from 'lucide-react';

export function DashboardControls({ config, onConfigChange, onExport }) {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = {
    financial: {
      name: 'Financeiro',
      icon: TrendingUp,
      color: 'blue',
      description: 'Métricas de receita e vendas'
    },
    products: {
      name: 'Produtos',
      icon: Package,
      color: 'green',
      description: 'Análise de produtos e performance'
    },
    customers: {
      name: 'Clientes',
      icon: Users,
      color: 'purple',
      description: 'Comportamento e segmentação'
    },
    operations: {
      name: 'Operacional',
      icon: Gauge,
      color: 'orange',
      description: 'Eficiência e processos'
    },
    stores: {
      name: 'Lojas',
      icon: Store,
      color: 'pink',
      description: 'Comparação e performance'
    },
    time: {
      name: 'Temporal',
      icon: Clock,
      color: 'indigo',
      description: 'Análise por período e horário'
    }
  };

  const availableComponents = [
    { 
      id: 'aiQueryBuilder', 
      name: 'AI Query Builder (BETA)', 
      icon: Sparkles,  // Importar: import { Sparkles } from 'lucide-react'
      category: 'financial',
      description: 'Faça perguntas em linguagem natural e a IA gera análises',
      tags: ['IA', 'AI', 'perguntas', 'natural']
    },
    { 
      id: 'revenueChart', 
      name: 'Gráfico de Receita', 
      icon: TrendingUp,
      category: 'financial',
      description: 'Evolução da receita e pedidos ao longo do tempo',
      tags: ['receita', 'vendas', 'timeline']
    },
    { 
      id: 'topProducts', 
      name: 'Top Produtos', 
      icon: Package,
      category: 'products',
      description: 'Produtos mais vendidos por receita e quantidade',
      tags: ['produtos', 'ranking', 'vendas']
    },
    { 
      id: 'productPerformance',
      name: 'Performance de Produtos',
      icon: BarChart3,
      category: 'products',
      description: 'Análise detalhada do desempenho dos produtos',
      tags: ['produtos', 'performance', 'análise']
    },
    { 
      id: 'customerAnalytics', 
      name: 'Análise de Clientes', 
      icon: Users,
      category: 'customers',
      description: 'Comportamento e segmentação de clientes',
      tags: ['clientes', 'comportamento', 'segmentação']
    },
    { 
      id: 'operationalMetrics', 
      name: 'Métricas Operacionais', 
      icon: Gauge,
      category: 'operations',
      description: 'Tempos de produção e eficiência operacional',
      tags: ['operação', 'tempo', 'eficiência']
    },
    { 
      id: 'storeComparison', 
      name: 'Comparação de Lojas', 
      icon: Store,
      category: 'stores',
      description: 'Performance comparativa entre lojas',
      tags: ['lojas', 'comparação', 'performance']
    },
    { 
      id: 'hourHeatmap', 
      name: 'Mapa de Calor', 
      icon: Clock,
      category: 'time',
      description: 'Vendas por dia da semana e horário',
      tags: ['horário', 'heatmap', 'temporal']
    },
    {
      id: 'periodComparison',
      name: 'Comparação de Períodos',
      icon: BarChart3,
      category: 'time',
      description: 'Comparação de métricas entre diferentes períodos',
      tags: ['comparação', 'períodos', 'análise']
    },
    {
      id: 'deliveryMetrics',
      name: 'Métricas de Delivery',
      icon: Package,
      category: 'operations',
      description: 'Análise de desempenho e eficiência do delivery',
      tags: ['delivery', 'entrega', 'eficiência']
    }
  ];

  const toggleComponent = (componentId) => {
    const newVisibleState = !config.visibleComponents[componentId];
    
    const updatedConfig = {
      ...config,
      visibleComponents: {
        ...config.visibleComponents,
        [componentId]: newVisibleState
      }
    };

    onConfigChange(updatedConfig);
  };

  const toggleLayout = () => {
    onConfigChange({
      ...config,
      layout: config.layout === 'single-column' ? 'two-columns' : 'single-column'
    });
  };

  const getActiveComponentsCount = () => {
    return Object.values(config.visibleComponents).filter(Boolean).length - 1;
  };

  // Filtrar componentes por busca e categoria
  const filteredComponents = availableComponents.filter(component => {
    const matchesSearch = component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         component.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         component.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || component.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Agrupar componentes por categoria
  const groupedComponents = availableComponents.reduce((acc, component) => {
    if (!acc[component.category]) {
      acc[component.category] = [];
    }
    acc[component.category].push(component);
    return acc;
  }, {});

  const getCategoryColor = (color) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600 border-blue-200',
      green: 'bg-green-100 text-green-600 border-green-200',
      purple: 'bg-purple-100 text-purple-600 border-purple-200',
      orange: 'bg-orange-100 text-orange-600 border-orange-200',
      pink: 'bg-pink-100 text-pink-600 border-pink-200',
      indigo: 'bg-indigo-100 text-indigo-600 border-indigo-200'
    };
    return colors[color] || colors.blue;
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Botão Exportar */}
        {onExport && (
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download size={16} />
            <span className="hidden md:inline">Exportar</span>
          </button>
        )}

        {/* Botão Layout */}
        <button
          onClick={toggleLayout}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          title={config.layout === 'single-column' ? 'Mudar para 2 colunas' : 'Mudar para 1 coluna'}
        >
          <Columns size={16} />
          <span className="hidden md:inline">
            {config.layout === 'single-column' ? '2 Colunas' : '1 Coluna'}
          </span>
        </button>

        {/* Botão Adicionar Componente */}
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Componentes</span> ({getActiveComponentsCount()})
        </button>
      </div>

      {/* Modal de Componentes - MAIOR E MELHORADO */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header do Modal */}
            <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Gerenciar Dashboard</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Personalize seu dashboard com os componentes que você precisa
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-white rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Barra de Busca e Filtros */}
            <div className="p-6 border-b bg-gray-50">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Busca */}
                <div className="flex-1 relative">
                  <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar componentes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Filtro de Categoria */}
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                      selectedCategory === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Todos ({availableComponents.length})
                  </button>
                  {Object.entries(categories).map(([key, cat]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedCategory(key)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                        selectedCategory === key
                          ? `${getCategoryColor(cat.color)} border`
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <cat.icon size={14} className="inline mr-1" />
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Lista de Componentes Agrupados */}
            <div className="flex-1 overflow-y-auto p-6">
              {selectedCategory === 'all' ? (
                // Visualização agrupada por categoria
                <div className="space-y-8">
                  {Object.entries(categories).map(([categoryKey, category]) => {
                    const componentsInCategory = groupedComponents[categoryKey] || [];
                    if (componentsInCategory.length === 0) return null;

                    return (
                      <div key={categoryKey}>
                        {/* Header da Categoria */}
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`p-2 rounded-lg ${getCategoryColor(category.color)}`}>
                            <category.icon size={20} />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{category.name}</h4>
                            <p className="text-xs text-gray-500">{category.description}</p>
                          </div>
                        </div>

                        {/* Componentes da Categoria */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {componentsInCategory.map(component => (
                            <ComponentCard
                              key={component.id}
                              component={component}
                              isActive={config.visibleComponents[component.id]}
                              onToggle={() => toggleComponent(component.id)}
                              categoryColor={category.color}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                // Visualização filtrada
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filteredComponents.map(component => {
                    const category = categories[component.category];
                    return (
                      <ComponentCard
                        key={component.id}
                        component={component}
                        isActive={config.visibleComponents[component.id]}
                        onToggle={() => toggleComponent(component.id)}
                        categoryColor={category.color}
                      />
                    );
                  })}
                </div>
              )}

              {filteredComponents.length === 0 && (
                <div className="text-center py-12">
                  <Search size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-600 font-medium">Nenhum componente encontrado</p>
                  <p className="text-gray-500 text-sm mt-1">Tente ajustar sua busca ou filtros</p>
                </div>
              )}
            </div>

            {/* Footer do Modal */}
            <div className="flex items-center justify-between p-6 border-t bg-gray-50">
              <div className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">{getActiveComponentsCount()}</span> de {availableComponents.length} componentes ativos
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Componente de Card Individual
function ComponentCard({ component, isActive, onToggle, categoryColor }) {
  const getColorClasses = (color) => {
    const activeColors = {
      blue: 'border-blue-500 bg-blue-50',
      green: 'border-green-500 bg-green-50',
      purple: 'border-purple-500 bg-purple-50',
      orange: 'border-orange-500 bg-orange-50',
      pink: 'border-pink-500 bg-pink-50',
      indigo: 'border-indigo-500 bg-indigo-50'
    };

    const iconColors = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600',
      orange: 'bg-orange-100 text-orange-600',
      pink: 'bg-pink-100 text-pink-600',
      indigo: 'bg-indigo-100 text-indigo-600'
    };

    return {
      card: isActive ? activeColors[color] : 'border-gray-200 bg-white',
      icon: isActive ? iconColors[color] : 'bg-gray-100 text-gray-400'
    };
  };

  const colors = getColorClasses(categoryColor);

  return (
    <div 
      className={`relative p-5 border-2 rounded-lg transition-all hover:shadow-md cursor-pointer ${colors.card}`}
      onClick={onToggle}
    >
      <div className="flex items-start gap-4">
        {/* Ícone */}
        <div className={`p-3 rounded-lg ${colors.icon} flex-shrink-0`}>
          <component.icon size={24} />
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h5 className={`font-semibold ${isActive ? 'text-gray-900' : 'text-gray-600'}`}>
              {component.name}
            </h5>
            {!isActive && (
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                Oculto
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-3">
            {component.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1">
            {component.tags.map((tag, index) => (
              <span 
                key={index}
                className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Toggle Switch */}
        <div className="flex-shrink-0">
          <div 
            className={`w-12 h-6 rounded-full transition-colors relative ${
              isActive ? 'bg-blue-600' : 'bg-gray-300'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
          >
            <div 
              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                isActive ? 'left-7' : 'left-1'
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}