# 🏦 EAS Controle Financeiro

<div align="center">
  
  ![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
  ![License](https://img.shields.io/badge/license-Proprietary-red.svg)
  ![Author](https://img.shields.io/badge/author-Édipo%20de%20Almeida%20Santos-green.svg)
  ![Next.js](https://img.shields.io/badge/Next.js-14-black)
  ![React](https://img.shields.io/badge/React-18-blue)
  ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
  
  **Sistema inteligente de gestão financeira pessoal com IA**
  
</div>

---

## 📋 Sobre o Projeto

EAS Controle Financeiro é uma aplicação web moderna e profissional para gestão completa de finanças pessoais, desenvolvida com as mais recentes tecnologias do mercado. Interface premium com tema dark/light profissional estilo fintech.

### ✨ Principais Funcionalidades

- 💰 **Gestão de Receitas**: Controle completo de entradas com categorização personalizada
- 💸 **Controle de Despesas**: Acompanhamento detalhado de gastos com múltiplas formas de pagamento
- 💳 **Cartões de Crédito**: Sistema completo com parcelamento automático e controle de faturas
- 📈 **Investimentos**: Acompanhamento de rentabilidade e performance dos investimentos
- 🤖 **Análise com IA**: Insights inteligentes e recomendações personalizadas baseadas em seus dados
- 🔄 **Lançamentos Recorrentes**: Automação de receitas e despesas fixas com projeções futuras
- 📊 **Dashboard Avançado**: Gráficos interativos e KPIs configuráveis em tempo real
- 🌓 **Tema Dark/Light**: Interface profissional fintech com paleta de cores otimizada
- 📱 **Responsivo**: Funciona perfeitamente em todos os dispositivos
- ✅ **Status de Pagamento**: Controle de contas pagas e a pagar

## 🚀 Tecnologias Utilizadas

### Frontend
- **Next.js 14** - Framework React com App Router
- **React 18** - Biblioteca UI com Hooks
- **TypeScript 5** - Tipagem estática
- **Tailwind CSS** - Estilização utility-first com tema customizado
- **Recharts** - Visualização de dados com gráficos interativos

### Backend
- **Supabase** - Backend-as-a-Service
  - PostgreSQL - Banco de dados relacional
  - Auth - Autenticação JWT
  - Row Level Security - Segurança de dados
- **Next.js API Routes** - Endpoints serverless

### Deploy
- **Vercel** - Hospedagem e CI/CD
- **Supabase Cloud** - Banco de dados gerenciado

## 🎨 Design Premium

Interface moderna e elegante com design profissional fintech:
- 🪟 **Glassmorphism** - Efeitos de vidro e blur
- ✨ **Animações Suaves** - Transições e micro-interações
- 🎨 **Paleta Fintech** - Azuis escuros e cores vibrantes
- 📱 **Responsivo** - Perfeito em qualquer dispositivo
- 🎯 **UX Excepcional** - Atenção aos detalhes
- 🌓 **Dark Mode** - Tema escuro profissional sem cinzas

## 🚀 Início Rápido

### Pré-requisitos
- Node.js 18+
- Conta no Supabase (gratuita)
- Conta na Vercel (opcional, para deploy)

### Instalação

```bash
# 1. Clone o repositório
git clone <seu-repositorio>
cd eas-controle-financeiro

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.local.example .env.local
# Edite .env.local com suas credenciais do Supabase

# 4. Execute o script SQL consolidado no Supabase
# Copie e execute EXECUTAR_NO_SUPABASE.sql no SQL Editor

# 5. Inicie o servidor de desenvolvimento
npm run dev
```

Acesse http://localhost:3000

## 📁 Estrutura do Projeto

```
eas-controle-financeiro/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx           # Página de login
│   │   ├── layout.tsx         # Layout raiz com Footer
│   │   └── dashboard/         # Área autenticada
│   ├── components/            # Componentes React
│   │   ├── AuthForm.tsx      # Autenticação
│   │   ├── DashboardStats.tsx # Estatísticas e gráficos
│   │   ├── ExpensesList.tsx  # Lista de despesas
│   │   ├── IncomesList.tsx   # Lista de receitas
│   │   ├── InvestmentsList.tsx # Lista de investimentos
│   │   ├── CreditCardManager.tsx # Gestão de cartões
│   │   ├── FinancialInsights.tsx # Análise com IA
│   │   ├── ThemeSettings.tsx # Configurações de tema
│   │   ├── Navigation.tsx    # Navegação principal
│   │   └── Footer.tsx        # Rodapé com copyright
│   ├── contexts/              # React Contexts
│   │   └── ThemeContext.tsx  # Contexto de tema
│   ├── hooks/                 # Custom React Hooks
│   │   ├── useAuth.ts        # Hook de autenticação
│   │   ├── useExpenses.ts    # Hook de despesas
│   │   ├── useInvestments.ts # Hook de investimentos
│   │   ├── useIncomes.ts     # Hook de receitas
│   │   └── useCreditCards.ts # Hook de cartões
│   ├── lib/                   # Utilitários
│   │   ├── supabase.ts       # Cliente Supabase
│   │   ├── utils.ts          # Funções auxiliares
│   │   ├── recurrence.ts     # Lógica de recorrências
│   │   ├── creditCard.ts     # Lógica de cartões
│   │   └── config.ts         # Configurações da aplicação
│   └── types/                 # TypeScript types
├── supabase/
│   └── migrations/            # Database migrations
├── public/
│   └── images/                # Imagens e assets
└── EXECUTAR_NO_SUPABASE.sql  # Script SQL consolidado
```

## 🗄️ Modelo de Dados

### Tabelas Principais

- **profiles** - Perfis de usuários
- **expense_categories** - Categorias de despesas
- **expenses** - Despesas (com suporte a cartão e parcelamento)
- **income_categories** - Categorias de receitas
- **incomes** - Receitas (avulsas e recorrentes)
- **investment_types** - Tipos de investimento
- **investments** - Investimentos
- **investment_transactions** - Transações de investimentos
- **credit_cards** - Cartões de crédito

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

Veja [WINDOWS_SETUP.md](WINDOWS_SETUP.md) para instruções detalhadas no Windows.

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

## 📚 Documentação Completa

### 👤 Para Usuários Finais
- **[📖 Manual do Usuário](MANUAL_DO_USUARIO.md)** - Guia completo e detalhado para usar todas as funcionalidades
- **📥 Download PDF** - Disponível na seção "Sobre" da aplicação (aba "Manual")
- **📱 Seção "Sobre"** - Disponível dentro da aplicação (aba "Sobre" no dashboard)

### 👨‍💻 Para Desenvolvedores
- **[🔧 Documentação Técnica](DOCUMENTACAO_TECNICA.md)** - Arquitetura, componentes, hooks e implementação detalhada
- **[⚙️ Guia de Setup](SETUP.md)** - Configuração completa do ambiente de desenvolvimento
- **[🗄️ Configuração Supabase](CONFIGURAR_SUPABASE_REAL.md)** - Setup detalhado do banco de dados

### 📋 Guias Específicos
- **[📊 Dashboard Configurável](DASHBOARD_CONFIGURAVEL_GUIDE.md)** - Como personalizar widgets e layouts
- **[📱 Responsividade Mobile](MOBILE_RESPONSIVENESS_GUIDE.md)** - Design responsivo e mobile-first
- **[📄 Informe de Rendimentos](INFORME_RENDIMENTOS_GUIDE.md)** - Geração de relatórios financeiros
- **[🪟 Setup Windows](WINDOWS_SETUP.md)** - Instruções específicas para Windows

## 🎯 Funcionalidades Implementadas

### ✅ Versão 1.0.0
- [x] Sistema de autenticação completo
- [x] Gestão de receitas com categorias
- [x] Controle de despesas com categorias
- [x] Acompanhamento de investimentos
- [x] Sistema de recorrências avançado
- [x] Cartões de crédito com parcelamento
- [x] Status de pagamento (pago/a pagar)
- [x] Análise financeira com IA
- [x] Projeções futuras (6 meses)
- [x] Dashboard com gráficos interativos
- [x] Tema dark/light profissional
- [x] KPIs configuráveis
- [x] Interface responsiva
- [x] Logo EAS integrado
- [x] Rodapé com copyright e versão

## 📝 Licença e Propriedade Intelectual

**© 2025 Édipo de Almeida Santos. Todos os direitos reservados.**

Este software é propriedade intelectual de **Édipo de Almeida Santos** e está protegido por leis de direitos autorais. O uso, cópia, modificação ou distribuição não autorizada deste software é estritamente proibido.

### Licença Proprietária

Este é um software proprietário. Nenhuma parte deste código pode ser:
- Copiada, modificada ou distribuída sem autorização expressa
- Usada para fins comerciais sem licença apropriada
- Redistribuída em qualquer forma sem permissão escrita

Para questões de licenciamento, entre em contato com o autor.

## 👨‍💻 Autor

**Édipo de Almeida Santos**

Sistema desenvolvido com dedicação e expertise em tecnologias modernas para proporcionar a melhor experiência em gestão financeira pessoal.

## 📧 Contato

Para dúvidas, sugestões ou questões de licenciamento, entre em contato através do repositório.

---

<div align="center">
  
  **EAS Controle Financeiro v1.0.0**
  
  Desenvolvido com 💙 para gestão financeira inteligente
  
  © 2025 Édipo de Almeida Santos - Todos os direitos reservados
  
</div>
