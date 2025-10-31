import React from 'react';

export function DraggableColumnItem({ componentId, fromColumn, onMove, children }) {
  const handleDragStart = (e) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      componentId,
      fromColumn
    }));
    e.dataTransfer.effectAllowed = 'move';
    
    // Adiciona efeito visual durante o drag
    e.currentTarget.style.opacity = '0.6';
  };

  const handleDragEnd = (e) => {
    // Remove efeito visual
    e.currentTarget.style.opacity = '1';
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Necessário para permitir drop
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      className="mb-6 cursor-grab active:cursor-grabbing transition-opacity"
    >
      {/* Renderiza o children com todas as props originais */}
      {children}
    </div>
  );
}