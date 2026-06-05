import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import authRoutes        from './routes/auth.js';
import appointmentRoutes from './routes/appointments.js';
import productRoutes     from './routes/products.js';
import serviceRoutes     from './routes/services.js';
import clientRoutes      from './routes/clients.js';
import despesasRoutes    from './routes/despesas.js'; // ✅ novo

const app = express();
const PORT = process.env.PORT || 3333;

const allowedOrigins = [
  'https://mikael-barber.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

app.use(cors({
  origin: function (origin, callback) {
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

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Mikael Barber API', timestamp: new Date() });
});

app.use('/api/auth',         authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/products',     productRoutes);
app.use('/api/services',     serviceRoutes);
app.use('/api/clients',      clientRoutes);
app.use('/api/despesas',     despesasRoutes); // ✅ novo

app.use((_req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

app.listen(PORT, () => {
  console.log(`\n🪒 Mikael Barber API rodando na porta ${PORT}`);
  console.log(`   → http://localhost:${PORT}/health\n`);
});