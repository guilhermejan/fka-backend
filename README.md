# FKA Imports · Backend

API do FKA Imports, projeto desenvolvido para uma empresa de importação de produtos. O backend conecta o catálogo e o painel administrativo ao banco de dados e aos serviços externos.

## Funcionalidades

- Autenticação administrativa com JWT.
- Cadastro, consulta, edição e exclusão de produtos.
- Gerenciamento de produtos em destaque.
- Gerenciamento de avaliações.
- Upload de imagens com Cloudinary.
- Configurações do site.
- Integração com Google Analytics.
- Proteção com Helmet e limite de requisições.

## Tecnologias

- Node.js
- Express
- PostgreSQL
- Supabase
- Cloudinary
- JWT e bcrypt
- Google Analytics Data API

## Como usar

### 1. Clone o repositório

```bash
git clone https://github.com/guilhermejan/fka-backend.git
cd fka-backend
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure o ambiente

Use o arquivo `.env.example` como modelo. Pela estrutura atual do projeto, o arquivo `.env` deve ficar no diretório pai de `fka-backend`.

Principais variáveis:

```env
DB_HOST=
DB_PORT=5432
DB_NAME=postgres
DB_USER=
DB_PASSWORD=
JWT_SECRET=
CORS_ORIGINS=http://localhost:5500
PORT=3000
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
GA4_PROPERTY_ID=
GA4_SERVICE_ACCOUNT_JSON=
```

### 4. Execute

Modo de desenvolvimento:

```bash
npm run dev
```

Execução normal:

```bash
npm start
```

Por padrão, a API fica disponível em `http://localhost:3000/api`.

## Rotas principais

| Rota | Finalidade |
| --- | --- |
| `/api/products` | Produtos e destaques |
| `/api/auth` | Autenticação |
| `/api/settings` | Configurações |
| `/api/analytics` | Indicadores |
| `/api/reviews` | Avaliações |
| `/api/upload` | Upload de imagens |

## Frontend

A interface utilizada pelo projeto está em [fka-frontend](https://github.com/guilhermejan/fka-frontend).
