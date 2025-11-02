import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// Cache simples in-memory
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

function getCacheKey(route, query) {
  return `${route}:${JSON.stringify(query)}`;
}

function getFromCache(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

// Helper para aplicar filtros (adaptado ao schema real)
function buildWhereClause(filters) {
  const conditions = ['s.sale_status_desc NOT IN (\'CANCELADO\', \'CANCELLED\')'];
  const values = [];
  let paramCount = 1;

  // Filtro de data customizada
  if (filters.startDate && filters.endDate) {
    conditions.push(`s.created_at BETWEEN $${paramCount} AND $${paramCount + 1}`);
    values.push(filters.startDate, filters.endDate);
    paramCount += 2;
  }else if (filters.period) {
    const days = parseInt(filters.period.replace('d', ''));
    conditions.push(`s.created_at >= NOW() - INTERVAL '${days} days'`);
  }

  // Filtro de canal
  if (filters.channel && filters.channel !== 'todos') {
    conditions.push(`c.name = $${paramCount}`);
    values.push(filters.channel);
    paramCount++;
  }

  // Filtro de tipo de canal (Presencial vs Delivery)
  if (filters.channelType && filters.channelType !== 'todos') {
    conditions.push(`c.type = $${paramCount}`);
    values.push(filters.channelType);
    paramCount++;
  }

  // Filtro de loja
  if (filters.store && filters.store !== 'todas') {
    conditions.push(`st.id = $${paramCount}`);
    values.push(parseInt(filters.store));
    paramCount++;
  }

  // Filtro de sub-brand
  if (filters.subBrand && filters.subBrand !== 'todas') {
    conditions.push(`s.sub_brand_id = $${paramCount}`);
    values.push(parseInt(filters.subBrand));
    paramCount++;
  }

  const whereClause = 'WHERE ' + conditions.join(' AND ');
  console.log('📤 WHERE gerado:', whereClause);
  return { whereClause, values };
}

// 🏢 Endpoint: Listar opções de filtros (lojas, canais, sub-brands)
router.get('/filter-options', async (req, res) => {
  try {
    const cacheKey = 'filter-options';
    const cached = getFromCache(cacheKey);
    if (cached) return res.json(cached);

    const [stores, channels, subBrands] = await Promise.all([
      pool.query('SELECT id, name, city, state, is_active FROM stores ORDER BY name'),
      pool.query('SELECT id, name, type FROM channels ORDER BY name'),
      pool.query('SELECT id, name FROM sub_brands ORDER BY name')
    ]);

    const data = {
      stores: stores.rows,
      channels: channels.rows,
      subBrands: subBrands.rows
    };

    setCache(cacheKey, data);
    res.json(data);
  } catch (error) {
    console.error('Erro em /filter-options:', error);
    res.status(500).json({ error: 'Erro ao buscar opções de filtro' });
  }
});

// 📊 Endpoint: Métricas principais
router.get('/metrics', async (req, res) => {
  try {
    const cacheKey = getCacheKey('metrics', req.query);
    const cached = getFromCache(cacheKey);
    if (cached) return res.json(cached);

    const { whereClause, values } = buildWhereClause(req.query);

    const query = `
      SELECT 
        COUNT(DISTINCT s.id) as total_pedidos,
        SUM(s.total_amount) as faturamento,
        AVG(s.total_amount) as ticket_medio,
        COUNT(DISTINCT s.customer_id) as total_clientes,
        SUM(s.delivery_fee) as total_taxas_entrega,
        SUM(s.total_discount) as total_descontos,
        AVG(s.production_seconds) as tempo_medio_producao,
        AVG(s.delivery_seconds) as tempo_medio_entrega
      FROM sales s
      JOIN channels c ON s.channel_id = c.id
      JOIN stores st ON s.store_id = st.id
      ${whereClause}
    `;

    const result = await pool.query(query, values);
    const data = result.rows[0];

    // Preparar query de comparação com período anterior
    let compareQuery;
    let compareValues = [];
    
    // Construir whereClause para comparação (sem filtro de data)
    const { whereClause: compareWhereBase, values: compareBaseValues } = buildWhereClause({
      ...req.query,
      period: undefined,
      startDate: undefined,
      endDate: undefined
    });

    if (req.query.startDate && req.query.endDate) {
      // Datas customizadas - comparar com período anterior de mesma duração
      const start = new Date(req.query.startDate + 'T00:00:00');
      const end = new Date(req.query.endDate + 'T23:59:59.999');
      
      // Calcular duração em dias (incluindo start e end)
      const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      
      // Período anterior
      const previousStart = new Date(start);
      previousStart.setDate(previousStart.getDate() - diffDays);
      
      const previousEnd = new Date(start);
      previousEnd.setDate(previousEnd.getDate() - 1);
      previousEnd.setHours(23, 59, 59, 999);

      let paramCount = compareBaseValues.length + 1;
      compareValues = [
        ...compareBaseValues,
        previousStart.toISOString(),
        previousEnd.toISOString()
      ];

      compareQuery = `
        SELECT 
          COUNT(DISTINCT s.id) as total_pedidos,
          SUM(s.total_amount) as faturamento
        FROM sales s
        JOIN channels c ON s.channel_id = c.id
        JOIN stores st ON s.store_id = st.id
        ${compareWhereBase}
        AND s.created_at >= $${paramCount}
        AND s.created_at <= $${paramCount + 1}
      `;
    } else {
      // Período padrão (30d, 90d, etc)
      const periodDays = parseInt(req.query.period?.replace(/\D/g, '') || '30');
      
      if (isNaN(periodDays) || periodDays <= 0) {
        throw new Error('Período inválido');
      }

      // Para comparar: período anterior de mesma duração
      const startDaysAgo = periodDays * 2;  // início do período anterior
      const endDaysAgo = periodDays;        // fim do período anterior
      
      compareValues = [...compareBaseValues, startDaysAgo, endDaysAgo];
      
      let paramCount = compareBaseValues.length + 1;

      compareQuery = `
        SELECT 
          COUNT(DISTINCT s.id) as total_pedidos,
          SUM(s.total_amount) as faturamento
        FROM sales s
        JOIN channels c ON s.channel_id = c.id
        JOIN stores st ON s.store_id = st.id
        ${compareWhereBase}
        AND s.created_at >= NOW() - INTERVAL '1 day' * $${paramCount}
        AND s.created_at < NOW() - INTERVAL '1 day' * $${paramCount + 1}
      `;
    }

    const compareResult = await pool.query(compareQuery, compareValues);
    const compareData = compareResult.rows[0];

    // Calcular crescimento
    const calcGrowth = (current, previous) => {
      if (!previous || previous === 0) return 0;
      return ((current - previous) / previous * 100).toFixed(1);
    };

    const response = {
      faturamento: parseFloat(data.faturamento || 0),
      pedidos: parseInt(data.total_pedidos || 0),
      ticketMedio: parseFloat(data.ticket_medio || 0),
      clientes: parseInt(data.total_clientes || 0),
      taxasEntrega: parseFloat(data.total_taxas_entrega || 0),
      descontos: parseFloat(data.total_descontos || 0),
      tempoMedioProducao: parseInt(data.tempo_medio_producao || 0),
      tempoMedioEntrega: parseInt(data.tempo_medio_entrega || 0),
      crescimento: {
        faturamento: parseFloat(calcGrowth(data.faturamento, compareData.faturamento)),
        pedidos: parseFloat(calcGrowth(data.total_pedidos, compareData.total_pedidos)),
      }
    };

    setCache(cacheKey, response);
    res.json(response);
  } catch (error) {
    console.error('Erro em /metrics:', error);
    res.status(500).json({ error: 'Erro ao buscar métricas' });
  }
});

// 📈 Endpoint: Timeline de receita
router.get('/revenue-timeline', async (req, res) => {
  try {
    const cacheKey = getCacheKey('revenue-timeline', req.query);
    const cached = getFromCache(cacheKey);
    if (cached) return res.json(cached);

    const { whereClause, values } = buildWhereClause(req.query);

    const query = `
      SELECT 
        DATE_TRUNC('day', s.created_at) as date,
        SUM(s.total_amount) as value,
        COUNT(*) as pedidos
      FROM sales s
      JOIN channels c ON s.channel_id = c.id
      JOIN stores st ON s.store_id = st.id
      ${whereClause}
      GROUP BY DATE_TRUNC('day', s.created_at)
      ORDER BY date ASC
    `;

    const result = await pool.query(query, values);
    
    const data = result.rows.map(row => ({
      date: new Date(row.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      value: parseFloat(row.value),
      pedidos: parseInt(row.pedidos)
    }));

    setCache(cacheKey, data);
    res.json(data);
  } catch (error) {
    console.error('Erro em /revenue-timeline:', error);
    res.status(500).json({ error: 'Erro ao buscar timeline' });
  }
});

// 🏆 Endpoint: Top produtos (COM items/complementos)
router.get('/top-products', async (req, res) => {
  try {
    const cacheKey = getCacheKey('top-products', req.query);
    const cached = getFromCache(cacheKey);
    if (cached) return res.json(cached);

    const { whereClause, values } = buildWhereClause(req.query);
    const limit = req.query.limit || 10;

    const query = `
      SELECT 
        p.name,
        cat.name as categoria,
        COUNT(DISTINCT ps.sale_id) as num_vendas,
        SUM(ps.quantity) as quantidade_total,
        SUM(ps.total_price) as receita_total,
        AVG(ps.total_price) as preco_medio
      FROM product_sales ps
      JOIN products p ON ps.product_id = p.id
      LEFT JOIN categories cat ON p.category_id = cat.id
      JOIN sales s ON ps.sale_id = s.id
      JOIN channels c ON s.channel_id = c.id
      JOIN stores st ON s.store_id = st.id
      ${whereClause}
      GROUP BY p.id, p.name, cat.name
      ORDER BY receita_total DESC
      LIMIT $${values.length + 1}
    `;

    const result = await pool.query(query, [...values, limit]);
    
    const data = result.rows.map(row => ({
      name: row.name,
      categoria: row.categoria,
      vendas: parseInt(row.num_vendas),
      quantidade: parseFloat(row.quantidade_total),
      receita: parseFloat(row.receita_total),
      precoMedio: parseFloat(row.preco_medio)
    }));

    setCache(cacheKey, data);
    res.json(data);
  } catch (error) {
    console.error('Erro em /top-products:', error);
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

// 🔥 Endpoint: Top items/complementos (Bacon, Queijo extra, etc)
router.get('/top-items', async (req, res) => {
  try {
    const cacheKey = getCacheKey('top-items', req.query);
    const cached = getFromCache(cacheKey);
    if (cached) return res.json(cached);

    const { whereClause, values } = buildWhereClause(req.query);
    const limit = req.query.limit || 10;

    const query = `
      SELECT 
        i.name,
        og.name as grupo_opcao,
        COUNT(*) as vezes_adicionado,
        SUM(ips.quantity) as quantidade_total,
        SUM(ips.price) as receita_total
      FROM item_product_sales ips
      JOIN items i ON ips.item_id = i.id
      LEFT JOIN option_groups og ON ips.option_group_id = og.id
      JOIN product_sales ps ON ips.product_sale_id = ps.id
      JOIN sales s ON ps.sale_id = s.id
      JOIN channels c ON s.channel_id = c.id
      JOIN stores st ON s.store_id = st.id
      ${whereClause}
      GROUP BY i.id, i.name, og.name
      ORDER BY receita_total DESC
      LIMIT $${values.length + 1}
    `;

    const result = await pool.query(query, [...values, limit]);
    
    const data = result.rows.map(row => ({
      name: row.name,
      grupo: row.grupo_opcao,
      vezesAdicionado: parseInt(row.vezes_adicionado),
      quantidade: parseFloat(row.quantidade_total),
      receita: parseFloat(row.receita_total)
    }));

    setCache(cacheKey, data);
    res.json(data);
  } catch (error) {
    console.error('Erro em /top-items:', error);
    res.status(500).json({ error: 'Erro ao buscar items' });
  }
});

// 🍕 Endpoint: Distribuição por canal
router.get('/channel-distribution', async (req, res) => {
  try {
    const cacheKey = getCacheKey('channel-distribution', req.query);
    const cached = getFromCache(cacheKey);
    if (cached) return res.json(cached);

    const { whereClause, values } = buildWhereClause(req.query);

    const query = `
      SELECT 
        c.name,
        c.type,
        COUNT(*) as pedidos,
        SUM(s.total_amount) as receita,
        AVG(s.total_amount) as ticket_medio
      FROM sales s
      JOIN channels c ON s.channel_id = c.id
      JOIN stores st ON s.store_id = st.id
      ${whereClause}
      GROUP BY c.id, c.name, c.type
      ORDER BY receita DESC
    `;

    const result = await pool.query(query, values);
    
    const total = result.rows.reduce((sum, row) => sum + parseFloat(row.receita), 0);
    
    const data = result.rows.map(row => ({
      name: row.name,
      type: row.type === 'P' ? 'Presencial' : 'Delivery',
      pedidos: parseInt(row.pedidos),
      receita: parseFloat(row.receita),
      ticketMedio: parseFloat(row.ticket_medio),
      percentual: Math.round((parseFloat(row.receita) / total) * 100)
    }));

    setCache(cacheKey, data);
    res.json(data);
  } catch (error) {
    console.error('Erro em /channel-distribution:', error);
    res.status(500).json({ error: 'Erro ao buscar distribuição de canais' });
  }
});

// 🏪 Endpoint: Performance por loja
router.get('/store-performance', async (req, res) => {
  try {
    const cacheKey = getCacheKey('store-performance', req.query);
    const cached = getFromCache(cacheKey);
    if (cached) return res.json(cached);

    const { whereClause, values } = buildWhereClause(req.query);

    const query = `
      SELECT 
        st.name,
        st.city,
        st,state,
        COUNT(*) as pedidos,
        SUM(s.total_amount) as receita,
        AVG(s.total_amount) as ticket_medio,
        AVG(s.production_seconds) as tempo_medio_producao
      FROM sales s
      JOIN channels c ON s.channel_id = c.id
      JOIN stores st ON s.store_id = st.id
      ${whereClause}
      GROUP BY st.id, st.name, st.city, st.state
      ORDER BY receita DESC
    `;

    const result = await pool.query(query, values);
    
    const data = result.rows.map(row => ({
      name: row.name,
      city: row.city,
      state: row.state,
      pedidos: parseInt(row.pedidos),
      receita: parseFloat(row.receita),
      ticketMedio: parseFloat(row.ticket_medio),
      tempoMedioProducao: parseInt(row.tempo_medio_producao || 0)
    }));

    setCache(cacheKey, data);
    res.json(data);
  } catch (error) {
    console.error('Erro em /store-performance:', error);
    res.status(500).json({ error: 'Erro ao buscar performance de lojas' });
  }
});

// ⏰ Endpoint: Vendas por horário (heatmap)
router.get('/sales-by-hour', async (req, res) => {
  try {
    const cacheKey = getCacheKey('sales-by-hour', req.query);
    const cached = getFromCache(cacheKey);
    if (cached) return res.json(cached);

    const { whereClause, values } = buildWhereClause(req.query);

    const query = `
      SELECT 
        EXTRACT(DOW FROM s.created_at) as dia_semana,
        EXTRACT(HOUR FROM s.created_at) as hora,
        COUNT(*) as pedidos,
        SUM(s.total_amount) as receita
      FROM sales s
      JOIN channels c ON s.channel_id = c.id
      JOIN stores st ON s.store_id = st.id
      ${whereClause}
      GROUP BY dia_semana, hora
      ORDER BY dia_semana, hora
    `;

    const result = await pool.query(query, values);
    
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    
    const data = result.rows.map(row => ({
      diaSemana: diasSemana[parseInt(row.dia_semana)],
      hora: parseInt(row.hora),
      pedidos: parseInt(row.pedidos),
      receita: parseFloat(row.receita)
    }));

    setCache(cacheKey, data);
    res.json(data);
  } catch (error) {
    console.error('Erro em /sales-by-hour:', error);
    res.status(500).json({ error: 'Erro ao buscar vendas por horário' });
  }
});

// 💳 Endpoint: Métodos de pagamento
router.get('/payment-methods', async (req, res) => {
  try {
    const cacheKey = getCacheKey('payment-methods', req.query);
    const cached = getFromCache(cacheKey);
    if (cached) return res.json(cached);

    const { whereClause, values } = buildWhereClause(req.query);

    const query = `
      SELECT 
        pt.description as metodo,
        p.is_online,
        COUNT(DISTINCT p.sale_id) as transacoes,
        SUM(p.value) as valor_total
      FROM payments p
      JOIN payment_types pt ON p.payment_type_id = pt.id
      JOIN sales s ON p.sale_id = s.id
      JOIN channels c ON s.channel_id = c.id
      JOIN stores st ON s.store_id = st.id
      ${whereClause}
      GROUP BY pt.description, p.is_online
      ORDER BY valor_total DESC
    `;

    const result = await pool.query(query, values);
    
    const data = result.rows.map(row => ({
      metodo: row.metodo,
      online: row.is_online,
      transacoes: parseInt(row.transacoes),
      valor: parseFloat(row.valor_total)
    }));

    setCache(cacheKey, data);
    res.json(data);
  } catch (error) {
    console.error('Erro em /payment-methods:', error);
    res.status(500).json({ error: 'Erro ao buscar métodos de pagamento' });
  }
});

// 🎫 Endpoint: Performance de cupons
router.get('/coupon-performance', async (req, res) => {
  try {
    const cacheKey = getCacheKey('coupon-performance', req.query);
    const cached = getFromCache(cacheKey);
    if (cached) return res.json(cached);

    const { whereClause, values } = buildWhereClause(req.query);

    const query = `
      SELECT 
        c.code,
        c.discount_type,
        COUNT(DISTINCT cs.sale_id) as usos,
        SUM(cs.value) as desconto_total,
        AVG(s.total_amount) as ticket_medio_com_cupom
      FROM coupon_sales cs
      JOIN coupons c ON cs.coupon_id = c.id
      JOIN sales s ON cs.sale_id = s.id
      JOIN channels ch ON s.channel_id = ch.id
      JOIN stores st ON s.store_id = st.id
      ${whereClause}
      GROUP BY c.id, c.code, c.discount_type
      ORDER BY usos DESC
      LIMIT 20
    `;

    const result = await pool.query(query, values);
    
    const data = result.rows.map(row => ({
      code: row.code,
      tipo: row.discount_type === 'p' ? 'Percentual' : 'Fixo',
      usos: parseInt(row.usos),
      descontoTotal: parseFloat(row.desconto_total),
      ticketMedio: parseFloat(row.ticket_medio_com_cupom)
    }));

    setCache(cacheKey, data);
    res.json(data);
  } catch (error) {
    console.error('Erro em /coupon-performance:', error);
    res.status(500).json({ error: 'Erro ao buscar performance de cupons' });
  }
});

// Metricas de Clientes

// 📊 Endpoint: Métricas de Clientes
router.get('/customer-metrics', async (req, res) => {
  try {
    const { whereClause, values } = buildWhereClause(req.query);

    const query = `
      WITH customer_last_purchase AS (
        SELECT 
          c.id,
          MAX(s.created_at) as ultima_compra
        FROM customers c
        LEFT JOIN sales s ON c.id = s.customer_id 
          AND s.sale_status_desc NOT IN ('CANCELADO', 'CANCELLED')
        ${whereClause}
        GROUP BY c.id
      )
      SELECT 
        COUNT(DISTINCT clp.id) as total_clientes,
        
        -- Clientes que compraram nos últimos 7 dias
        COUNT(DISTINCT CASE 
          WHEN clp.ultima_compra >= NOW() - INTERVAL '7 days' 
          THEN clp.id 
        END) as clientes_ativos_7d,
        
        -- Clientes cuja última compra foi entre 8-15 dias atrás
        COUNT(DISTINCT CASE 
          WHEN clp.ultima_compra >= NOW() - INTERVAL '15 days' 
          AND clp.ultima_compra < NOW() - INTERVAL '7 days' 
          THEN clp.id 
        END) as clientes_ativos_15d,
        
        -- Clientes cuja última compra foi entre 16-30 dias atrás
        COUNT(DISTINCT CASE 
          WHEN clp.ultima_compra >= NOW() - INTERVAL '30 days' 
          AND clp.ultima_compra < NOW() - INTERVAL '15 days' 
          THEN clp.id 
        END) as clientes_ativos_30d,
        
        -- Clientes cuja última compra foi entre 31-90 dias atrás
        COUNT(DISTINCT CASE 
          WHEN clp.ultima_compra >= NOW() - INTERVAL '90 days' 
          AND clp.ultima_compra < NOW() - INTERVAL '30 days' 
          THEN clp.id 
        END) as clientes_ativos_90d,
        
        -- Clientes inativos (última compra há mais de 90 dias ou nunca compraram)
        COUNT(DISTINCT CASE 
          WHEN clp.ultima_compra IS NULL OR clp.ultima_compra < NOW() - INTERVAL '90 days' 
          THEN clp.id 
        END) as clientes_inativos,

        -- Clientes ativos (última compra nos últimos 30 dias)
        COUNT(DISTINCT CASE 
          WHEN clp.ultima_compra >= NOW() - INTERVAL '30 days' 
          THEN clp.id 
        END) as clientes_ativos,
        
        -- Métricas gerais
        AVG(s.total_amount) as ticket_medio_geral,
        CASE 
          WHEN COUNT(DISTINCT c.id) > 0 
          THEN COUNT(DISTINCT s.id)::decimal / COUNT(DISTINCT c.id)
          ELSE 0 
        END as frequencia_media

      FROM customer_last_purchase clp
      LEFT JOIN customers c ON clp.id = c.id
      LEFT JOIN sales s ON c.id = s.customer_id 
        AND s.sale_status_desc NOT IN ('CANCELADO', 'CANCELLED')
    `;

    console.log('✅ Query com períodos exclusivos');
    
    const result = await pool.query(query, values);
    
    res.json(result.rows[0]);
    
  } catch (error) {
    console.error('❌ Erro em /customer-metrics:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar métricas de clientes',
      details: error.message
    });
  }
});

// 🏆 Endpoint: Top Clientes
router.get('/top-customers', async (req, res) => {
  try {
    const { whereClause, values } = buildWhereClause(req.query);
    const limit = req.query.limit || 10;

    const query = `
      SELECT 
        c.id,
        c.customer_name,
        c.email,
        c.phone_number,
        COUNT(DISTINCT s.id) as total_pedidos,
        SUM(s.total_amount) as total_gasto,
        AVG(s.total_amount) as ticket_medio,
        MAX(s.created_at) as ultima_compra,
        COUNT(DISTINCT st.id) as lojas_frequentadas
      FROM customers c
      JOIN sales s ON c.id = s.customer_id
      JOIN channels ch ON s.channel_id = ch.id
      JOIN stores st ON s.store_id = st.id
      ${whereClause}
      GROUP BY c.id, c.customer_name, c.email, c.phone_number
      ORDER BY total_gasto DESC
      LIMIT $${values.length + 1}
    `;

    const result = await pool.query(query, [...values, limit]);
    
    const data = result.rows.map(row => ({
      id: row.id,
      name: row.customer_name || 'Cliente Não Identificado',
      email: row.email,
      phone: row.phone_number,
      totalPedidos: parseInt(row.total_pedidos),
      totalGasto: parseFloat(row.total_gasto),
      ticketMedio: parseFloat(row.ticket_medio),
      ultimaCompra: row.ultima_compra,
      lojasFrequentadas: parseInt(row.lojas_frequentadas),
      diasDesdeUltimaCompra: Math.floor((new Date() - new Date(row.ultima_compra)) / (1000 * 60 * 60 * 24))
    }));

    res.json(data);
  } catch (error) {
    console.error('Erro em /top-customers:', error);
    res.status(500).json({ error: 'Erro ao buscar top clientes' });
  }
});

// 📈 Endpoint: Segmentação por Frequência
router.get('/customer-segmentation', async (req, res) => {
  try {
    const { whereClause, values } = buildWhereClause(req.query);

    const query = `
      WITH customer_stats AS (
        SELECT 
          c.id,
          c.customer_name,
          COUNT(DISTINCT s.id) as total_pedidos,
          SUM(s.total_amount) as total_gasto,
          MAX(s.created_at) as ultima_compra,
          CASE 
            WHEN COUNT(DISTINCT s.id) >= 10 THEN 'VIP'
            WHEN COUNT(DISTINCT s.id) >= 5 THEN 'Frequente' 
            WHEN COUNT(DISTINCT s.id) >= 2 THEN 'Ocasional'
            ELSE 'Novo'
          END as segmento,
          CASE 
            When MAX(s.created_at) >= NOW() - INTERVAL '7 days' THEN 'Muito Ativo'
            WHEN MAX(s.created_at) >= NOW() - INTERVAL '15 days' THEN 'Ativo'
            WHEN MAX(s.created_at) >= NOW() - INTERVAL '30 days' THEN 'Inativo Recente'
            ELSE 'Inativo'
          END as status_ativo
        FROM customers c
        LEFT JOIN sales s ON c.id = s.customer_id
        JOIN channels ch ON s.channel_id = ch.id
        JOIN stores st ON s.store_id = st.id
        ${whereClause}
        GROUP BY c.id, c.customer_name
      )
      SELECT 
        segmento,
        status_ativo,
        COUNT(*) as quantidade_clientes,
        AVG(total_pedidos) as media_pedidos,
        AVG(total_gasto) as media_gasto
      FROM customer_stats
      GROUP BY segmento, status_ativo
      ORDER BY segmento, status_ativo
    `;

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro em /customer-segmentation:', error);
    res.status(500).json({ error: 'Erro ao buscar segmentação' });
  }
});

// Função auxiliar para construir WHERE sem excluir cancelados
function buildWhereClauseIncludingCancelled(queryParams) {
  const conditions = [];
  const values = [];
  let paramCount = 1;

  // Lojas
  if (queryParams.storeIds) {
    const storeIds = queryParams.storeIds.split(',').map(id => parseInt(id));
    conditions.push(`st.id = ANY($${paramCount})`);
    values.push(storeIds);
    paramCount++;
  }

  // Canais
  if (queryParams.channelIds) {
    const channelIds = queryParams.channelIds.split(',').map(id => parseInt(id));
    conditions.push(`c.id = ANY($${paramCount})`);
    values.push(channelIds);
    paramCount++;
  }

  // Período ou datas customizadas
  if (queryParams.startDate && queryParams.endDate) {
    const start = new Date(queryParams.startDate + 'T00:00:00');
    const end = new Date(queryParams.endDate + 'T23:59:59.999');
    
    conditions.push(`s.created_at >= $${paramCount}`);
    values.push(start.toISOString());
    paramCount++;
    
    conditions.push(`s.created_at <= $${paramCount}`);
    values.push(end.toISOString());
    paramCount++;
  } else if (queryParams.period) {
    const periodDays = parseInt(queryParams.period.replace(/\D/g, '') || '30');
    
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (periodDays - 1));
    startDate.setHours(0, 0, 0, 0);
    
    conditions.push(`s.created_at >= $${paramCount}`);
    values.push(startDate.toISOString());
    paramCount++;
    
    conditions.push(`s.created_at <= $${paramCount}`);
    values.push(endDate.toISOString());
    paramCount++;
  }

  const whereClause = conditions.length > 0 
    ? 'WHERE ' + conditions.join(' AND ')
    : '';

  return { whereClause, values };
}

// 📊 Métricas Operacionais Gerais
router.get('/operational-metrics', async (req, res) => {
  try {
    const { whereClause, values } = buildWhereClauseIncludingCancelled(req.query);

    const query = `
      SELECT 
        -- Tempos médios
        AVG(s.production_seconds) as tempo_medio_producao,
        AVG(s.delivery_seconds) as tempo_medio_entrega,
        
        -- Taxa de cancelamento
        COUNT(CASE WHEN s.sale_status_desc IN ('CANCELADO', 'CANCELLED') THEN 1 END)::decimal / 
        NULLIF(COUNT(*), 0) as taxa_cancelamento,
        
        -- Total de cancelamentos
        COUNT(CASE WHEN s.sale_status_desc IN ('CANCELADO', 'CANCELLED') THEN 1 END) as total_cancelamentos,
        
        -- Produtividade (pedidos por hora)
        COUNT(*) / GREATEST(EXTRACT(EPOCH FROM (MAX(s.created_at) - MIN(s.created_at))) / 3600, 1) as pedidos_por_hora,
        
        -- Eficiência geral (baseada em tempos)
        CASE 
          WHEN AVG(s.production_seconds) > 0 
          THEN GREATEST(0, 1 - (AVG(s.production_seconds) - 1200) / 1200) -- Meta: 20 minutos
          ELSE 0.8 
        END as eficiencia_geral

      FROM sales s
      JOIN channels c ON s.channel_id = c.id
      JOIN stores st ON s.store_id = st.id
      ${whereClause}
    `;

    const result = await pool.query(query, values);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro em /operational-metrics:', error);
    res.status(500).json({ error: 'Erro ao buscar métricas operacionais' });
  }
});

// ⏰ Dados por Horário
router.get('/operational-by-hour', async (req, res) => {
  try {
    const { whereClause, values } = buildWhereClause(req.query);

    const query = `
      SELECT 
        EXTRACT(HOUR FROM s.created_at) as hora,
        AVG(s.production_seconds) as tempo_medio_producao,
        AVG(s.delivery_seconds) as tempo_medio_entrega,
        COUNT(*) as total_pedidos,
        COUNT(CASE WHEN s.sale_status_desc IN ('CANCELADO', 'CANCELLED') THEN 1 END) as cancelamentos
      FROM sales s
      JOIN channels c ON s.channel_id = c.id
      JOIN stores st ON s.store_id = st.id
      ${whereClause}
      GROUP BY EXTRACT(HOUR FROM s.created_at)
      ORDER BY hora
    `;

    const result = await pool.query(query, values);
    
    const data = result.rows.map(row => ({
      hora: parseInt(row.hora),
      tempo_medio_producao: parseInt(row.tempo_medio_producao || 0),
      tempo_medio_entrega: parseInt(row.tempo_medio_entrega || 0),
      total_pedidos: parseInt(row.total_pedidos),
      cancelamentos: parseInt(row.cancelamentos)
    }));

    res.json(data);
  } catch (error) {
    console.error('Erro em /operational-by-hour:', error);
    res.status(500).json({ error: 'Erro ao buscar dados por horário' });
  }
});

// ❌ Métricas de Cancelamento
router.get('/cancellation-metrics', async (req, res) => {
  try {
    // IMPORTANTE: Usar função que NÃO exclui cancelados
    const { whereClause, values } = buildWhereClauseIncludingCancelled(req.query);
    console.log(whereClause, values);

    const query = `
      WITH base_data AS (
        SELECT 
          s.*,
          c.name as channel_name,
          st.name as store_name
        FROM sales s
        JOIN channels c ON s.channel_id = c.id
        JOIN stores st ON s.store_id = st.id
        ${whereClause}
      ),
      metricas_gerais AS (
        SELECT 
          COUNT(*) as total_pedidos,
          COUNT(CASE WHEN sale_status_desc IN ('CANCELADO', 'CANCELLED') THEN 1 END) as total_cancelamentos,
          COUNT(CASE WHEN sale_status_desc IN ('CANCELADO', 'CANCELLED') THEN 1 END)::decimal / 
          NULLIF(COUNT(*), 0) as taxa_cancelamento_geral
        FROM base_data
      ),
      cancelamentos_por_motivo AS (
        SELECT 
          COALESCE(discount_reason, 'Sem motivo informado') as motivo,
          COUNT(*) as quantidade
        FROM base_data
        WHERE sale_status_desc IN ('CANCELADO', 'CANCELLED')
        GROUP BY discount_reason
        ORDER BY quantidade DESC
        LIMIT 10
      ),
      cancelamentos_por_hora AS (
        SELECT 
          EXTRACT(HOUR FROM created_at)::integer as hora,
          COUNT(*) as total_hora,
          COUNT(CASE WHEN sale_status_desc IN ('CANCELADO', 'CANCELLED') THEN 1 END) as cancelamentos_hora,
          COUNT(CASE WHEN sale_status_desc IN ('CANCELADO', 'CANCELLED') THEN 1 END)::decimal / 
          NULLIF(COUNT(*), 0) as taxa_cancelamento
        FROM base_data
        GROUP BY EXTRACT(HOUR FROM created_at)
        ORDER BY hora
      )
      SELECT 
        mg.total_pedidos,
        mg.total_cancelamentos,
        mg.taxa_cancelamento_geral,
        COALESCE(
          (SELECT json_agg(
            json_build_object(
              'motivo', motivo,
              'quantidade', quantidade
            )
          ) FROM cancelamentos_por_motivo),
          '[]'::json
        ) as cancelamentos_por_motivo,
        COALESCE(
          (SELECT json_agg(
            json_build_object(
              'hora', hora,
              'total_hora', total_hora,
              'cancelamentos_hora', cancelamentos_hora,
              'taxa_cancelamento', taxa_cancelamento
            )
          ) FROM cancelamentos_por_hora),
          '[]'::json
        ) as cancelamentos_por_hora
      FROM metricas_gerais mg
    `;

    const result = await pool.query(query, values);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro em /cancellation-metrics:', error);
    res.status(500).json({ error: 'Erro ao buscar métricas de cancelamento' });
  }
});





// 💰 Produtos Mais Lucrativos (baseado em receita)
router.get('/profitable-products', async (req, res) => {
  try {
    const { whereClause, values } = buildWhereClause(req.query);
    const limit = parseInt(req.query.limit) || 20;

    const query = `
      WITH produto_dados AS (
        SELECT 
          p.id,
          p.name,
          COALESCE(cat.name, 'Sem Categoria') as categoria,
          COUNT(DISTINCT ps.sale_id) as vendas,
          SUM(ps.quantity) as quantidade,
          SUM(ps.total_price) as receita,
          AVG(ps.total_price) as preco_medio
        FROM product_sales ps
        JOIN products p ON ps.product_id = p.id
        LEFT JOIN categories cat ON p.category_id = cat.id
        JOIN sales s ON ps.sale_id = s.id
        JOIN channels c ON s.channel_id = c.id
        JOIN stores st ON s.store_id = st.id
        ${whereClause}
        GROUP BY p.id, p.name, cat.name
      ),
      categoria_receitas AS (
        SELECT 
          categoria,
          SUM(receita) as receita_categoria
        FROM produto_dados
        GROUP BY categoria
      )
      SELECT 
        pd.*,
        COALESCE(pd.receita / NULLIF(cr.receita_categoria, 0), 0) as percentual_categoria,
        ROW_NUMBER() OVER (ORDER BY pd.receita DESC) as ranking
      FROM produto_dados pd
      LEFT JOIN categoria_receitas cr ON pd.categoria = cr.categoria
      ORDER BY pd.receita DESC
      LIMIT $${values.length + 1}
    `;

    const result = await pool.query(query, [...values, limit]);
    
    const data = result.rows.map(row => ({
      id: parseInt(row.ranking),
      name: row.name,
      categoria: row.categoria,
      vendas: parseInt(row.vendas),
      quantidade: parseFloat(row.quantidade),
      receita: parseFloat(row.receita),
      precoMedio: parseFloat(row.preco_medio),
      percentual_categoria: parseFloat(row.percentual_categoria)
    }));

    res.json(data);
  } catch (error) {
    console.error('Erro em /profitable-products:', error);
    res.status(500).json({ error: 'Erro ao buscar produtos lucrativos' });
  }
});

// 📈 Sazonalidade dos Produtos
router.get('/product-seasonality', async (req, res) => {
  try {
    const { whereClause, values } = buildWhereClause(req.query);
    
    const interval =  'day';
    
    // Query principal - dados por período
    const timeSeriesQuery = `
      SELECT 
        DATE_TRUNC('${interval}', s.created_at) as periodo,
        COUNT(DISTINCT ps.product_id) as produtos_unicos,
        SUM(ps.quantity) as quantidade_total,
        SUM(ps.total_price) as receita_total,
        COUNT(DISTINCT ps.sale_id) as total_pedidos
      FROM product_sales ps
      JOIN products p ON ps.product_id = p.id
      JOIN sales s ON ps.sale_id = s.id
      JOIN channels c ON s.channel_id = c.id
      JOIN stores st ON s.store_id = st.id
      ${whereClause}
      GROUP BY DATE_TRUNC('${interval}', s.created_at)
      ORDER BY periodo
    `;

    // Query de produtos sazonais - produtos com maior variação
    const seasonalProductsQuery = `
      WITH produto_periodos AS (
        SELECT 
          p.name as nome,
          DATE_TRUNC('${interval}', s.created_at) as periodo,
          SUM(ps.quantity) as quantidade
        FROM product_sales ps
        JOIN products p ON ps.product_id = p.id
        JOIN sales s ON ps.sale_id = s.id
        JOIN channels c ON s.channel_id = c.id
        JOIN stores st ON s.store_id = st.id
        ${whereClause}
        GROUP BY p.name, DATE_TRUNC('${interval}', s.created_at)
      ),
      produto_stats AS (
        SELECT 
          nome,
          AVG(quantidade) as media,
          STDDEV(quantidade) as desvio,
          MAX(quantidade) as maximo,
          MIN(quantidade) as minimo
        FROM produto_periodos
        GROUP BY nome
        HAVING COUNT(*) >= 2 AND STDDEV(quantidade) > 0
      )
      SELECT 
        nome,
        COALESCE((maximo - minimo) / NULLIF(media, 0), 0) as variacao
      FROM produto_stats
      WHERE media > 0
      ORDER BY variacao DESC
      LIMIT 10
    `;

    const [timeSeriesResult, seasonalResult] = await Promise.all([
      pool.query(timeSeriesQuery, values),
      pool.query(seasonalProductsQuery, values)
    ]);
    
    const timeSeries = timeSeriesResult.rows.map(row => ({
      periodo: new Date(row.periodo).toLocaleDateString('pt-BR'),
      produtos_unicos: parseInt(row.produtos_unicos),
      quantidade: parseFloat(row.quantidade_total),
      receita: parseFloat(row.receita_total),
      vendas: parseInt(row.total_pedidos)
    }));

    const topSazonais = seasonalResult.rows.map(row => ({
      nome: row.nome,
      variacao: parseFloat(row.variacao)
    }));

    res.json({
      timeSeries: timeSeries,
      top_sazonais: topSazonais
    });
  } catch (error) {
    console.error('Erro em /product-seasonality:', error);
    res.status(500).json({ error: 'Erro ao buscar sazonalidade' });
  }
});

// 🔄 Combinações de Produtos
router.get('/product-combinations', async (req, res) => {
  try {
    const { whereClause, values } = buildWhereClause(req.query);
    const limit = parseInt(req.query.limit) || 15;

    const query = `
      WITH pedidos_validos AS (
        SELECT DISTINCT s.id as sale_id
        FROM sales s
        JOIN channels c ON s.channel_id = c.id
        JOIN stores st ON s.store_id = st.id
        ${whereClause}
      ),
      combinacoes AS (
        SELECT 
          p1.name as produto_principal,
          p2.name as item_combinado,
          COUNT(DISTINCT ps1.sale_id) as frequencia,
          -- Calcular receita total da combinação
          SUM(ps1.total_price + ps2.total_price) as receita_total,
          -- Calcular ticket médio da combinação
          AVG(ps1.total_price + ps2.total_price) as ticket_medio_combinacao,
          -- IDs dos pedidos para calcular métricas adicionais
          ARRAY_AGG(DISTINCT ps1.sale_id) as pedidos_ids
        FROM product_sales ps1
        JOIN products p1 ON ps1.product_id = p1.id
        JOIN product_sales ps2 ON ps1.sale_id = ps2.sale_id AND ps1.product_id < ps2.product_id
        JOIN products p2 ON ps2.product_id = p2.id
        JOIN pedidos_validos pv ON ps1.sale_id = pv.sale_id
        GROUP BY p1.name, p2.name
        HAVING COUNT(DISTINCT ps1.sale_id) > 1
      ),
      total_pedidos AS (
        SELECT COUNT(*) as total FROM pedidos_validos
      ),
      -- Calcular receita média individual dos produtos
      produto_stats AS (
        SELECT 
          p.name as produto,
          AVG(ps.total_price) as preco_medio_individual
        FROM product_sales ps
        JOIN products p ON ps.product_id = p.id
        JOIN pedidos_validos pv ON ps.sale_id = pv.sale_id
        GROUP BY p.name
      )
      SELECT 
        c.produto_principal,
        c.item_combinado,
        c.frequencia,
        COALESCE(c.frequencia::decimal / NULLIF(tp.total, 0), 0) as percentual_pedidos,
        c.receita_total,
        c.ticket_medio_combinacao,
        -- Preços médios individuais para comparação
        ps1.preco_medio_individual as preco_medio_principal,
        ps2.preco_medio_individual as preco_medio_combinado,
        -- Calcular incremento no ticket
        (c.ticket_medio_combinacao - COALESCE(ps1.preco_medio_individual, 0) - COALESCE(ps2.preco_medio_individual, 0)) as incremento_ticket,
        -- Score melhorado considerando frequência e receita
        (c.frequencia * 0.6 + (c.receita_total / 100) * 0.4) as score_combinacao
      FROM combinacoes c
      CROSS JOIN total_pedidos tp
      LEFT JOIN produto_stats ps1 ON c.produto_principal = ps1.produto
      LEFT JOIN produto_stats ps2 ON c.item_combinado = ps2.produto
      ORDER BY c.receita_total DESC, c.frequencia DESC
      LIMIT $${values.length + 1}
    `;

    console.log('✅ Query product-combinations com métricas financeiras');
    
    const result = await pool.query(query, [...values, limit]);
    
    const data = result.rows.map(row => ({
      produto_principal: row.produto_principal,
      item_combinado: row.item_combinado,
      frequencia: parseInt(row.frequencia),
      percentual_pedidos: parseFloat(row.percentual_pedidos),
      receita_total: parseFloat(row.receita_total),
      ticket_medio_combinacao: parseFloat(row.ticket_medio_combinacao),
      preco_medio_principal: parseFloat(row.preco_medio_principal),
      preco_medio_combinado: parseFloat(row.preco_medio_combinado),
      incremento_ticket: parseFloat(row.incremento_ticket),
      score: parseFloat(row.score_combinacao)
    }));

    console.log(`✅ Encontradas ${data.length} combinações`);
    res.json(data);
  } catch (error) {
    console.error('❌ Erro em /product-combinations:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar combinações',
      details: error.message 
    });
  }
});

// 🗂️ Performance por Categoria
router.get('/category-performance', async (req, res) => {
  try {
    const { whereClause, values } = buildWhereClause(req.query);

    const query = `
      WITH categoria_dados AS (
        SELECT 
          COALESCE(cat.name, 'Sem Categoria') as categoria,
          COUNT(DISTINCT ps.product_id) as produtos_unicos,
          SUM(ps.quantity) as quantidade,
          COUNT(DISTINCT ps.sale_id) as pedidos,
          SUM(ps.total_price) as receita,
          AVG(ps.total_price) as ticket_medio
        FROM product_sales ps
        JOIN products p ON ps.product_id = p.id
        LEFT JOIN categories cat ON p.category_id = cat.id
        JOIN sales s ON ps.sale_id = s.id
        JOIN channels c ON s.channel_id = c.id
        JOIN stores st ON s.store_id = st.id
        ${whereClause}
        GROUP BY cat.name
      ),
      receita_total AS (
        SELECT SUM(receita) as total FROM categoria_dados
      )
      SELECT 
        cd.*,
        COALESCE(cd.receita / NULLIF(rt.total, 0), 0) as percentual_receita
      FROM categoria_dados cd
      CROSS JOIN receita_total rt
      ORDER BY cd.receita DESC
    `;

    const result = await pool.query(query, values);
    
    const data = result.rows.map(row => ({
      categoria: row.categoria,
      produtos_unicos: parseInt(row.produtos_unicos),
      quantidade: parseFloat(row.quantidade),
      pedidos: parseInt(row.pedidos),
      receita: parseFloat(row.receita),
      ticket_medio: parseFloat(row.ticket_medio),
      percentual_receita: parseFloat(row.percentual_receita)
    }));

    res.json(data);
  } catch (error) {
    console.error('Erro em /category-performance:', error);
    res.status(500).json({ error: 'Erro ao buscar performance por categoria' });
  }
});

// TODO
// 🔍 Endpoint: Query customizada (FLEXÍVEL)
router.post('/custom-query', async (req, res) => {
  try {
    const { metric, dimension, aggregation, filters } = req.body;

    // Mapeamento de métricas
    const metrics = {
      'revenue': 'SUM(s.total_amount)',
      'orders': 'COUNT(DISTINCT s.id)',
      'avg_ticket': 'AVG(s.total_amount)',
      'customers': 'COUNT(DISTINCT s.customer_id)',
      'items_sold': 'SUM(ps.quantity)',
      'production_time': 'AVG(s.production_seconds)',
      'delivery_time': 'AVG(s.delivery_seconds)'
    };

    // Mapeamento de dimensões
    const dimensions = {
      'channel': 'c.name',
      'store': 'st.name',
      'product': 'p.name',
      'category': 'cat.name',
      'weekday': 'EXTRACT(DOW FROM s.created_at)',
      'hour': 'EXTRACT(HOUR FROM s.created_at)',
      'payment_method': 'pt.description'
    };

    if (!metrics[metric] || !dimensions[dimension]) {
      return res.status(400).json({ error: 'Métrica ou dimensão inválida' });
    }

    const { whereClause, values } = buildWhereClause(filters || {});

    // Construir query dinâmica
    let fromClause = 'FROM sales s JOIN channels c ON s.channel_id = c.id JOIN stores st ON s.store_id = st.id';
    
    if (dimension === 'product' || metric === 'items_sold') {
      fromClause += ' JOIN product_sales ps ON s.id = ps.sale_id JOIN products p ON ps.product_id = p.id LEFT JOIN categories cat ON p.category_id = cat.id';
    }
    
    if (dimension === 'payment_method') {
      fromClause += ' JOIN payments pay ON s.id = pay.sale_id JOIN payment_types pt ON pay.payment_type_id = pt.id';
    }

    const query = `
      SELECT 
        ${dimensions[dimension]} as label,
        ${metrics[metric]} as value
      ${fromClause}
      ${whereClause}
      GROUP BY ${dimensions[dimension]}
      ORDER BY value DESC
      LIMIT 20
    `;

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro em /custom-query:', error);
    res.status(500).json({ error: 'Erro ao executar query customizada' });
  }
});

export default router;