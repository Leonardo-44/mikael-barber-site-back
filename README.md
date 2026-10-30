# 🪒 Mikael Barber — Backend

Backend da aplicação **Mikael Barber**, desenvolvido com Node.js e Express.

## 🛠️ Tecnologias

* Node.js
* Express
* PostgreSQL
* Neon
* JWT
* bcrypt

## 📁 Estrutura

```text id="2f7x8m"
src/
├── config/
│   ├── database.js
│   └── migrate.js
├── controllers/
│   ├── authController.js
│   └── appointmentController.js
├── middlewares/
│   └── auth.js
├── routes/
│   ├── auth.js
│   └── appointments.js
└── index.js
```

## ⚙️ Instalação

Clone o projeto e instale as dependências:

```bash id="m5j3qk"
npm install
```

Crie o arquivo `.env`:

```env id="q2v8nd"
DATABASE_URL=postgresql://USUARIO:SENHA@SEU_HOST.neon.tech/SEU_BANCO?sslmode=require
JWT_SECRET=SUA_CHAVE_SECRETA
PORT=3333
FRONTEND_URL=http://localhost:5173
```

> Não publique o arquivo `.env` no GitHub.

## 🗄️ Banco de dados

Execute a migração:

```bash id="r9c4tx"
npm run db:migrate
```

## ▶️ Desenvolvimento

```bash id="k3m7pz"
npm run dev
```

Servidor local:

```text id="v6n2qa"
http://localhost:3333
```

## 🔗 API

| Método | Endpoint                  | Descrição             | Auth |
| ------ | ------------------------- | --------------------- | ---- |
| GET    | `/health`                 | Status da API         | ❌    |
| POST   | `/api/auth/login`         | Login                 | ❌    |
| GET    | `/api/auth/me`            | Usuário autenticado   | ✅    |
| GET    | `/api/appointments`       | Atendimentos          | ✅    |
| GET    | `/api/appointments/all`   | Todos os atendimentos | ✅    |
| GET    | `/api/appointments/stats` | Estatísticas          | ✅    |
| POST   | `/api/appointments`       | Criar atendimento     | ✅    |
| PUT    | `/api/appointments/:id`   | Editar atendimento    | ✅    |
| DELETE | `/api/appointments/:id`   | Excluir atendimento   | ✅    |

## 🚀 Deploy

O backend pode ser hospedado no **Render**.

Configure no ambiente de produção:

```text id="h8k2zs"
DATABASE_URL
JWT_SECRET
FRONTEND_URL
```

Não coloque valores reais dessas variáveis no código ou no GitHub.

## 🔒 Variáveis de ambiente

O projeto utiliza:

```text id="n4x7cw"
DATABASE_URL
JWT_SECRET
PORT
FRONTEND_URL
```

Mantenha as informações sensíveis apenas no `.env` local ou nas variáveis de ambiente do serviço de hospedagem.
