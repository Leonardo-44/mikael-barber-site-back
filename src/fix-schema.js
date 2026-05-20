import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL);

async function reset() {
  await sql`DROP TABLE IF EXISTS appointments CASCADE`;
  await sql`DROP TABLE IF EXISTS barbers CASCADE`;
  console.log('Tabelas removidas. Rode migrate.js agora.');
  process.exit(0);
}

reset().catch(console.error);