import { useState, useEffect, cloneElement } from 'react';

export function DraggableDashboard({ children, dashboardConfig, onConfigChange }) {
  // Converter children para array e filtrar apenas os visíveis
  const visibleChildren = Array.isArray(children) 
    ? children.filter(child => child) 
    : children ? [children] : [];

  const [items, setItems] = useState(() => 
    visibleChildren.map((child, index) => ({
      id: child.key || `item-${index}`,
      isMinimized: dashboardConfig?.minimizedComponents?.[child.key] || false
    }))
  );
  
  const [draggedItem, setDraggedItem] = useState(null);

  // Atualizar items quando children mudar (componentes adicionados/removidos)
  useEffect(() => {
    const newItems = visibleChildren.map((child) => {
      const existingItem = items.find(item => item.id === child.key);
      return {
        id: child.key || `item-${visibleChildren.indexOf(child)}`,
        isMinimized: existingItem?.isMinimized || dashboardConfig?.minimizedComponents?.[child.key] || false
      };
    });
    
    // Só atualiza se houver mudança real
    if (JSON.stringify(newItems.map(i => i.id)) !== JSON.stringify(items.map(i => i.id))) {
      setItems(newItems);
    }
  }, [children, dashboardConfig?.minimizedComponents]);

  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.style.opacity = '0.4';
  };

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = '1';
    setDraggedItem(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    
    if (draggedItem === null || draggedItem === dropIndex) return;

    const newItems = [...items];
    const draggedItemContent = newItems[draggedItem];
    
    newItems.splice(draggedItem, 1);
    newItems.splice(dropIndex, 0, draggedItemContent);
    
    setItems(newItems);
  };

  const toggleMinimize = (index) => {
    const itemId = items[index].id;
    
    setItems(prevItems => 
      prevItems.map((item, i) => 
        i === index ? { ...item, isMinimized: !item.isMinimized } : item
      )
    );

    // Atualizar no dashboardConfig
    if (onConfigChange && dashboardConfig) {
      onConfigChange({
        ...dashboardConfig,
        minimizedComponents: {
          ...dashboardConfig.minimizedComponents,
          [itemId]: !items[index].isMinimized
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      {items.map((item, index) => {
        const childComponent = visibleChildren.find(
          child => child.key === item.id
        );

        if (!childComponent) return null;

        return (
          <div
            key={item.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            className="transition-all duration-200"
          >
            {cloneElement(childComponent, {
              isMinimized: item.isMinimized,
              onMinimize: () => toggleMinimize(index),
              dragHandleProps: {
                onMouseDown: (e) => e.stopPropagation()
              }
            })}
          </div>
        );
      })}
    </div>
  );
}

export default DraggableDashboard;