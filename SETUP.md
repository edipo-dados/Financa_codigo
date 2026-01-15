# Guia de Configuração e Deploy

## Pré-requisitos

- Node.js 18+ instalado
- Conta no Supabase (https://supabase.com)
- Conta na Vercel (https://vercel.com) - opcional para deploy

## Configuração Local

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Supabase

1. Acesse https://supabase.com e crie um novo projeto
2. Aguarde a criação do banco de dados
3. Vá em Settings > API para obter suas credenciais:
   - Project URL
   - Anon/Public Key

### 3. Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```bash
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_do_supabase
```

### 4. Executar Migrations no Supabase

1. Acesse o SQL Editor no dashboard do Supabase
2. Copie o conteúdo do arquivo `supabase/migrations/001_initial_schema.sql`
3. Cole no editor e execute

Isso criará:
- Tabelas: profiles, expense_categories, expenses, investment_types, investments, investment_transactions
- Políticas de Row Level Security (RLS)
- Índices para performance
- Trigger para criação automática de perfil

### 5. Criar Categorias e Tipos Iniciais (Opcional)

Execute no SQL Editor do Supabase após criar seu primeiro usuário:

```sql
-- Substitua 'seu-user-id' pelo ID do seu usuário
-- Você pode obter o ID em Authentication > Users

-- Categorias de despesas
INSERT INTO expense_categories (user_id, name, color) VALUES
  ('seu-user-id', 'Alimentação', '#10B981'),
  ('seu-user-id', 'Transporte', '#3B82F6'),
  ('seu-user-id', 'Moradia', '#8B5CF6'),
  ('seu-user-id', 'Saúde', '#EF4444'),
  ('seu-user-id', 'Lazer', '#F59E0B');

-- Tipos de investimento
INSERT INTO investment_types (user_id, name) VALUES
  ('seu-user-id', 'Renda Fixa'),
  ('seu-user-id', 'Ações'),
  ('seu-user-id', 'Fundos Imobiliários'),
  ('seu-user-id', 'Criptomoedas'),
  ('seu-user-id', 'Tesouro Direto');
```

### 6. Executar Localmente

```bash
npm run dev
```

Acesse http://localhost:3000

## Deploy na Vercel

### 1. Conectar Repositório

1. Faça push do código para GitHub/GitLab/Bitbucket
2. Acesse https://vercel.com
3. Clique em "New Project"
4. Importe seu repositório

### 2. Configurar Variáveis de Ambiente

Na Vercel, adicione as mesmas variáveis do `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Deploy

A Vercel fará o deploy automaticamente. Cada push na branch principal gerará um novo deploy.

## Estrutura do Banco de Dados

### Tabelas Principais

**profiles**
- Perfil do usuário (criado automaticamente no signup)

**expense_categories**
- Categorias personalizadas de despesas

**expenses**
- Despesas avulsas e recorrentes
- Suporta categorização e formas de pagamento

**investment_types**
- Tipos de investimento personalizados

**investments**
- Investimentos com valor inicial e atual
- Rastreamento de rentabilidade

**investment_transactions**
- Histórico de aportes, resgates e retornos

### Segurança

- Row Level Security (RLS) habilitado em todas as tabelas
- Usuários só podem acessar seus próprios dados
- Autenticação via Supabase Auth

## Funcionalidades Implementadas

### Despesas
- ✅ Cadastro de despesas avulsas
- ✅ Despesas recorrentes (diária, semanal, mensal, anual)
- ✅ Categorização
- ✅ Forma de pagamento
- ✅ Listagem e exclusão

### Investimentos
- ✅ Cadastro de investimentos
- ✅ Tipos personalizados
- ✅ Instituição/corretora
- ✅ Cálculo automático de rentabilidade
- ✅ Listagem e exclusão

### Dashboard
- ✅ Despesas do mês atual
- ✅ Total investido
- ✅ Retorno dos investimentos
- ✅ Patrimônio líquido
- ✅ Gráfico de despesas por categoria

## Próximos Passos (Melhorias Futuras)

- [ ] Geração automática de despesas recorrentes via cron job
- [ ] Transações de investimento (aportes/resgates)
- [ ] Gráficos de evolução temporal
- [ ] Comparativo mês a mês
- [ ] Exportação de relatórios
- [ ] Metas financeiras
- [ ] Notificações
- [ ] Modo escuro

## Troubleshooting

### Erro de autenticação
- Verifique se as variáveis de ambiente estão corretas
- Confirme que o email foi verificado no Supabase

### Erro ao carregar dados
- Verifique se as migrations foram executadas
- Confirme que o RLS está habilitado
- Verifique o console do navegador para erros

### Erro no deploy
- Confirme que as variáveis de ambiente foram configuradas na Vercel
- Verifique os logs de build na Vercel
