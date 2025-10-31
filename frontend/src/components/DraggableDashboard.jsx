import { useState, useEffect, cloneElement } from 'react';

export function DraggableDashboard({ children }) {
  // Converter children para array
  const childrenArray = Array.isArray(children) ? children : [children];
  
  const [items, setItems] = useState(
    childrenArray.map((child, index) => ({
      id: child.key || `item-${index}`,
      isMinimized: false
    }))
  );
  const [draggedItem, setDraggedItem] = useState(null);

  // Atualizar quando children mudar (sem resetar a ordem)
  useEffect(() => {
    setItems(prevItems => {
      // Manter a ordem e estado de minimizado, apenas atualizar os componentes
      return prevItems.map(item => {
        const newChild = childrenArray.find(child => (child.key || `item-${childrenArray.indexOf(child)}`) === item.id);
        return {
          ...item,
          // Mantém isMinimized do estado anterior
        };
      });
    });
  }, [children]);

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
    setItems(prevItems => 
      prevItems.map((item, i) => 
        i === index ? { ...item, isMinimized: !item.isMinimized } : item
      )
    );
  };

  return (
    <div className="space-y-6">
      {items.map((item, index) => {
        // Encontrar o componente child correspondente
        const childComponent = childrenArray.find(
          child => (child.key || `item-${childrenArray.indexOf(child)}`) === item.id
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
            {/* Clonar o componente e injetar as props necessárias */}
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