# Ata — controle de atas de reuniões

Web app mobile-first para criar, editar, finalizar e acompanhar ações de atas de reunião. Autenticação e dados ficam no **Supabase** (Auth + Postgres). O administrador aprova quem pode acessar; todos com acesso veem as mesmas atas.

## Configuração do Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Em **Project Settings → API**, copie a **Project URL** e a chave **anon public**.
3. No **SQL Editor**, execute o arquivo [`supabase/schema.sql`](supabase/schema.sql).
4. Em **Authentication → Providers → Email**, **desative Confirm email** (obrigatório). Com confirmação ligada o cadastro falha, porque o app usa e-mail sintético só para o Auth.
5. Copie as variáveis de ambiente:

```bash
cp .env.example .env
```

Preencha `.env`:

```env
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui
```

## Login por CPF

O app usa **CPF + senha**. Internamente o Supabase Auth usa um e-mail sintético (`cpf{CPF}@gmail.com`).

Se você já rodou o `schema.sql` antigo, execute também [`supabase/migration_cpf.sql`](supabase/migration_cpf.sql).

Se a conta admin foi criada com o formato antigo (`@atareunioes.com`), rode também [`supabase/migration_fix_auth_email.sql`](supabase/migration_fix_auth_email.sql) depois de publicar esta versão.

## Primeiro administrador

1. Rode o app e faça o **primeiro cadastro** com CPF.
2. Esse primeiro usuário já nasce como **admin aprovado**.
3. Nos próximos cadastros, use **Usuários** no app para aprovar.

## Como rodar

```bash
npm install
npm run dev
```

Abra o endereço local indicado no terminal (geralmente `http://localhost:5173`).

## Publicar no Render (URL pública)

Uma **URL** é o endereço do site na internet (ex.: `https://ata-capela.onrender.com`). É o link que você compartilha com as pessoas.

1. Envie o projeto para o **GitHub** (se ainda não estiver).
2. Em [render.com](https://render.com) → **New** → **Static Site**.
3. Conecte o repositório.
4. Configure:
   - **Build Command:** `npm ci && npm run build`
   - **Publish Directory:** `dist`
5. Em **Environment**, adicione as mesmas variáveis do `.env`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Clique em **Create Static Site** e aguarde o deploy.
7. No Supabase → **Authentication → URL Configuration**, coloque a URL do Render em **Site URL** (e em Redirect URLs, se pedir).

Pronto: o Render gera um link tipo `https://seu-app.onrender.com`.

## Atas compartilhadas

Todos os usuários **aprovados** veem as mesmas atas. Se alguém cria uma ata e outro não vê:

1. No SQL Editor, rode [`supabase/migration_share_atas.sql`](supabase/migration_share_atas.sql)
2. Em **Database → Replication**, confira se a tabela `atas` está no Realtime
3. Peça para a outra pessoa fechar e abrir o app (ou voltar para a tela)

## Offline e sincronização

Depois de abrir o app online pelo menos uma vez (e estar logado), ele funciona **offline**:

- Lê as atas já baixadas no aparelho
- Cria/edita/exclui atas sem internet
- Ao voltar a conexão, envia as alterações para o Supabase automaticamente

Um aviso na tela mostra quando está sem internet ou com alterações pendentes.

## Funcionalidades

- Login e cadastro com aprovação do administrador
- Painel admin para aprovar / rejeitar usuários
- Lista compartilhada de atas com busca e filtro (rascunho / finalizada)
- Criação e edição de ata: pauta, discussões, decisões, participantes e ações
- Marcar ações como concluídas
- Finalizar / reabrir ata
- Compartilhar ou copiar a ata em texto
- Exclusão com confirmação
- Uso offline com sincronização automática
