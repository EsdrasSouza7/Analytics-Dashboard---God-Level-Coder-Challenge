import { useState } from 'react';
import { Plus, Columns, X } from 'lucide-react';
import { TrendingUp, Package, Clock, Store, Users, Gauge } from 'lucide-react';

export function DashboardControls({ config, onConfigChange }) {
  const [showModal, setShowModal] = useState(false);

  const availableComponents = [
    { 
      id: 'revenueChart', 
      name: 'Gráfico de Receita', 
      icon: TrendingUp,
      description: 'Evolução da receita e pedidos ao longo do tempo'
    },
    { 
      id: 'topProducts', 
      name: 'Top Produtos', 
      icon: Package,
      description: 'Produtos mais vendidos por receita e quantidade'
    },
    { 
      id: 'hourHeatmap', 
      name: 'Mapa de Calor', 
      icon: Clock,
      description: 'Vendas por dia da semana e horário'
    },
    { 
      id: 'storeComparison', 
      name: 'Comparação de Lojas', 
      icon: Store,
      description: 'Performance comparativa entre lojas'
    },
    { 
      id: 'customerAnalytics', 
      name: 'Análise de Clientes', 
      icon: Users,
      description: 'Comportamento e segmentação de clientes'
    },
    { 
      id: 'operationalMetrics', 
      name: 'Métricas Operacionais', 
      icon: Gauge,
      description: 'Tempos de produção e eficiência'
    }
  ];

  const toggleComponent = (componentId) => {
    onConfigChange({
      ...config,
      visibleComponents: {
        ...config.visibleComponents,
        [componentId]: !config.visibleComponents[componentId]
      }
    });
  };

  const toggleLayout = () => {
    onConfigChange({
      ...config,
      layout: config.layout === 'single-column' ? 'two-columns' : 'single-column'
    });
  };

  const getActiveComponentsCount = () => {
    return Object.values(config.visibleComponents).filter(Boolean).length-1;
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Botão Layout */}
        <button
          onClick={toggleLayout}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          title={config.layout === 'single-column' ? 'Mudar para 2 colunas' : 'Mudar para 1 coluna'}
        >
          <Columns size={16} />
          {config.layout === 'single-column' ? '2 Colunas' : '1 Coluna'}
        </button>

        {/* Botão Adicionar Componente */}
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          Componentes ({getActiveComponentsCount()})
        </button>
      </div>

      {/* Modal de Componentes */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            {/* Header do Modal */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Gerenciar Componentes do Dashboard</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Selecione quais componentes mostrar e ajuste o layout
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Lista de Componentes */}
            <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
              {availableComponents.map(component => (
                <div 
                  key={component.id} 
                  className={`flex items-center justify-between p-4 border rounded-lg transition-all ${
                    config.visibleComponents[component.id] 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`p-2 rounded-lg ${
                      config.visibleComponents[component.id] 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      <component.icon size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${
                          config.visibleComponents[component.id] 
                            ? 'text-gray-900' 
                            : 'text-gray-500'
                        }`}>
                          {component.name}
                        </span>
                        {!config.visibleComponents[component.id] && (
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                            Oculto
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {component.description}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => toggleComponent(component.id)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${
                      config.visibleComponents[component.id] 
                        ? 'bg-blue-600' 
                        : 'bg-gray-300'
                    }`}
                  >
                    <div 
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        config.visibleComponents[component.id] 
                          ? 'left-7' 
                          : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>

            {/* Footer do Modal */}
            <div className="flex items-center justify-between p-6 border-t bg-gray-50">
              <div className="text-sm text-gray-600">
                {getActiveComponentsCount()} de {availableComponents.length} componentes ativos
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}