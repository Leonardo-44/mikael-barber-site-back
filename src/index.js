import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.js';
import appointmentRoutes from './routes/appointments.js';
import productRoutes from './routes/products.js';

const app = express();
const PORT = process.env.PORT || 3333;

// ── Middlewares globais ──
const allowedOrigins = [
  'https://mikaer-barber.vercel.app',
  'http://localhost:5173',                         // Seu ambiente local (Vite)
  'http://127.0.0.1:5173'                         // Alternativa local comum
];

app.use(cors({
  origin: function (origin, callback) {
    // Permite requisições sem origem (como Mobile, Postman, Insomnia)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Bloqueado pela política de CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());

// ── Health check ──
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Mikael Barber API', timestamp: new Date() });
});

// ── Rotas ──
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/products', productRoutes);

// ── 404 ──
app.use((_req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// ── Start ──
app.listen(PORT, () => {
  console.log(`\n🪒 Mikael Barber API rodando na porta ${PORT}`);
  console.log(`   → http://localhost:${PORT}/health\n`);
});

