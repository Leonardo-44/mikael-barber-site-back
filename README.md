# 🪒 Mikael Barber — Backend

Node.js + Express + JavaScript | Neon (PostgreSQL) | Deploy no Render

---

## 📁 Estrutura

```
src/
├── config/
│   ├── database.js      # Conexão com Neon
│   └── migrate.js       # Cria tabelas e insere barbeiros padrão
├── controllers/
│   ├── authController.js
│   └── appointmentController.js
├── middlewares/
│   └── auth.js          # Proteção JWT
├── routes/
│   ├── auth.js
│   └── appointments.js
└── index.js             # Entry point
```

---

## ⚙️ Setup local

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar variáveis de ambiente
```bash
cp .env.example .env
```

Edite o `.env`:
```env
DATABASE_URL=postgresql://user:senha@host.neon.tech/neondb?sslmode=require
JWT_SECRET=chave_secreta_longa_e_aleatoria
PORT=3333
FRONTEND_URL=http://localhost:5173
```

### 3. Criar tabelas no banco
```bash
npm run db:migrate
```
Isso cria as tabelas e insere dois barbeiros com senha `1234`:
- usuário: `mikael`
- usuário: `rafael`

### 4. Rodar em desenvolvimento
```bash
npm run dev
```

---

## 🚀 Deploy no Render

1. Suba o código no GitHub
2. No Render: **New → Web Service**
3. Configure:
   - **Root Directory:** *(raiz do repo)*
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Adicione as variáveis de ambiente:
   ```
   DATABASE_URL  = [connection string do Neon]
   JWT_SECRET    = [sua chave secreta]
   FRONTEND_URL  = [URL do seu frontend]
   ```
5. Após o primeiro deploy, rode a migração via **Render Shell**:
   ```bash
   npm run db:migrate
   ```

---

## 🔗 Endpoints

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| GET | `/health` | Health check | ❌ |
| POST | `/api/auth/login` | Login | ❌ |
| GET | `/api/auth/me` | Barbeiro logado | ✅ |
| GET | `/api/appointments` | Meus atendimentos | ✅ |
| GET | `/api/appointments/all` | Todos os atendimentos | ✅ |
| GET | `/api/appointments/stats` | Estatísticas | ✅ |
| POST | `/api/appointments` | Criar atendimento | ✅ |
| PUT | `/api/appointments/:id` | Editar atendimento | ✅ |
| DELETE | `/api/appointments/:id` | Deletar atendimento | ✅ |

### Exemplo de login
```bash
curl -X POST http://localhost:3333/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"mikael","password":"1234"}'
```

### Exemplo de criar atendimento
```bash
curl -X POST http://localhost:3333/api/appointments \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "client_name": "João Silva",
    "client_phone": "(99) 99999-9999",
    "haircut": "Degradê",
    "consumed": ["Cerveja", "Água"],
    "price": 45.00,
    "notes": "Cliente VIP"
  }'
```

---

## ➕ Adicionar novo barbeiro

No painel do Neon (SQL Editor):
```sql
-- Gere o hash em: https://bcrypt.online (rounds: 10)
INSERT INTO barbers (name, username, password, avatar)
VALUES ('Nome', 'usuario', '$2a$10$HASH_AQUI', 'N');
```
