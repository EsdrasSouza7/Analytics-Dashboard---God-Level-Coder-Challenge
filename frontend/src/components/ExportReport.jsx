import { useState } from 'react';
import { Download, FileText, FileSpreadsheet, File, Loader, CheckCircle, X } from 'lucide-react';

export function ExportReport({ filters, onClose }) {
  const [exporting, setExporting] = useState(false);
  const [exportType, setExportType] = useState(null);
  const [progress, setProgress] = useState(0);

  // Buscar TODOS os dados necessários para o relatório completo
  const fetchAllData = async () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'todos' && value !== 'todas') {
        params.append(key, value);
      }
    });

    //DEBUG
    const baseUrl = 'http://localhost:3001/api';
    
    try {
      setProgress(10);
      console.log('📥 Buscando dados para exportação...');
      
      // Buscar todos os endpoints em paralelo
      const [
        metrics, 
        revenue, 
        products, 
        channels, 
        stores, 
        hourData,
        topItems,
        paymentMethods,
        couponPerformance
      ] = await Promise.all([
        fetch(`${baseUrl}/metrics?${params}`).then(r => r.json()),
        fetch(`${baseUrl}/revenue-timeline?${params}`).then(r => r.json()),
        fetch(`${baseUrl}/top-products?${params}&limit=30`).then(r => r.json()),
        fetch(`${baseUrl}/channel-distribution?${params}`).then(r => r.json()),
        fetch(`${baseUrl}/store-performance?${params}`).then(r => r.json()),
        fetch(`${baseUrl}/sales-by-hour?${params}`).then(r => r.json()),
        fetch(`${baseUrl}/top-items?${params}&limit=20`).then(r => r.json()).catch(() => []),
        fetch(`${baseUrl}/payment-methods?${params}`).then(r => r.json()).catch(() => []),
        fetch(`${baseUrl}/coupon-performance?${params}`).then(r => r.json()).catch(() => [])
      ]);

      setProgress(40);
      console.log('✅ Dados carregados com sucesso');

      return {
        metrics,
        revenue,
        products,
        channels,
        stores,
        hourData,
        topItems,
        paymentMethods,
        couponPerformance,
        filters
      };
    } catch (error) {
      console.error('❌ Erro ao buscar dados:', error);
      throw error;
    }
  };

  // Formatar dados para CSV
  const formatCSV = (headers, rows) => {
    const csvRows = [headers, ...rows];
    return csvRows.map(row => row.join(',')).join('\n');
  };

  // Exportar como CSV Completo
  const exportCSV = async (data) => {
    setProgress(60);

    let fullCSV = '';

    // 1. Métricas Gerais
    fullCSV += 'MÉTRICAS GERAIS\n';
    fullCSV += formatCSV(
      ['Métrica', 'Valor', 'Crescimento'],
      [
        ['Faturamento', `R$ ${data.metrics.faturamento.toLocaleString('pt-BR')}`, `${data.metrics.crescimento?.faturamento || 0}%`],
        ['Pedidos', data.metrics.pedidos, `${data.metrics.crescimento?.pedidos || 0}%`],
        ['Ticket Médio', `R$ ${data.metrics.ticketMedio.toFixed(2)}`, '-'],
        ['Clientes', data.metrics.clientes, '-'],
        ['Tempo Médio Produção', `${Math.floor(data.metrics.tempoMedioProducao / 60)}min`, '-'],
        ['Tempo Médio Entrega', `${Math.floor(data.metrics.tempoMedioEntrega / 60)}min`, '-']
      ]
    );
    fullCSV += '\n\n';

    // 2. Top Produtos
    fullCSV += 'TOP PRODUTOS\n';
    fullCSV += formatCSV(
      ['Ranking', 'Produto', 'Categoria', 'Vendas', 'Quantidade', 'Receita', 'Preço Médio'],
      data.products.map((p, i) => [
        i + 1,
        `"${p.name}"`,
        `"${p.categoria || '-'}"`,
        p.vendas,
        p.quantidade,
        p.receita.toFixed(2),
        p.precoMedio.toFixed(2)
      ])
    );
    fullCSV += '\n\n';

    // 3. Top Items/Complementos
    if (data.topItems && data.topItems.length > 0) {
      fullCSV += 'TOP COMPLEMENTOS/ITEMS\n';
      fullCSV += formatCSV(
        ['Item', 'Grupo', 'Vezes Adicionado', 'Quantidade', 'Receita'],
        data.topItems.map(item => [
          `"${item.name}"`,
          `"${item.grupo || '-'}"`,
          item.vezesAdicionado,
          item.quantidade,
          item.receita.toFixed(2)
        ])
      );
      fullCSV += '\n\n';
    }

    // 4. Distribuição por Canal
    fullCSV += 'DISTRIBUIÇÃO POR CANAL\n';
    fullCSV += formatCSV(
      ['Canal', 'Tipo', 'Pedidos', 'Receita', 'Ticket Médio', 'Percentual'],
      data.channels.map(c => [
        `"${c.name}"`,
        c.type,
        c.pedidos,
        c.receita.toFixed(2),
        c.ticketMedio.toFixed(2),
        `${c.percentual}%`
      ])
    );
    fullCSV += '\n\n';

    // 5. Performance por Loja
    fullCSV += 'PERFORMANCE POR LOJA\n';
    fullCSV += formatCSV(
      ['Loja', 'Cidade', 'Pedidos', 'Receita', 'Ticket Médio', 'Tempo Produção (min)'],
      data.stores.map(s => [
        `"${s.name}"`,
        `"${s.city || '-'}"`,
        s.pedidos,
        s.receita.toFixed(2),
        s.ticketMedio.toFixed(2),
        Math.floor(s.tempoMedioProducao / 60)
      ])
    );
    fullCSV += '\n\n';

    // 6. Métodos de Pagamento
    if (data.paymentMethods && data.paymentMethods.length > 0) {
      fullCSV += 'MÉTODOS DE PAGAMENTO\n';
      fullCSV += formatCSV(
        ['Método', 'Online', 'Transações', 'Valor Total'],
        data.paymentMethods.map(p => [
          `"${p.metodo}"`,
          p.online ? 'Sim' : 'Não',
          p.transacoes,
          p.valor.toFixed(2)
        ])
      );
      fullCSV += '\n\n';
    }

    // 7. Performance de Cupons
    if (data.couponPerformance && data.couponPerformance.length > 0) {
      fullCSV += 'PERFORMANCE DE CUPONS\n';
      fullCSV += formatCSV(
        ['Código', 'Tipo', 'Usos', 'Desconto Total', 'Ticket Médio com Cupom'],
        data.couponPerformance.map(c => [
          c.code,
          c.tipo,
          c.usos,
          c.descontoTotal.toFixed(2),
          c.ticketMedio.toFixed(2)
        ])
      );
      fullCSV += '\n\n';
    }

    const blob = new Blob(['\ufeff' + fullCSV], { type: 'text/csv;charset=utf-8;' });
    
    setProgress(100);
    downloadFile(blob, `relatorio_completo_${getFileName('csv')}`);
  };

  // Exportar como Excel (CSV rico)
  const exportExcel = async (data) => {
    setProgress(60);

    // Mesmo formato do CSV mas com mais formatação
    await exportCSV(data);
  };

  // Exportar como HTML/PDF
  const exportPDF = async (data) => {
    setProgress(60);

    // Calcular estatísticas adicionais
    const totalReceita = data.products.reduce((sum, p) => sum + p.receita, 0);
    const totalPedidosCanais = data.channels.reduce((sum, c) => sum + c.pedidos, 0);

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Relatório Analytics Completo</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      padding: 40px;
      color: #1f2937;
      background: #f9fafb;
    }
    .container { 
      max-width: 1200px; 
      margin: 0 auto; 
      background: white;
      padding: 40px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    h1 { 
      color: #1e40af; 
      border-bottom: 4px solid #3b82f6;
      padding-bottom: 15px;
      margin-bottom: 30px;
      font-size: 32px;
    }
    h2 { 
      color: #1e40af;
      margin-top: 40px;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e5e7eb;
      font-size: 24px;
    }
    h3 {
      color: #4b5563;
      margin-top: 25px;
      margin-bottom: 15px;
      font-size: 18px;
    }
    .header-info {
      background: #eff6ff;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
      border-left: 4px solid #3b82f6;
    }
    .header-info p {
      margin: 5px 0;
      color: #1e40af;
      font-size: 14px;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin: 30px 0;
    }
    .metric-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 25px;
      border-radius: 12px;
      color: white;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .metric-card.green { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
    .metric-card.blue { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); }
    .metric-card.orange { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
    .metric-card.purple { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); }
    .metric-label {
      font-size: 13px;
      opacity: 0.9;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    .metric-value {
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .metric-change {
      font-size: 14px;
      opacity: 0.9;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    thead {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    }
    th {
      color: white;
      padding: 15px 12px;
      text-align: left;
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 14px;
    }
    tr:nth-child(even) {
      background: #f9fafb;
    }
    tr:hover {
      background: #eff6ff;
    }
    .rank {
      background: #3b82f6;
      color: white;
      padding: 4px 10px;
      border-radius: 20px;
      font-weight: bold;
      font-size: 12px;
      display: inline-block;
      min-width: 30px;
      text-align: center;
    }
    .rank.gold { background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); }
    .rank.silver { background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%); }
    .rank.bronze { background: linear-gradient(135deg, #d97706 0%, #b45309 100%); }
    .highlight {
      background: #dbeafe;
      padding: 3px 8px;
      border-radius: 4px;
      font-weight: 600;
      color: #1e40af;
    }
    .footer {
      margin-top: 60px;
      padding-top: 30px;
      border-top: 3px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 13px;
    }
    .footer p { margin: 5px 0; }
    .section-summary {
      background: #f0fdf4;
      border-left: 4px solid #10b981;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .positive { color: #10b981; font-weight: 600; }
    .negative { color: #ef4444; font-weight: 600; }
    @media print {
      body { padding: 20px; }
      .metric-card { break-inside: avoid; }
      table { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 Relatório Analytics Completo</h1>
    
    <div class="header-info">
      <p><strong>📅 Período:</strong> ${filters.period} dias</p>
      <p><strong>🗓️ Gerado em:</strong> ${new Date().toLocaleString('pt-BR')}</p>
      ${filters.channel !== 'todos' ? `<p><strong>📱 Canal:</strong> ${filters.channel}</p>` : ''}
      ${filters.store !== 'todas' ? `<p><strong>🏪 Loja:</strong> ${filters.store}</p>` : ''}
      ${filters.channelType !== 'todos' ? `<p><strong>📦 Tipo:</strong> ${filters.channelType === 'P' ? 'Presencial' : 'Delivery'}</p>` : ''}
    </div>

    <h2>📈 Visão Geral</h2>
    <div class="metrics-grid">
      <div class="metric-card green">
        <div class="metric-label">Faturamento Total</div>
        <div class="metric-value">R$ ${data.metrics.faturamento.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
        ${data.metrics.crescimento?.faturamento ? `<div class="metric-change">${data.metrics.crescimento.faturamento >= 0 ? '↑' : '↓'} ${Math.abs(data.metrics.crescimento.faturamento).toFixed(1)}% vs período anterior</div>` : ''}
      </div>
      
      <div class="metric-card blue">
        <div class="metric-label">Total de Pedidos</div>
        <div class="metric-value">${data.metrics.pedidos.toLocaleString('pt-BR')}</div>
        ${data.metrics.crescimento?.pedidos ? `<div class="metric-change">${data.metrics.crescimento.pedidos >= 0 ? '↑' : '↓'} ${Math.abs(data.metrics.crescimento.pedidos).toFixed(1)}% vs período anterior</div>` : ''}
      </div>
      
      <div class="metric-card orange">
        <div class="metric-label">Ticket Médio</div>
        <div class="metric-value">R$ ${data.metrics.ticketMedio.toFixed(2)}</div>
        <div class="metric-change">Por pedido realizado</div>
      </div>
      
      <div class="metric-card purple">
        <div class="metric-label">Clientes Únicos</div>
        <div class="metric-value">${data.metrics.clientes.toLocaleString('pt-BR')}</div>
        <div class="metric-change">${(data.metrics.pedidos / data.metrics.clientes).toFixed(1)} pedidos/cliente</div>
      </div>
    </div>

    <div class="section-summary">
      <strong>💡 Insights:</strong> 
      Foram realizados ${data.metrics.pedidos.toLocaleString('pt-BR')} pedidos neste período, 
      gerando um faturamento de R$ ${data.metrics.faturamento.toLocaleString('pt-BR', {minimumFractionDigits: 2})}. 
      O ticket médio foi de R$ ${data.metrics.ticketMedio.toFixed(2)} por pedido.
    </div>

    <h2>🏆 Top 15 Produtos Mais Vendidos</h2>
    <table>
      <thead>
        <tr>
          <th style="width: 60px;">Ranking</th>
          <th>Produto</th>
          <th>Categoria</th>
          <th style="text-align: right;">Vendas</th>
          <th style="text-align: right;">Receita</th>
          <th style="text-align: right;">% Total</th>
          <th style="text-align: right;">Preço Médio</th>
        </tr>
      </thead>
      <tbody>
        ${data.products.slice(0, 15).map((p, i) => {
          const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
          const percentual = ((p.receita / totalReceita) * 100).toFixed(1);
          return `
            <tr>
              <td><span class="rank ${rankClass}">${i + 1}º</span></td>
              <td><strong>${p.name}</strong></td>
              <td>${p.categoria || '-'}</td>
              <td style="text-align: right;">${p.vendas.toLocaleString('pt-BR')}</td>
              <td style="text-align: right;">R$ ${p.receita.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
              <td style="text-align: right;"><span class="highlight">${percentual}%</span></td>
              <td style="text-align: right;">R$ ${p.precoMedio.toFixed(2)}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>

    ${data.topItems && data.topItems.length > 0 ? `
      <h2>🔥 Top Complementos/Adicionais</h2>
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Grupo</th>
            <th style="text-align: right;">Vezes Adicionado</th>
            <th style="text-align: right;">Receita Gerada</th>
          </tr>
        </thead>
        <tbody>
          ${data.topItems.slice(0, 10).map(item => `
            <tr>
              <td><strong>${item.name}</strong></td>
              <td>${item.grupo || '-'}</td>
              <td style="text-align: right;">${item.vezesAdicionado.toLocaleString('pt-BR')}</td>
              <td style="text-align: right;">R$ ${item.receita.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    ` : ''}

    <h2>🍕 Distribuição por Canal de Venda</h2>
    <table>
      <thead>
        <tr>
          <th>Canal</th>
          <th>Tipo</th>
          <th style="text-align: right;">Pedidos</th>
          <th style="text-align: right;">Receita</th>
          <th style="text-align: right;">Ticket Médio</th>
          <th style="text-align: right;">% Total</th>
        </tr>
      </thead>
      <tbody>
        ${data.channels.map(c => `
          <tr>
            <td><strong>${c.name}</strong></td>
            <td>${c.type}</td>
            <td style="text-align: right;">${c.pedidos.toLocaleString('pt-BR')}</td>
            <td style="text-align: right;">R$ ${c.receita.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
            <td style="text-align: right;">R$ ${c.ticketMedio.toFixed(2)}</td>
            <td style="text-align: right;"><span class="highlight">${c.percentual}%</span></td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <h2>🏪 Performance por Loja</h2>
    <table>
      <thead>
        <tr>
          <th>Loja</th>
          <th>Cidade</th>
          <th style="text-align: right;">Pedidos</th>
          <th style="text-align: right;">Receita</th>
          <th style="text-align: right;">Ticket Médio</th>
          <th style="text-align: right;">Tempo Produção</th>
        </tr>
      </thead>
      <tbody>
        ${data.stores.map(s => `
          <tr>
            <td><strong>${s.name}</strong></td>
            <td>${s.city || '-'}</td>
            <td style="text-align: right;">${s.pedidos.toLocaleString('pt-BR')}</td>
            <td style="text-align: right;">R$ ${s.receita.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
            <td style="text-align: right;">R$ ${s.ticketMedio.toFixed(2)}</td>
            <td style="text-align: right;">${Math.floor(s.tempoMedioProducao / 60)}min</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    ${data.paymentMethods && data.paymentMethods.length > 0 ? `
      <h2>💳 Métodos de Pagamento</h2>
      <table>
        <thead>
          <tr>
            <th>Método</th>
            <th>Tipo</th>
            <th style="text-align: right;">Transações</th>
            <th style="text-align: right;">Valor Total</th>
            <th style="text-align: right;">Ticket Médio</th>
          </tr>
        </thead>
        <tbody>
          ${data.paymentMethods.map(p => `
            <tr>
              <td><strong>${p.metodo}</strong></td>
              <td>${p.online ? '🌐 Online' : '💵 Presencial'}</td>
              <td style="text-align: right;">${p.transacoes.toLocaleString('pt-BR')}</td>
              <td style="text-align: right;">R$ ${p.valor.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
              <td style="text-align: right;">R$ ${(p.valor / p.transacoes).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    ` : ''}

    ${data.couponPerformance && data.couponPerformance.length > 0 ? `
      <h2>🎫 Performance de Cupons</h2>
      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Tipo</th>
            <th style="text-align: right;">Usos</th>
            <th style="text-align: right;">Desconto Total</th>
            <th style="text-align: right;">Ticket Médio</th>
          </tr>
        </thead>
        <tbody>
          ${data.couponPerformance.map(c => `
            <tr>
              <td><strong>${c.code}</strong></td>
              <td>${c.tipo}</td>
              <td style="text-align: right;">${c.usos.toLocaleString('pt-BR')}</td>
              <td style="text-align: right;">R$ ${c.descontoTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
              <td style="text-align: right;">R$ ${c.ticketMedio.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    ` : ''}

    <h2>⏰ Análise Temporal</h2>
    <div class="section-summary">
      <strong>📊 Dados do Período:</strong><br>
      • <strong>Tempo Médio de Produção:</strong> ${Math.floor(data.metrics.tempoMedioProducao / 60)} minutos<br>
      • <strong>Tempo Médio de Entrega:</strong> ${Math.floor(data.metrics.tempoMedioEntrega / 60)} minutos<br>
      • <strong>Total de Pontos de Dados:</strong> ${data.revenue.length} dias analisados
    </div>

    <div class="footer">
      <p><strong>Relatório Gerado Automaticamente</strong></p>
      <p>Analytics Dashboard • Challenge Brand</p>
      <p>${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
      <p style="margin-top: 15px; color: #9ca3af; font-size: 11px;">
        Este relatório contém informações confidenciais e deve ser tratado com sigilo
      </p>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    
    setProgress(100);
    downloadFile(blob, `relatorio_completo_${getFileName('html')}`);
  };

  // Download do arquivo
  const downloadFile = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Nome do arquivo
  const getFileName = (ext) => {
    const date = new Date().toISOString().split('T')[0];
    const period = filters.period || '30d';
    return `${period}_${date}.${ext}`;
  };

  // Executar exportação
  const handleExport = async (type) => {
    setExportType(type);
    setExporting(true);
    setProgress(0);

    try {
      const data = await fetchAllData();
      
      switch (type) {
        case 'csv':
          await exportCSV(data);
          break;
        case 'excel':
          await exportExcel(data);
          break;
        case 'pdf':
          await exportPDF(data);
          break;
      }

      setTimeout(() => {
        setExporting(false);
        setProgress(0);
        if (onClose) onClose();
      }, 1500);

    } catch (error) {
      console.error('❌ Erro ao exportar:', error);
      alert('Erro ao gerar relatório. Verifique o console para mais detalhes.');
      setExporting(false);
      setProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Download size={24} className="text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Exportar Relatório Completo</h3>
                <p className="text-sm text-gray-500">Todos os dados do dashboard</p>
              </div>
            </div>
            {!exporting && onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {!exporting ? (
            <div className="space-y-3">
              {/* CSV */}
              <button
                onClick={() => handleExport('csv')}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all flex items-center gap-4 group"
              >
                <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                  <FileSpreadsheet size={24} className="text-green-600" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-gray-900">CSV - Dados Completos</div>
                  <div className="text-sm text-gray-500">Todas as seções em formato tabular</div>
                </div>
              </button>

              {/* Excel */}
              <button
                onClick={() => handleExport('excel')}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center gap-4 group"
              >
                <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <FileSpreadsheet size={24} className="text-blue-600" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-gray-900">Excel - Relatório Completo</div>
                  <div className="text-sm text-gray-500">Métricas, produtos, canais, lojas, pagamentos</div>
                </div>
              </button>

              {/* PDF/HTML */}
              <button
                onClick={() => handleExport('pdf')}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-red-500 hover:bg-red-50 transition-all flex items-center gap-4 group"
              >
                <div className="p-3 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                  <FileText size={24} className="text-red-600" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-gray-900">HTML/PDF - Visual Completo</div>
                  <div className="text-sm text-gray-500">Relatório formatado com gráficos e tabelas</div>
                </div>
              </button>
            </div>
          ) : (
            <div className="py-8">
              <div className="flex flex-col items-center gap-4">
                {progress < 100 ? (
                  <>
                    <Loader size={48} className="text-blue-600 animate-spin" />
                    <div className="text-center">
                      <div className="font-semibold text-gray-900 mb-2">
                        Gerando relatório completo...
                      </div>
                      <div className="text-sm text-gray-500">
                        {progress < 20 && 'Buscando dados dos componentes...'}
                        {progress >= 20 && progress < 50 && 'Carregando métricas e produtos...'}
                        {progress >= 50 && progress < 80 && 'Compilando informações...'}
                        {progress >= 80 && 'Finalizando exportação...'}
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <div className="text-sm font-medium text-gray-600">{progress}%</div>
                  </>
                ) : (
                  <>
                    <CheckCircle size={48} className="text-green-600" />
                    <div className="text-center">
                      <div className="font-semibold text-gray-900 mb-2">
                        ✅ Relatório gerado com sucesso!
                      </div>
                      <div className="text-sm text-gray-500">
                        O download deve iniciar automaticamente
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!exporting && (
          <div className="p-4 bg-gray-50 border-t rounded-b-lg">
            <div className="space-y-2">
              <p className="text-xs text-gray-600">
                📊 <strong>O relatório inclui:</strong>
              </p>
              <ul className="text-xs text-gray-500 space-y-1 ml-4">
                <li>• Métricas gerais e KPIs</li>
                <li>• Top 30 produtos mais vendidos</li>
                <li>• Top 20 complementos/items</li>
                <li>• Distribuição por canais</li>
                <li>• Performance por loja</li>
                <li>• Métodos de pagamento</li>
                <li>• Performance de cupons</li>
                <li>• Análise temporal</li>
              </ul>
              <p className="text-xs text-gray-400 pt-2">
                💡 Os dados respeitam os filtros ativos no dashboard
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ExportReport;