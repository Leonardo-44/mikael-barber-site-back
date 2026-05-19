import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.js';
import appointmentRoutes from './routes/appointments.js';

const app = express();
const PORT = process.env.PORT || 3333;

// ── Middlewares globais ──
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
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

// ── 404 ──
app.use((_req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// ── Start ──
app.listen(PORT, () => {
  console.log(`\n🪒 Mikael Barber API rodando na porta ${PORT}`);
  console.log(`   → http://localhost:${PORT}/health\n`);
});
