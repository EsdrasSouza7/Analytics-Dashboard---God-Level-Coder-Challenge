import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api.js';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const aiQueryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 50, // máximo 50 requests por IP
  message: { 
    error: 'Muitas requisições',
    message: 'Você excedeu o limite de consultas. Tente novamente em 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middlewares
app.use(cors());
app.use(express.json());

// Rotas
app.use('/api', apiRoutes);
app.use('/api/ai-query', aiQueryLimiter);

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Restaurant Analytics API' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});