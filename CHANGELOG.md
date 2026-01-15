# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [1.3.0] - 2024-01-18

### Adicionado

#### Sistema de Recorrências Avançado
- Controle de término de recorrências (sem fim, após X vezes, até data)
- Campo `recurrence_end_type` nas tabelas
- Campo `recurrence_count` para número de ocorrências
- Campo `recurrence_end_date` para data final
- Validação de configuração de recorrências

#### Lógica Especial para Recorrências Mensais
- Mantém o mesmo dia do mês sempre que possível
- Ajusta para último dia do mês quando necessário
- Exemplo: dia 31 em fevereiro vira dia 29/28
- Sempre prospectivo (apenas datas futuras)
- Determinístico e previsível

#### Prévia de Ocorrências
- Visualização das próximas 12 ocorrências
- Atualização em tempo real
- Botão mostrar/ocultar
- Contador de ocorrências
- Descrição legível da recorrência

#### Funções Utilitárias
- `generateRecurrenceOccurrences()` - Gera lista de ocorrências
- `getNextMonthlyDate()` - Calcula próxima data mensal
- `validateRecurrenceConfig()` - Valida configuração
- `getRecurrenceDescription()` - Descrição legível
- `calculateRecurrenceTotal()` - Total projetado

### Modificado

#### Formulários
- ExpenseForm atualizado com novas opções
- IncomeForm atualizado com novas opções
- Validação em tempo real
- Feedback visual melhorado

#### Banco de Dados
- Migration 001 atualizada (expenses)
- Migration 003 atualizada (incomes)
- Novos campos para controle de recorrências

#### Tipos TypeScript
- Adicionado `RecurrenceEndType`
- Atualizados interfaces `Expense` e `Income`
- Novos tipos em `src/lib/recurrence.ts`

### Documentação
- RECURRENCE_FEATURE.md - Documentação completa
- Exemplos de uso
- Casos de teste
- Validações

## [1.2.0] - 2024-01-17

### Adicionado

#### Módulo de Receitas (Entradas)
- Sistema completo de receitas/entradas financeiras
- Cadastro de receitas avulsas e recorrentes
- Categorização de receitas personalizável
- Campo de fonte/origem da receita
- Suporte a receitas recorrentes (diária, semanal, mensal, anual)
- Gerenciador de categorias de receitas
- 6 categorias padrão criadas automaticamente

#### Banco de Dados
- Tabela `income_categories` para categorias de receitas
- Tabela `incomes` para receitas
- Índices otimizados
- Row Level Security (RLS) habilitado
- Políticas de acesso por usuário
- Função para criar categorias padrão

#### Componentes
- `IncomesList` - Lista de receitas
- `IncomeForm` - Formulário de receitas
- `IncomeCategoryManager` - Gerenciador de categorias
- Hook `useIncomes` - CRUD de receitas

#### Dashboard
- Nova aba "💰 Receitas"
- Card "Receitas do Mês"
- Card "Saldo do Mês" (Receitas - Despesas)
- Gráfico de pizza: Receitas por Categoria
- Layout lado a lado: Receitas vs Despesas

#### Cálculos
- Saldo mensal (receitas - despesas)
- Total de receitas
- Patrimônio líquido atualizado (receitas - despesas + investimentos)
- Distribuição de receitas por categoria

### Modificado

#### Dashboard
- Reorganização dos cards de estatísticas
- 4 cards principais: Receitas, Despesas, Saldo, Investimentos
- Gráficos lado a lado para melhor comparação
- Cálculo de patrimônio líquido atualizado

#### Tipos TypeScript
- Adicionadas interfaces `Income` e `IncomeCategory`
- Atualizado `DashboardStats` com campos de receitas
- Tipos do banco de dados atualizados

#### Navegação
- 5 abas: Visão Geral, Receitas, Despesas, Investimentos, Configurações
- Ícone 💰 para receitas

### Documentação
- INCOMES_FEATURE.md - Documentação completa da funcionalidade

## [1.1.0] - 2024-01-16

### Adicionado

#### Design Premium Estilo Apple
- Sistema de cores Apple completo (azul, verde, vermelho, laranja, roxo)
- Escala de cinzas profissional (50-700)
- Glassmorphism em todos os cards principais
- Animações suaves (fade-in, slide-up, scale-in)
- Hover effects com scale e shadow
- Loading states com spinners animados
- Transições de 200-300ms em todos elementos interativos

#### Componentes Visuais
- Botões primários e secundários estilizados
- Inputs com focus states elegantes
- Cards com efeito de vidro e blur
- Badges coloridos para categorias
- Ícones com gradientes
- Tabs em formato pills
- Empty states ilustrados
- Stat cards com ícones e tendências

#### Melhorias de UX
- Feedback visual consistente
- Estados de hover em todos elementos clicáveis
- Animações de entrada para novos elementos
- Loading states informativos
- Cores semânticas (verde=positivo, vermelho=negativo)
- Hierarquia visual clara
- Espaçamento generoso

#### Documentação
- DESIGN_UPDATES.md - Detalhes das melhorias
- COMPONENT_GUIDE.md - Guia de componentes
- VISUAL_SHOWCASE.md - Showcase visual

### Modificado

#### Interface Geral
- Background com gradiente sutil
- Navegação com glass effect
- Logo com gradiente azul-roxo
- Avatar do usuário estilizado
- Tabs com ícones emoji

#### Dashboard
- Cards de estatísticas redesenhados
- Gráficos com cores vibrantes
- Tooltip customizado
- Legendas com badges
- Grid responsivo melhorado

#### Formulários
- Inputs com estados de focus
- Labels descritivos
- Validação visual
- Botões com loading states
- Layout em grid responsivo

#### Listas
- Tabelas com glassmorphism
- Hover states nas linhas
- Badges para categorias
- Cards de investimento redesenhados
- Indicadores visuais de retorno

### Técnico

#### Tailwind Config
- Cores Apple adicionadas
- Sombras customizadas (apple, apple-lg, apple-xl)
- Animações customizadas
- Fonte do sistema Apple
- Backdrop blur configurado

#### CSS Global
- Classes utilitárias customizadas
- Componentes reutilizáveis
- Animações keyframes
- Antialiasing ativado
- Scrollbar customizado

## [1.0.0] - 2024-01-15

### Adicionado

#### Autenticação
- Sistema completo de autenticação com Supabase Auth
- Cadastro de novos usuários
- Login e logout
- Proteção de rotas
- Criação automática de perfil no signup
- Criação automática de categorias e tipos padrão

#### Despesas
- Cadastro de despesas avulsas
- Suporte a despesas recorrentes (diária, semanal, mensal, anual)
- Categorização de despesas
- Campo de forma de pagamento
- Listagem de despesas ordenada por data
- Exclusão de despesas
- Gerenciador de categorias personalizadas
- Seleção de cores para categorias

#### Investimentos
- Cadastro de investimentos
- Tipos de investimento personalizáveis
- Campo de instituição/corretora
- Rastreamento de valor inicial e atual
- Cálculo automático de rentabilidade
- Campo de rentabilidade esperada
- Listagem de investimentos com cards
- Exclusão de investimentos
- Gerenciador de tipos de investimento
- Suporte a transações (aportes, resgates, rendimentos)
- Atualização automática do saldo ao adicionar transação

#### Dashboard
- Visão geral com estatísticas principais
- Card de despesas do mês atual
- Card de total investido
- Card de retorno dos investimentos
- Card de patrimônio líquido
- Gráfico de pizza de despesas por categoria
- Interface com abas (Visão Geral, Despesas, Investimentos, Configurações)
- Navegação entre seções

#### Segurança
- Row Level Security (RLS) em todas as tabelas
- Políticas de acesso por usuário
- Isolamento completo de dados entre usuários
- Validação de permissões no banco de dados

#### Infraestrutura
- Configuração do Next.js 14 com App Router
- Integração com Supabase
- Configuração do TypeScript
- Configuração do Tailwind CSS
- Migrations do banco de dados
- Seeds de dados iniciais
- Configuração para deploy na Vercel

#### Documentação
- README.md com visão geral
- QUICKSTART.md com guia rápido de início
- SETUP.md com guia completo de configuração
- ARCHITECTURE.md com detalhes da arquitetura
- API_EXAMPLES.md com exemplos de uso
- PROJECT_SUMMARY.md com resumo do projeto
- CONTRIBUTING.md com guia de contribuição
- Scripts úteis para desenvolvimento

#### Componentes
- AuthForm - Formulário de login/cadastro
- Navigation - Barra de navegação
- DashboardStats - Estatísticas e gráficos
- ExpensesList - Lista de despesas
- ExpenseForm - Formulário de despesas
- InvestmentsList - Lista de investimentos
- InvestmentForm - Formulário de investimentos
- CategoryManager - Gerenciador de categorias
- InvestmentTypeManager - Gerenciador de tipos

#### Hooks Customizados
- useAuth - Gerenciamento de autenticação
- useExpenses - CRUD de despesas
- useInvestments - CRUD de investimentos

#### Utilitários
- formatCurrency - Formatação de valores monetários
- formatDate - Formatação de datas
- formatMonth - Formatação de mês/ano
- getCurrentMonthRange - Range do mês atual
- getLastMonthsRange - Range de múltiplos meses
- calculatePercentageChange - Cálculo de variação percentual

### Tecnologias

- Next.js 14.1.0
- React 18.2.0
- TypeScript 5.3.0
- Tailwind CSS 3.4.0
- Supabase 2.39.0
- Recharts 2.10.3
- date-fns 3.0.0
- zod 3.22.4

## [Unreleased]

### Planejado

#### Funcionalidades
- Geração automática de despesas recorrentes via cron job
- Filtros avançados de despesas e investimentos
- Busca por descrição
- Gráficos de evolução temporal
- Comparativo mês a mês
- Exportação de relatórios (PDF/Excel)
- Metas financeiras
- Notificações
- Modo escuro
- PWA (Progressive Web App)
- Internacionalização (i18n)

#### Melhorias Técnicas
- Testes unitários com Jest
- Testes E2E com Playwright
- React Query para cache
- Optimistic updates
- Realtime subscriptions
- Melhorias de acessibilidade (a11y)
- Performance optimizations

#### UX/UI
- Animações e transições
- Feedback visual melhorado
- Loading states
- Error boundaries
- Toast notifications
- Confirmações de ações

---

## Formato

### Tipos de Mudanças
- **Adicionado** - para novas funcionalidades
- **Modificado** - para mudanças em funcionalidades existentes
- **Descontinuado** - para funcionalidades que serão removidas
- **Removido** - para funcionalidades removidas
- **Corrigido** - para correções de bugs
- **Segurança** - para vulnerabilidades corrigidas

### Versionamento
- **MAJOR** (X.0.0) - Mudanças incompatíveis na API
- **MINOR** (0.X.0) - Novas funcionalidades compatíveis
- **PATCH** (0.0.X) - Correções de bugs compatíveis
