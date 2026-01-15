# 💰 Controle Financeiro Pessoal

Aplicação full stack completa para gerenciamento de despesas e investimentos pessoais, com design premium inspirado na Apple e desenvolvida com as melhores práticas de arquitetura e segurança.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-cyan)

## ✨ Design Premium

Interface moderna e elegante inspirada no design da Apple:
- 🪟 **Glassmorphism** - Efeitos de vidro e blur
- ✨ **Animações Suaves** - Transições e micro-interações
- 🎨 **Paleta Apple** - Cores vibrantes e profissionais
- 📱 **Responsivo** - Perfeito em qualquer dispositivo
- 🎯 **UX Excepcional** - Atenção aos detalhes

🎉 **[Veja o que há de novo →](WHATS_NEW.md)**

## ✨ Funcionalidades

### 📊 Dashboard Completo
- Visão geral das finanças
- Estatísticas do mês atual
- **Projeções futuras (6 meses)** baseadas em recorrências
- **Gráfico de projeção: Receitas x Despesas**
- Gráficos interativos por categoria
- Patrimônio líquido calculado automaticamente
- Saldo mensal (receitas vs despesas)
- **Botão de atualização em tempo real**

### 💰 Controle de Receitas
- Receitas avulsas e recorrentes
- **Sistema avançado de recorrências:**
  - Frequências: diária, semanal, mensal, anual
  - 3 tipos de término: sem fim, após X ocorrências, até data específica
  - Prévia interativa de ocorrências futuras
  - Lógica mensal especial (ajuste automático de dias)
- Categorização personalizável (6 categorias padrão)
- Fonte/origem da receita
- Filtros e busca (em desenvolvimento)

### 💸 Controle de Despesas
- Despesas avulsas e recorrentes
- **Sistema avançado de recorrências** (mesmo das receitas)
- Categorização personalizável
- Formas de pagamento
- Filtros e busca (em desenvolvimento)

### 📈 Gestão de Investimentos
- Cadastro de investimentos
- Tipos personalizáveis
- Cálculo automático de rentabilidade
- Histórico de transações (aportes/resgates)

### 🔒 Segurança
- Autenticação via Supabase Auth
- Row Level Security (RLS)
- Dados isolados por usuário
- JWT tokens seguros

## 🚀 Início Rápido

### Pré-requisitos
- Node.js 18+
- Conta no Supabase (gratuita)
- Conta na Vercel (opcional, para deploy)

### Instalação

```bash
# 1. Clone o repositório
git clone <seu-repositorio>
cd controle-financeiro

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.local.example .env.local
# Edite .env.local com suas credenciais do Supabase

# 4. Execute as migrations no Supabase
# (Copie e execute os arquivos em supabase/migrations/ no SQL Editor)

# 5. Inicie o servidor de desenvolvimento
npm run dev
```

Acesse http://localhost:3000

📖 **Guia Completo**: Veja [QUICKSTART.md](QUICKSTART.md) para instruções detalhadas passo a passo.

## 🏗️ Tecnologias

### Frontend
- **Next.js 14** - Framework React com App Router
- **React 18** - Biblioteca UI com Hooks
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização utility-first
- **Recharts** - Visualização de dados

### Backend
- **Supabase** - Backend-as-a-Service
  - PostgreSQL - Banco de dados relacional
  - Auth - Autenticação JWT
  - Row Level Security - Segurança de dados
- **Next.js API Routes** - Endpoints serverless

### Deploy
- **Vercel** - Hospedagem e CI/CD
- **Supabase Cloud** - Banco de dados gerenciado

## 📁 Estrutura do Projeto

```
controle-financeiro/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx           # Página de login
│   │   ├── layout.tsx         # Layout raiz
│   │   └── dashboard/         # Área autenticada
│   ├── components/            # Componentes React
│   │   ├── AuthForm.tsx      # Autenticação
│   │   ├── DashboardStats.tsx # Estatísticas
│   │   ├── ExpensesList.tsx  # Lista de despesas
│   │   └── InvestmentsList.tsx # Lista de investimentos
│   ├── hooks/                 # Custom React Hooks
│   │   ├── useAuth.ts        # Hook de autenticação
│   │   ├── useExpenses.ts    # Hook de despesas
│   │   └── useInvestments.ts # Hook de investimentos
│   ├── lib/                   # Utilitários
│   │   ├── supabase.ts       # Cliente Supabase
│   │   └── utils.ts          # Funções auxiliares
│   └── types/                 # TypeScript types
├── supabase/
│   └── migrations/            # Database migrations
├── scripts/                   # Scripts úteis
└── docs/                      # Documentação
```

## 📚 Documentação

### Guias Principais
- **[QUICKSTART.md](QUICKSTART.md)** - Guia rápido de início (10 minutos)
- **[SETUP.md](SETUP.md)** - Guia completo de configuração e deploy
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Arquitetura e decisões técnicas
- **[API_EXAMPLES.md](API_EXAMPLES.md)** - Exemplos de uso da API
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Como contribuir

### Features
- **[INCOMES_FEATURE.md](INCOMES_FEATURE.md)** - Módulo de receitas completo
- **[RECURRENCE_FEATURE.md](RECURRENCE_FEATURE.md)** - Sistema de recorrências avançado
- **[NOVAS_FUNCIONALIDADES.md](NOVAS_FUNCIONALIDADES.md)** - Projeções e gráficos

### Design
- **[DESIGN_UPDATES.md](DESIGN_UPDATES.md)** - Detalhes das melhorias de design
- **[COMPONENT_GUIDE.md](COMPONENT_GUIDE.md)** - Guia de componentes
- **[CUSTOMIZATION_GUIDE.md](CUSTOMIZATION_GUIDE.md)** - Personalização
- **[VISUAL_SHOWCASE.md](VISUAL_SHOWCASE.md)** - Showcase visual

### Utilitários
- **[DESABILITAR_CONFIRMACAO_EMAIL.md](DESABILITAR_CONFIRMACAO_EMAIL.md)** - Configurar autenticação
- **[SOLUCAO_EMAIL.md](SOLUCAO_EMAIL.md)** - Solução rápida para email
- **[PERFORMANCE_TIPS.md](PERFORMANCE_TIPS.md)** - Dicas de performance
- **[WINDOWS_SETUP.md](WINDOWS_SETUP.md)** - Setup específico para Windows

### SQL
- **[ATUALIZAR_BANCO_SIMPLES.sql](ATUALIZAR_BANCO_SIMPLES.sql)** - Script de atualização do banco
- **[CORRIGIR_SCHEMA.sql](CORRIGIR_SCHEMA.sql)** - Correção de schema

## 🗄️ Modelo de Dados

### Tabelas Principais

- **profiles** - Perfis de usuários
- **expense_categories** - Categorias de despesas
- **expenses** - Despesas (avulsas e recorrentes)
- **income_categories** - Categorias de receitas
- **incomes** - Receitas (avulsas e recorrentes)
- **investment_types** - Tipos de investimento
- **investments** - Investimentos
- **investment_transactions** - Transações de investimentos

### Relacionamentos

```
User (1) ──< (N) Expense Categories
User (1) ──< (N) Expenses
User (1) ──< (N) Income Categories
User (1) ──< (N) Incomes
User (1) ──< (N) Investment Types
User (1) ──< (N) Investments
Investment (1) ──< (N) Transactions
```

## 🔐 Segurança

- **Row Level Security (RLS)** habilitado em todas as tabelas
- Políticas de acesso por usuário
- Autenticação JWT via Supabase
- Validação de dados no backend
- Proteção contra SQL injection
- HTTPS obrigatório em produção

## 🚀 Deploy

### Vercel (Recomendado)

1. Push para GitHub/GitLab/Bitbucket
2. Conecte na Vercel
3. Configure variáveis de ambiente
4. Deploy automático!

Veja [SETUP.md](SETUP.md) para instruções detalhadas.

## 🛠️ Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia servidor de desenvolvimento

# Produção
npm run build        # Build de produção
npm start            # Inicia servidor de produção

# Qualidade de Código
npm run type-check   # Verifica tipos TypeScript
npm run lint         # Executa linter
```

## 🎯 Roadmap

### ✅ Concluído (v1.3.0)
- [x] Sistema de recorrências avançado
- [x] Módulo de receitas completo
- [x] Projeções futuras (6 meses)
- [x] Gráfico de projeção Receitas x Despesas
- [x] Botão de atualização em tempo real

### Em Desenvolvimento
- [ ] Geração automática de despesas recorrentes
- [ ] Filtros avançados
- [ ] Busca de despesas/investimentos/receitas

### Planejado
- [ ] Gráficos de evolução temporal
- [ ] Comparativo mês a mês
- [ ] Exportação de relatórios (PDF/Excel)
- [ ] Metas financeiras
- [ ] Notificações
- [ ] Modo escuro
- [ ] PWA (Progressive Web App)
- [ ] Multi-moeda

## 🤝 Como Contribuir

Contribuições são bem-vindas! Veja [CONTRIBUTING.md](CONTRIBUTING.md) para diretrizes.

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'feat: Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja [LICENSE](LICENSE) para mais detalhes.

## 🙏 Agradecimentos

- [Next.js](https://nextjs.org/) - Framework React
- [Supabase](https://supabase.com/) - Backend-as-a-Service
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS
- [Recharts](https://recharts.org/) - Biblioteca de gráficos
- [Vercel](https://vercel.com/) - Plataforma de deploy

## 📧 Contato

Para dúvidas ou sugestões, abra uma issue no repositório.

---

Desenvolvido com ❤️ usando Next.js, React e Supabase
