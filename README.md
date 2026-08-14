# 🪒 Mikael Barber — Backend

Backend da aplicação **Mikael Barber**, desenvolvido com Node.js, Express e PostgreSQL.

### 🛠️ Tecnologias

* Node.js
* Express
* JavaScript
* PostgreSQL
* Neon
* JWT
* bcrypt
* Render

---

## 📁 Estrutura

```text
src/
├── config/
│   ├── database.js      # Conexão com o PostgreSQL
│   └── migrate.js       # Criação das tabelas e dados iniciais
├── controllers/
│   ├── authController.js
│   └── appointmentController.js
├── middlewares/
│   └── auth.js          # Proteção das rotas com JWT
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

Copie o arquivo de exemplo:

```bash
cp .env.example .env
```

Depois configure o arquivo `.env` com **suas próprias credenciais**:

```env
DATABASE_URL=postgresql://USUARIO:SENHA@SEU_HOST.neon.tech/SEU_BANCO?sslmode=require
JWT_SECRET=SUA_CHAVE_SECRETA_ALEATORIA
PORT=3333
FRONTEND_URL=http://localhost:5173
```

> ⚠️ Nunca envie o arquivo `.env` para o GitHub.
> As credenciais acima são apenas exemplos.

---

## 🗄️ Banco de dados

Para criar as tabelas:

```bash
npm run db:migrate
```

A migração cria a estrutura necessária para o funcionamento da aplicação.

> 🔐 As credenciais dos usuários não devem ser documentadas no README.
>
> Usuários iniciais, quando necessários, devem ser configurados de forma segura durante a instalação ou através de variáveis de ambiente.

---

## 🚀 Rodando localmente

```bash
npm run dev
```

O servidor ficará disponível em:

```text
http://localhost:3333
```

---

## 🚀 Deploy no Render

1. Suba o projeto para o GitHub.
2. No Render, crie um **Web Service**.
3. Configure:

```text
Build Command:
npm install

Start Command:
npm start
```

4. Configure as variáveis de ambiente no painel do Render:

```text
DATABASE_URL
JWT_SECRET
FRONTEND_URL
```

> ⚠️ Os valores dessas variáveis devem ser configurados diretamente no ambiente do Render.
> Não coloque credenciais reais no código ou no README.

Após o deploy, execute a migração conforme a configuração do projeto:

```bash
npm run db:migrate
```

---

## 🔗 Endpoints

| Método | Rota                      | Descrição                         | Auth |
| ------ | ------------------------- | --------------------------------- | ---- |
| GET    | `/health`                 | Health check                      | ❌    |
| POST   | `/api/auth/login`         | Login                             | ❌    |
| GET    | `/api/auth/me`            | Usuário autenticado               | ✅    |
| GET    | `/api/appointments`       | Meus atendimentos                 | ✅    |
| GET    | `/api/appointments/all`   | Todos os atendimentos autorizados | ✅    |
| GET    | `/api/appointments/stats` | Estatísticas                      | ✅    |
| POST   | `/api/appointments`       | Criar atendimento                 | ✅    |
| PUT    | `/api/appointments/:id`   | Editar atendimento                | ✅    |
| DELETE | `/api/appointments/:id`   | Deletar atendimento               | ✅    |

---

## 🔐 Exemplo de login

Utilize credenciais de teste configuradas localmente:

```bash
curl -X POST http://localhost:3333/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"USUARIO_DE_TESTE","password":"SENHA_DE_TESTE"}'
```

> Nunca coloque senhas reais em exemplos publicados no GitHub.

---

## ➕ Adicionar novo barbeiro

O usuário deve ser criado utilizando uma senha protegida por **bcrypt**.

Exemplo:

```sql
INSERT INTO barbers (name, username, password, avatar)
VALUES (
  'Nome do Barbeiro',
  'usuario_exemplo',
  'HASH_BCRYPT_DA_SENHA',
  'N'
);
```

> 🔐 Nunca coloque uma senha real diretamente no SQL ou no README.
>
> O valor armazenado no banco deve ser o **hash bcrypt**, e não a senha original.

---

## 🔒 Segurança

Antes de publicar o projeto:

* Nunca envie `.env` para o GitHub.
* Nunca publique `DATABASE_URL` real.
* Nunca publique `JWT_SECRET` real.
* Nunca publique senhas de usuários.
* Nunca publique tokens JWT.
* Utilize senhas fortes em produção.
* Utilize bcrypt para armazenar senhas.
* Configure as variáveis sensíveis diretamente no Render.
* Mantenha `.env` no `.gitignore`.

### `.gitignore`

Certifique-se de que o projeto contém:

```gitignore
.env
.env.*
!.env.example
node_modules/
```

O arquivo `.env.example` pode ser publicado no GitHub, desde que contenha apenas valores fictícios.

---

## 📄 Licença

Este projeto foi desenvolvido para fins de estudo e portfólio.
