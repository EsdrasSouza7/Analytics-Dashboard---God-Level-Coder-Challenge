import { useEffect, useState } from 'react';
import { DollarSign, ShoppingBag, TrendingUp, Users, Clock, Percent } from 'lucide-react';
import { useFetchWithCache } from '../hooks/useFetchWithCache';
import { KPICardsSkeleton } from './LoadingSpinner';

export function KPICards({ filters }) {
  const params = new URLSearchParams();
  if (filters.startDate && filters.endDate) {
    params.append('startDate', filters.startDate);
    params.append('endDate', filters.endDate);
  }
  if (filters.period && (!filters.startDate || !filters.endDate)) {
    params.append('period', filters.period);
  }
  if (filters.channel && filters.channel !== 'todos') {
    params.append('channel', filters.channel);
  }
  if (filters.channelType && filters.channelType !== 'todos') {
    params.append('channelType', filters.channelType);
  }
  if (filters.store && filters.store !== 'todas') {
    params.append('store', filters.store);
  }
  if (filters.subBrand && filters.subBrand !== 'todas') {
    params.append('subBrand', filters.subBrand);
  }

  const url = `http://localhost:3001/api/metrics?${params.toString()}`;
  const { data: metrics, loading, error } = useFetchWithCache(url, [filters]);

  // Formatar moeda brasileira
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Formatar número com separador de milhares
  const formatNumber = (value) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  // Formatar tempo em minutos
  const formatTime = (seconds) => {
    if (!seconds) return '0min';
    const minutes = Math.floor(seconds / 60);
    return `${minutes}min`;
  };

  // Loading skeleton
  if (loading && !metrics) {
    return <KPICardsSkeleton />;  
  } 

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800 font-medium">Erro ao carregar métricas</p>
        <p className="text-red-600 text-sm mt-1">{error}</p>
      </div>
    );
  }

  const cards = [
    {
      label: 'Faturamento',
      value: formatCurrency(metrics.faturamento),
      change: metrics.crescimento.faturamento,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Total de receita'
    },
    {
      label: 'Pedidos',
      value: formatNumber(metrics.pedidos),
      change: metrics.crescimento.pedidos,
      icon: ShoppingBag,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'Total de vendas'
    },
    {
      label: 'Ticket Médio',
      value: formatCurrency(metrics.ticketMedio),
      change: null, // Sem comparação por enquanto
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      description: 'Valor médio por pedido'
    },
    {
      label: 'Clientes',
      value: formatNumber(metrics.clientes),
      change: null,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: 'Clientes únicos'
    }
  ];

  // Cards secundários (se houver dados)
  const secondaryCards = [];
  
  if (metrics.tempoMedioProducao) {
    secondaryCards.push({
      label: 'Tempo Produção',
      value: formatTime(metrics.tempoMedioProducao),
      icon: Clock,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      description: 'Tempo médio de preparo'
    });
  }

  if (metrics.tempoMedioEntrega) {
    secondaryCards.push({
      label: 'Tempo Entrega',
      value: formatTime(metrics.tempoMedioEntrega),
      icon: Clock,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      description: 'Tempo médio de entrega'
    });
  }

  if (metrics.descontos > 0) {
    secondaryCards.push({
      label: 'Descontos',
      value: formatCurrency(metrics.descontos),
      icon: Percent,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      description: 'Total em descontos'
    });
  }

  return (
    <div className="space-y-4">
      {/* Cards Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, index) => (
          <div 
            key={index} 
            className="bg-white rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow"
          >
            {/* Header do Card */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">
                {card.label}
              </span>
              <div className={`${card.bgColor} p-2 rounded-lg`}>
                <card.icon size={20} className={card.color} />
              </div>
            </div>

            {/* Valor Principal */}
            <div className="mb-2">
              <span className="text-2xl font-bold text-gray-900">
                {card.value}
              </span>
            </div>

            {/* Crescimento / Descrição */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {card.description}
              </span>
              
              {card.change !== null && card.change !== undefined && (
                <span 
                  className={`text-xs font-medium flex items-center gap-1 ${
                    card.change >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {card.change >= 0 ? '↑' : '↓'} {Math.abs(card.change)}%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Cards Secundários (se existirem) */}
      {secondaryCards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {secondaryCards.map((card, index) => (
            <div 
              key={index} 
              className="bg-white rounded-lg p-5 shadow-sm border hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-gray-600 block mb-1">
                    {card.label}
                  </span>
                  <span className="text-xl font-bold text-gray-900">
                    {card.value}
                  </span>
                  <span className="text-xs text-gray-500 block mt-1">
                    {card.description}
                  </span>
                </div>
                <div className={`${card.bgColor} p-2 rounded-lg`}>
                  <card.icon size={18} className={card.color} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default KPICards;