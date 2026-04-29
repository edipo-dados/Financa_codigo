# 💰 EAS Controle Financeiro v2.0

Sistema inteligente de gestão financeira pessoal e familiar com assistente de IA integrado. Desenvolvido com Next.js 16, React 19, Supabase e Google Gemini AI.

## 🤖 Novidades da v2.0

- **Assistente IA** — registre transações por texto ou foto, busque compras por nome/categoria
- **Saldo inteligente** — acumulado do ano descontando investimentos, consistente com soma mensal
- **Busca de transações** — pergunte à IA sobre compras, gastos por categoria ou loja
- **Resgates de investimentos** — controle de aportes, resgates e rendimento líquido
- **API de membros** — novo endpoint para integração externa
- **API de resumo corrigida** — exclui duplicações de cartão e marcadores

## ✨ Funcionalidades

### 🤖 Assistente IA (EAS Finance AI)
- Registrar despesas, receitas e investimentos por linguagem natural
- Analisar comprovantes e notas fiscais por foto
- Buscar compras por nome, loja ou categoria
- Lançamento em lote a partir de imagens de fatura
- Classificação automática de categorias
- Exclusão de transações por comando

### 📊 Dashboard
- Saldo acumulado do ano (Jan até mês selecionado, descontando investimentos)
- Saldo mensal (receitas - despesas)
- Filtro global de mês para todas as abas
- Filtro por membro da família
- Card discreto de investimentos (líquido, atual, rendimento, resgates)

### 💸 Despesas
- Despesas comuns e recorrentes
- Múltiplas formas de pagamento (PIX, cartão, débito, dinheiro, transferência)
- Seleção múltipla para pagamento em lote
- Filtros por membro, categoria, status e busca textual
- Ocorrências virtuais de recorrência com exclusão individual

### 💰 Receitas
- Receitas comuns e recorrentes
- Categorização personalizada
- Controle de recebimentos (pago/a receber)
- Edição e exclusão de ocorrências virtuais

### 📈 Investimentos
- Controle de aportes e valor atual
- Resgates com histórico de transações
- Tipos personalizáveis
- Rendimento calculado automaticamente
- Descontado do saldo no dashboard (líquido = investido - resgatado)

### 💳 Cartões de Crédito
- Múltiplos cartões com cores e limites
- Compras parceladas com cálculo automático de datas
- Faturas agrupadas por cartão e mês
- Pagamento de fatura inteira com um clique

### 👥 Gestão Familiar
- Membros da família com cores e relacionamento
- Filtro por membro em todas as telas
- Relatórios individuais

### 🔌 APIs REST
- Despesas, receitas, investimentos (CRUD completo)
- Resumo financeiro com filtros inteligentes
- Membros da família
- Cartões de crédito com faturas
- Compras parceladas
- Categorias (despesa e receita)

## 🚀 Início Rápido

```bash
git clone https://github.com/edipo-dados/Financa_codigo.git
cd Financa_codigo
npm install
cp .env.example .env.local
# Edite .env.local com suas credenciais
npm run dev
```

### Variáveis de Ambiente

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
GEMINI_API_KEY=sua_chave_gemini
```

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS |
| Backend | Supabase (PostgreSQL), API Routes |
| IA | Google Gemini 2.5 Flash |
| Deploy | Vercel |
| PDF | jsPDF + html2canvas |

## 📱 Navegação

### Mobile (5 abas)
📊 Dashboard · 💸 Despesas · 💰 Receitas · 💳 Cartões · ⚙️ Config

### Desktop (8 abas)
📊 Dashboard · 💰 Receitas · 💸 Despesas · 📈 Investimentos · 🔮 Futuros · 💳 Cartões · ⚙️ Config · 📱 Sobre

## 📚 Documentação

- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) — APIs REST completas
- [ARCHITECTURE.md](ARCHITECTURE.md) — Arquitetura do sistema
- [AUTENTICACAO_API.md](AUTENTICACAO_API.md) — Guia de autenticação
- [MANUAL_DO_USUARIO.md](MANUAL_DO_USUARIO.md) — Manual do usuário

## 👤 Autor

**Édipo de Almeida Santos** — [@edipo-dados](https://github.com/edipo-dados)

## 📄 Licença

Proprietário — ver [LICENSE](LICENSE)
