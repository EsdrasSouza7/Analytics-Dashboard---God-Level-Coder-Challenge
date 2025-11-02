import { useState, useEffect } from 'react';
import FilterBar from './components/FilterBar';
import KPICards from './components/KPICards';
import TopProducts from './components/TopProducts';
import RevenueChart from './components/RevenueChart';
import StoreComparison from './components/StoreComparison';
import HourHeatmap from './components/HourHeatmap';
import DraggableDashboard from './components/DraggableDashboard';
import { OperationalMetrics } from './components/OperationalMetrics';
import { CustomerAnalytics } from './components/CustomerAnalytics';
import ProductPerformance from './components/ProductPerformance';
import { useDebounce } from './hooks/useDebounce';
import { DashboardControls } from './components/DashboardControls';
import { Users, GripVertical } from 'lucide-react';
import { DraggableColumnItem } from './components/DraggableColumnItem';

function App() {
  const [filters, setFilters] = useState({
    period: '30d',
    channel: 'todos',
    channelType: 'todos',
    store: 'todas',
    subBrand: 'todas',
    storeStatus: 'ativas'
  });

  useEffect(() => {
    console.log('🔄 App.jsx - Filtros mudaram:', filters);
  }, [filters]);

  const [dashboardConfig, setDashboardConfig] = useState(() => {
    const saved = localStorage.getItem('dashboard-config');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        visibleComponents: parsed.visibleComponents || {
          revenueChart: true,
          topProducts: true,
          hourHeatmap: true,
          storeComparison: true,
          kpiCards: true,
          customerAnalytics: true,
          operationalMetrics: true,
          productPerformance: true
        },
        layout: parsed.layout || 'single-column',
        columnLayout: parsed.columnLayout || {
          left: ['revenueChart', 'customerAnalytics', 'operationalMetrics'],
          right: ['topProducts', 'hourHeatmap', 'storeComparison', 'productPerformance']
        }
      };
    }
    // Configuração padrão
    return {
      visibleComponents: {
        revenueChart: true,
        topProducts: true,
        hourHeatmap: true,
        storeComparison: true,
        kpiCards: true,
        customerAnalytics: true,
        operationalMetrics: true,
        productPerformance: true
      },
      layout: 'single-column',
      columnLayout: {
        left: ['revenueChart', 'customerAnalytics', 'operationalMetrics'],
        right: ['topProducts', 'hourHeatmap', 'storeComparison', 'productPerformance']
      }
    };
  });

  // ESTADO PARA MINIMIZAR COMPONENTES
  const [minimizedComponents, setMinimizedComponents] = useState(() => {
    const saved = localStorage.getItem('dashboard-config');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.minimizedComponents || {};
    }
    return {};
  });

  // FUNÇÃO PARA TOGGLE MINIMIZE
  const toggleMinimize = (componentId) => {
    setMinimizedComponents(prev => ({
      ...prev,
      [componentId]: !prev[componentId]
    }));
  };
  const debouncedFilters = useDebounce(filters, 200);

  const [columnLayout, setColumnLayout] = useState({
    left: ['revenueChart', 'customerAnalytics', 'operationalMetrics'],
    right: ['topProducts', 'hourHeatmap', 'storeComparison', 'productPerformance']
  });

  const moveComponent = (componentId, fromColumn, toColumn) => {
    setColumnLayout(prev => {
      const newLayout = { ...prev };
      
      // Remove da coluna origem
      newLayout[fromColumn] = newLayout[fromColumn].filter(id => id !== componentId);
      
      // Adiciona na coluna destino
      if (!newLayout[toColumn].includes(componentId)) {
        newLayout[toColumn].push(componentId);
      }
      
      return newLayout;
    });
  };

  const Column = ({ columnId, components, onDrop }) => {
    const handleDragOver = (e) => {
      e.preventDefault();
    };

    const handleDrop = (e) => {
      e.preventDefault();
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      if (data.fromColumn !== columnId) {
        onDrop(data.componentId, data.fromColumn, columnId);
      }
    };

    const componentMap = {
      revenueChart: (
        <RevenueChart 
          key="revenue-chart" 
          filters={debouncedFilters}
          isMinimized={minimizedComponents.revenueChart}
          onMinimize={() => toggleMinimize('revenueChart')}
        />
      ),
      topProducts: (
        <TopProducts 
          key="top-products" 
          filters={debouncedFilters} 
          limit={10}
          isMinimized={minimizedComponents.topProducts}
          onMinimize={() => toggleMinimize('topProducts')}
        />
      ),
      hourHeatmap: (
        <HourHeatmap 
          key="hour-heatmap" 
          filters={debouncedFilters}
          isMinimized={minimizedComponents.hourHeatmap}
          onMinimize={() => toggleMinimize('hourHeatmap')}
        />
      ),
      storeComparison: (
        <StoreComparison 
          key="store-comparison" 
          filters={debouncedFilters}
          isMinimized={minimizedComponents.storeComparison}
          onMinimize={() => toggleMinimize('storeComparison')}
        />
      ),
      customerAnalytics: (
        <CustomerAnalytics 
          key="customer-analytics" 
          filters={debouncedFilters}
          isMinimized={minimizedComponents.customerAnalytics}
          onMinimize={() => toggleMinimize('customerAnalytics')}
        />
      ),
      operationalMetrics: (
        <OperationalMetrics 
          key="operational-metrics" 
          filters={debouncedFilters}
          isMinimized={minimizedComponents.operationalMetrics}
          onMinimize={() => toggleMinimize('operationalMetrics')}
        />
      ),
      productPerformance: (
        <ProductPerformance 
          key="product-performance" 
          filters={debouncedFilters}
          isMinimized={minimizedComponents.productPerformance}
          onMinimize={() => toggleMinimize('productPerformance')}
        />
      ),
    };

    const hasComponents = components.some(id => dashboardConfig.visibleComponents[id]);

    return (
      <div 
        className={`min-h-96 ${hasComponents ? '' : 'border-2 border-dashed border-gray-300 rounded-lg'}`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {components.map(componentId => 
          dashboardConfig.visibleComponents[componentId] && (
            <DraggableColumnItem 
              key={componentId}
              componentId={componentId}
              fromColumn={columnId}
              onMove={moveComponent}
            >
              {componentMap[componentId]}
            </DraggableColumnItem>
          )
        )}
        
        {/* Área vazia para drop - só mostra quando não tem componentes */}
        {!hasComponents && (
          <div className="text-center text-gray-400 py-16 transition-colors hover:border-gray-400">
            <GripVertical size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Arraste componentes para cá</p>
            <p className="text-sm mt-1">Solte aqui para mover para esta coluna</p>
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    const configToSave = {
      ...dashboardConfig,
      columnLayout,
      minimizedComponents
    };
    localStorage.setItem('dashboard-config', JSON.stringify(configToSave));
  }, [dashboardConfig, columnLayout, minimizedComponents]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-sm text-gray-500">Restaurantes Challenge Brand</p>
            </div>
            
            <div className="flex items-center gap-4">
              <DashboardControls 
                config={dashboardConfig} 
                onConfigChange={setDashboardConfig} 
              />
              <div className="text-sm text-gray-500 hidden md:block">
                💡 Dica: Arraste os componentes usando ⋮⋮ para reorganizar
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Filtros */}
      <FilterBar filters={filters} onChange={setFilters} />

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto p-6 drag-column">
        {/* KPI Cards (sempre fixo no topo) */}
        {dashboardConfig.visibleComponents.kpiCards && (
          <div className="mb-6">
            <KPICards filters={debouncedFilters} />
          </div>
        )}

        {/* Componentes com Layout Condicional */}
          {dashboardConfig.layout === 'two-columns' ? (
            // LAYOUT DE 2 COLUNAS USANDO MAIS ESPAÇO
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 min-h-screen">
              {/* Coluna Esquerda */}
              <div className="space-y-6">
                <Column 
                  columnId="left"
                  components={columnLayout.left}
                  onDrop={moveComponent}
                />
              </div>
              
              {/* Coluna Direita */}
              <div className="space-y-6">
                <Column 
                  columnId="right"
                  components={columnLayout.right}
                  onDrop={moveComponent}
                />
              </div>
            </div>
          ) : (
            // Layout de 1 coluna (original)
            <DraggableDashboard>
              {dashboardConfig.visibleComponents.revenueChart && (
                <RevenueChart key="revenue-chart" filters={debouncedFilters} />
              )}
              {dashboardConfig.visibleComponents.topProducts && (
                <TopProducts key="top-products" filters={debouncedFilters} limit={10} />
              )}
              {dashboardConfig.visibleComponents.hourHeatmap && (
                <HourHeatmap key="hour-heatmap" filters={debouncedFilters} />
              )}
              {dashboardConfig.visibleComponents.storeComparison && (
                <StoreComparison key="store-comparison" filters={debouncedFilters} />
              )}
              {dashboardConfig.visibleComponents.customerAnalytics && (
                <CustomerAnalytics key="customer-analytics" filters={debouncedFilters} />
              )}
              {dashboardConfig.visibleComponents.operationalMetrics && (
                <OperationalMetrics key="operational-metrics" filters={debouncedFilters} />
              )}
              {dashboardConfig.visibleComponents.productPerformance && (
                <ProductPerformance key="product-performance" filters={debouncedFilters} />
              )}
            </DraggableDashboard>
          )}
      </div>
    </div>
  );
}

export default App;