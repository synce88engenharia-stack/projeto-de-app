# Controle de Obra — Synce88

Aplicativo interno de controle diário de obra: presença/falta, refeição (custo fixo pago quinzenalmente, em espécie ou dinheiro), merenda, deslocamento e cadastro de obras/funcionários, com relatório quinzenal de fechamento.

## Stack

Next.js 16 (App Router) + TypeScript + Prisma + PostgreSQL, com autenticação single-admin (cookie de sessão assinado, sem tabela de usuários).

## Setup local

### 1. Pré-requisitos

- Node.js 20+
- PostgreSQL rodando localmente (ou uma connection string de um Postgres gerenciado, ex: Neon)

### 2. Instalar dependências

```bash
npm install
```

### 3. Banco de dados

Crie um banco e um usuário para a aplicação (ajuste conforme seu Postgres local):

```sql
CREATE USER obraapp WITH PASSWORD 'sua_senha';
CREATE DATABASE obraapp OWNER obraapp;
ALTER USER obraapp CREATEDB; -- necessário para o shadow database do Prisma Migrate
```

### 4. Variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

```bash
cp .env.example .env
```

- `DATABASE_URL`: connection string do Postgres.
- `ADMIN_USERNAME`: usuário do admin único.
- `ADMIN_PASSWORD_HASH`: hash bcrypt da senha do admin (gere com o comando abaixo).
- `SESSION_SECRET`: string aleatória longa para assinar o cookie de sessão (`openssl rand -base64 32`).

Gerar o hash da senha:

```bash
npx tsx scripts/hash-password.ts "sua-senha"
```

**Importante**: o hash bcrypt começa com `$2b$10$...`. O Next.js expande `$VARIAVEL` dentro de arquivos `.env`, então ao colar o hash em `.env` escape todo `$` como `\$` (o comando acima já imprime a linha pronta para colar, com o escape aplicado).

### 5. Migrations e seed

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

O seed cria a configuração padrão (refeição R$14, merenda R$6), uma obra de exemplo e três funcionários para teste local.

### 6. Rodar

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) e faça login com `ADMIN_USERNAME` / a senha usada para gerar o hash.

## Testes

```bash
npm run test
```

Cobre a lógica de cálculo de quinzena (`lib/quinzena.ts`) e do relatório de fechamento (`lib/relatorio.ts`), que é a parte mais sensível do sistema (valores pagos aos funcionários).

## Estrutura

- `prisma/schema.prisma` — modelo de dados (Obra, Funcionario, RegistroDiario, Configuracao).
- `lib/quinzena.ts` / `lib/relatorio.ts` — regras de negócio puras (quinzena = dias 1–15 e 16–fim do mês; agregação do relatório).
- `lib/auth.ts` / `proxy.ts` — autenticação single-admin via cookie de sessão assinado (JWT via `jose`).
- `app/(app)/*` — telas autenticadas (dashboard, obras, funcionários, lançamento diário, relatório quinzenal, configurações, histórico do funcionário).
- `app/api/*` — rotas da API usadas pelas telas.

## Deploy

O Postgres é obrigatório em produção — não há suporte a SQLite. Para publicar em um host com banco gerenciado (ex: Vercel + Neon):

1. Crie um banco Postgres gerenciado e obtenha a `DATABASE_URL` de produção.
2. Configure as variáveis de ambiente de produção (`DATABASE_URL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `SESSION_SECRET`) no host escolhido.
3. Rode as migrations contra o banco de produção: `npx prisma migrate deploy`.
4. Publique a aplicação (`npm run build` seguido do comando de start do host, ou o fluxo padrão de deploy do provedor).

Não rode o seed de exemplo (`prisma db seed`) em produção — ele cria dados fictícios de demonstração.
