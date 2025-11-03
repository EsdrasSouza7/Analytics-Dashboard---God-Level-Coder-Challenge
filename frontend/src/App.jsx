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
import { PeriodComparison } from './components/PeriodComparison';
import { DeliveryMetrics } from './components/DeliveryMetrics';
import { DashboardControls } from './components/DashboardControls';
import { DraggableColumnItem } from './components/DraggableColumnItem';
import { useDebounce } from './hooks/useDebounce';
import ExportReport from './components/ExportReport';
import { GripVertical } from 'lucide-react';

function App() {
  const [filters, setFilters] = useState({
    period: '30d',
    channel: 'todos',
    channelType: 'todos',
    store: 'todas',
    subBrand: 'todas',
    storeStatus: 'ativas'
  });

  const [showExportModal, setShowExportModal] = useState(false);

  const [dashboardConfig, setDashboardConfig] = useState(() => {
    const saved = localStorage.getItem('dashboard-config');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      visibleComponents: {
        revenueChart: true,
        topProducts: true,
        hourHeatmap: true,
        storeComparison: true,
        kpiCards: true,
        customerAnalytics: true,
        operationalMetrics: true,
        productPerformance: true,
        periodComparison: true ,
        deliveryMetrics: true
      },
      layout: 'single-column',
      columnLayout: {
        left: ['revenueChart', 'periodComparison', 'customerAnalytics', 'operationalMetrics'],
        right: ['topProducts', 'hourHeatmap', 'storeComparison', 'productPerformance', 'deliveryMetrics']
      },
      minimizedComponents: {}
    };
  });

  useEffect(() => {
    console.log('📄 App.jsx - Filtros mudaram:', filters);
  }, [filters]);

  const debouncedFilters = useDebounce(filters, 200);

  const toggleMinimize = (componentId) => {
    setDashboardConfig(prev => ({
      ...prev,
      minimizedComponents: {
        ...prev.minimizedComponents,
        [componentId]: !prev.minimizedComponents?.[componentId]
      }
    }));
  };

  const moveComponent = (componentId, fromColumn, toColumn) => {
    setDashboardConfig(prev => {
      const newLayout = { ...prev.columnLayout };
      newLayout[fromColumn] = newLayout[fromColumn].filter(id => id !== componentId);
      if (!newLayout[toColumn].includes(componentId)) {
        newLayout[toColumn].push(componentId);
      }
      return {
        ...prev,
        columnLayout: newLayout
      };
    });
  };

  useEffect(() => {
    localStorage.setItem('dashboard-config', JSON.stringify(dashboardConfig));
  }, [dashboardConfig]);

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
          isMinimized={dashboardConfig.minimizedComponents?.revenueChart}
          onMinimize={() => toggleMinimize('revenueChart')}
        />
      ),
      periodComparison: (
        <PeriodComparison 
          key="period-comparison" 
          filters={debouncedFilters}
          isMinimized={dashboardConfig.minimizedComponents?.periodComparison}
          onMinimize={() => toggleMinimize('periodComparison')}
        />
      ),
      topProducts: (
        <TopProducts 
          key="top-products" 
          filters={debouncedFilters} 
          limit={10}
          isMinimized={dashboardConfig.minimizedComponents?.topProducts}
          onMinimize={() => toggleMinimize('topProducts')}
        />
      ),
      hourHeatmap: (
        <HourHeatmap 
          key="hour-heatmap" 
          filters={debouncedFilters}
          isMinimized={dashboardConfig.minimizedComponents?.hourHeatmap}
          onMinimize={() => toggleMinimize('hourHeatmap')}
        />
      ),
      storeComparison: (
        <StoreComparison 
          key="store-comparison" 
          filters={debouncedFilters}
          isMinimized={dashboardConfig.minimizedComponents?.storeComparison}
          onMinimize={() => toggleMinimize('storeComparison')}
        />
      ),
      customerAnalytics: (
        <CustomerAnalytics 
          key="customer-analytics" 
          filters={debouncedFilters}
          isMinimized={dashboardConfig.minimizedComponents?.customerAnalytics}
          onMinimize={() => toggleMinimize('customerAnalytics')}
        />
      ),
      operationalMetrics: (
        <OperationalMetrics 
          key="operational-metrics" 
          filters={debouncedFilters}
          isMinimized={dashboardConfig.minimizedComponents?.operationalMetrics}
          onMinimize={() => toggleMinimize('operationalMetrics')}
        />
      ),
      productPerformance: (
        <ProductPerformance 
          key="product-performance" 
          filters={debouncedFilters}
          isMinimized={dashboardConfig.minimizedComponents?.productPerformance}
          onMinimize={() => toggleMinimize('productPerformance')}
        />
      ),
      deliveryMetrics: (
        <DeliveryMetrics 
          key="delivery-metrics" 
          filters={debouncedFilters}
          isMinimized={dashboardConfig.minimizedComponents?.deliveryMetrics}
          onMinimize={() => toggleMinimize('deliveryMetrics')}
        />
      )
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
                onConfigChange={(newConfig) => {
                  setDashboardConfig(newConfig);
                }}
                onExport={() => setShowExportModal(true)}
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

        {dashboardConfig.layout === 'two-columns' ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 min-h-screen">
            <div className="space-y-6">
              <Column 
                columnId="left"
                components={dashboardConfig.columnLayout.left}
                onDrop={moveComponent}
              />
            </div>
            <div className="space-y-6">
              <Column 
                columnId="right"
                components={dashboardConfig.columnLayout.right}
                onDrop={moveComponent}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
          <DraggableDashboard 
            dashboardConfig={dashboardConfig}
            onConfigChange={setDashboardConfig}
          >
            {dashboardConfig.visibleComponents.revenueChart && (
              <RevenueChart 
                key="revenue-chart" 
                filters={debouncedFilters}
              />
            )}
            {dashboardConfig.visibleComponents.topProducts && (
              <TopProducts 
                key="top-products" 
                filters={debouncedFilters} 
                limit={10}
              />
            )}
            {dashboardConfig.visibleComponents.hourHeatmap && (
              <HourHeatmap 
                key="hour-heatmap" 
                filters={debouncedFilters}
              />
            )}
            {dashboardConfig.visibleComponents.storeComparison && (
              <StoreComparison 
                key="store-comparison" 
                filters={debouncedFilters}
              />
            )}
            {dashboardConfig.visibleComponents.customerAnalytics && (
              <CustomerAnalytics 
                key="customer-analytics" 
                filters={debouncedFilters}
              />
            )}
            {dashboardConfig.visibleComponents.operationalMetrics && (
              <OperationalMetrics 
                key="operational-metrics" 
                filters={debouncedFilters}
              />
            )}
            {dashboardConfig.visibleComponents.productPerformance && (
              <ProductPerformance 
                key="product-performance" 
                filters={debouncedFilters}
              />
            )}
            {dashboardConfig.visibleComponents.periodComparison && (
              <PeriodComparison 
                filters={debouncedFilters}
                key="period-comparison"
              />
            )}
            {dashboardConfig.visibleComponents.deliveryMetrics && (
              <DeliveryMetrics 
                filters={debouncedFilters}
                key="delivery-metrics"
              />
            )}
            </DraggableDashboard>
          </div>
        )}
      </div>

      {showExportModal && (
        <ExportReport 
          filters={filters} 
          onClose={() => setShowExportModal(false)} 
        />
      )}
    </div>
  );
}

export default App;