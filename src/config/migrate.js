import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL não definida no .env');
}

const sql = neon(process.env.DATABASE_URL);

async function migrate() {
  console.log('🔧 Rodando migrações...');

  // ── 1. Barbeiros ──────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS barbers (
      id         SERIAL       PRIMARY KEY,
      name       VARCHAR(100) NOT NULL,
      username   VARCHAR(50)  NOT NULL UNIQUE,
      password   VARCHAR(255) NOT NULL,
      avatar     VARCHAR(10),
      created_at TIMESTAMPTZ  DEFAULT NOW()
    )
  `;
  console.log('✅ Tabela barbers criada');

  // ── 2. Agendamentos ───────────────────────────────────────
  // FIX 1: haircut → cut  (bate com o frontend)
  // FIX 2: consumed TEXT[] → consumables JSONB  (aceita [{ name, price }])
  // FIX 3: status padronizado em inglês + CHECK constraint
  await sql`
    CREATE TABLE IF NOT EXISTS appointments (
      id           SERIAL       PRIMARY KEY,
      barber_id    INT          NOT NULL REFERENCES barbers(id),

      -- Dados do cliente
      client_name  VARCHAR(100) NOT NULL,
      client_phone VARCHAR(20),

      -- Serviço  (FIX 1: era "haircut")
      cut          VARCHAR(100) NOT NULL,

      -- Valores
      service_price NUMERIC(8,2),
      total_price   NUMERIC(8,2),

      -- Consumíveis com preço  (FIX 2: era TEXT[])
      consumables  JSONB        NOT NULL DEFAULT '[]',

      -- Controle  (FIX 3: valores em inglês + CHECK)
      obs          TEXT,
      status       VARCHAR(20)  NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('done', 'pending', 'cancelled')),

      scheduled_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      created_at   TIMESTAMPTZ  DEFAULT NOW()
    )
  `;
  console.log('✅ Tabela appointments criada');

  // ── Índices úteis ─────────────────────────────────────────
  await sql`CREATE INDEX IF NOT EXISTS idx_appt_barber ON appointments (barber_id, scheduled_at)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_appt_status ON appointments (status)`;
  console.log('✅ Índices criados');

  // ── 3. Seed: barbeiros padrão (senha: 1234) ───────────────
  const hash = await bcrypt.hash('1234', 10);

  await sql`
    INSERT INTO barbers (name, username, password, avatar)
    VALUES
      ('Mikael', 'mikael', ${hash}, 'M'),
      ('Lucas',  'lucas',  ${hash}, 'L'),
      ('Rafael', 'rafael', ${hash}, 'R')
    ON CONFLICT (username) DO NOTHING
  `;
  console.log('✅ Barbeiros inseridos (senha padrão: 1234)');

  console.log('\n🎉 Migrações concluídas!');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('❌ Erro na migração:', err);
  process.exit(1);
});