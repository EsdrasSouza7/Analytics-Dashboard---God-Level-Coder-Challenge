import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'challenge_db',
  user: process.env.DB_USER || 'challenge',
  password: process.env.DB_PASSWORD || 'challenge_2024'
});

// Testar conexão
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Erro ao conectar no banco:', err);
  } else {
    console.log('✅ Conectado ao PostgreSQL:', res.rows[0].now);
  }
});

export default pool;