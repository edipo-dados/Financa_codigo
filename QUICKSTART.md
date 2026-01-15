# Guia Rápido de Início

Este guia vai te ajudar a ter a aplicação rodando em menos de 10 minutos.

## Passo 1: Clonar e Instalar (2 min)

```bash
# Clone o repositório (se aplicável)
git clone <seu-repositorio>
cd controle-financeiro

# Instale as dependências
npm install
```

## Passo 2: Configurar Supabase (3 min)

1. Acesse https://supabase.com e faça login
2. Clique em "New Project"
3. Preencha:
   - Nome do projeto: "Controle Financeiro"
   - Database Password: (escolha uma senha forte)
   - Region: (escolha a mais próxima)
4. Aguarde 2 minutos para o projeto ser criado

## Passo 3: Obter Credenciais (1 min)

1. No dashboard do Supabase, vá em **Settings** > **API**
2. Copie:
   - **Project URL** (algo como: https://xxxxx.supabase.co)
   - **anon/public key** (uma chave longa começando com "eyJ...")

## Passo 4: Configurar Variáveis de Ambiente (1 min)

Crie um arquivo `.env.local` na raiz do projeto:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...sua-chave-aqui
```

## Passo 5: Executar Migrations (2 min)

1. No dashboard do Supabase, vá em **SQL Editor**
2. Clique em "New Query"
3. Copie todo o conteúdo de `supabase/migrations/001_initial_schema.sql`
4. Cole no editor e clique em **Run**
5. Repita com `supabase/migrations/002_seed_data.sql`

Você verá mensagens de sucesso. Isso criou todas as tabelas e configurações de segurança.

## Passo 6: Iniciar a Aplicação (1 min)

```bash
npm run dev
```

Acesse http://localhost:3000

## Passo 7: Criar sua Conta

1. Na página inicial, clique em "Criar Conta"
2. Preencha:
   - Nome completo
   - Email
   - Senha (mínimo 6 caracteres)
3. Clique em "Criar Conta"
4. Verifique seu email e clique no link de confirmação
5. Faça login

## Pronto! 🎉

Você já pode:
- ✅ Adicionar despesas
- ✅ Cadastrar investimentos
- ✅ Ver estatísticas no dashboard
- ✅ Gerenciar categorias e tipos

## Próximos Passos

### Personalizar Categorias

1. Vá na aba **Configurações**
2. Adicione suas categorias de despesas favoritas
3. Escolha cores para cada uma

### Adicionar sua Primeira Despesa

1. Vá na aba **Despesas**
2. Clique em "Nova Despesa"
3. Preencha os dados
4. Clique em "Adicionar Despesa"

### Adicionar seu Primeiro Investimento

1. Vá na aba **Investimentos**
2. Clique em "Novo Investimento"
3. Preencha os dados
4. Clique em "Adicionar Investimento"

## Troubleshooting Rápido

### Erro: "Invalid API key"
- Verifique se copiou corretamente as credenciais do Supabase
- Certifique-se de que o arquivo `.env.local` está na raiz do projeto
- Reinicie o servidor (`Ctrl+C` e `npm run dev` novamente)

### Erro: "relation does not exist"
- As migrations não foram executadas
- Volte ao Passo 5 e execute as migrations

### Erro: "Email not confirmed"
- Verifique sua caixa de entrada
- Procure por email do Supabase
- Clique no link de confirmação

### Página em branco
- Abra o console do navegador (F12)
- Verifique se há erros
- Certifique-se de que o servidor está rodando

## Deploy Rápido na Vercel (Opcional)

1. Faça push do código para GitHub
2. Acesse https://vercel.com
3. Clique em "New Project"
4. Importe seu repositório
5. Adicione as variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Clique em "Deploy"

Em 2 minutos sua aplicação estará online! 🚀

## Comandos Úteis

```bash
# Iniciar desenvolvimento
npm run dev

# Build de produção
npm run build

# Verificar tipos
npm run type-check

# Lint
npm run lint
```

## Precisa de Ajuda?

Consulte a documentação completa:
- **SETUP.md** - Guia detalhado de configuração
- **ARCHITECTURE.md** - Entenda a arquitetura
- **API_EXAMPLES.md** - Exemplos de código
- **PROJECT_SUMMARY.md** - Visão geral do projeto

## Dicas

💡 **Categorias Padrão**: Ao criar sua conta, categorias e tipos padrão são criados automaticamente!

💡 **Despesas Recorrentes**: Marque a opção "Despesa recorrente" para contas mensais como aluguel.

💡 **Gráficos**: O dashboard mostra automaticamente seus gastos por categoria em um gráfico de pizza.

💡 **Segurança**: Seus dados são protegidos por Row Level Security - ninguém mais pode vê-los!

Bom controle financeiro! 💰📊
