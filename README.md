# 💰 EAS Controle Financeiro

Sistema completo de gestão financeira pessoal desenvolvido com Next.js 15, React 19 e Supabase.

## ✨ Funcionalidades

### 💸 Gestão Financeira
- Despesas (comuns e recorrentes)
- Receitas (comuns e recorrentes)
- Investimentos (únicos e recorrentes)
- Cartões de crédito com parcelas automáticas
- Categorização personalizada
- Membros da família

### 📊 Visualizações
- Dashboard configurável com drag & drop
- Gráficos interativos (Recharts)
- Resumo financeiro mensal
- Projeções futuras
- Relatórios em PDF

### 🎨 Interface
- Design moderno e responsivo
- Modo escuro
- Navegação simplificada no mobile (4 telas)
- Navegação completa no desktop (8 telas)

### 🔐 Segurança
- Autenticação via Supabase
- Row Level Security (RLS)
- Modo demo disponível

## 🚀 Início Rápido

### Pré-requisitos
- Node.js 18+
- Conta no Supabase
- Conta no Vercel (para deploy)

### Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/financa-codigo.git
cd financa-codigo

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais do Supabase

# Execute as migrações do banco
# Acesse o Supabase Dashboard > SQL Editor
# Execute os arquivos em supabase/migrations/ em ordem

# Inicie o servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## 📚 Documentação

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Arquitetura do sistema
- **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - Documentação das APIs REST
- **[AUTENTICACAO_API.md](AUTENTICACAO_API.md)** - Guia de autenticação
- **[MANUAL_DO_USUARIO.md](MANUAL_DO_USUARIO.md)** - Manual do usuário
- **[SETUP.md](SETUP.md)** - Guia de configuração detalhado
- **[QUICKSTART.md](QUICKSTART.md)** - Início rápido
- **[FUNCIONALIDADES_COMPLETAS.md](FUNCIONALIDADES_COMPLETAS.md)** - Lista completa de funcionalidades

## 🛠️ Stack Tecnológica

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL)
- **Gráficos:** Recharts
- **PDF:** jsPDF
- **Deploy:** Vercel

## 📱 Navegação

### Mobile (4 telas)
- 📊 Dashboard
- 💸 Despesas
- 💰 Receitas
- 💳 Cartões

### Desktop (8 telas)
- 📊 Dashboard
- 💰 Receitas
- 💸 Despesas
- 📈 Investimentos
- 🔮 Futuros
- 💳 Cartões
- ⚙️ Configurações
- 📱 Sobre

## 🔧 Configuração

### Variáveis de Ambiente

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
```

### Supabase

1. Crie um projeto no [Supabase](https://supabase.com)
2. Execute as migrações em `supabase/migrations/`
3. Configure as variáveis de ambiente
4. Habilite Row Level Security (RLS)

### Vercel

1. Conecte seu repositório GitHub
2. Configure as variáveis de ambiente
3. Deploy automático a cada push na `main`

## 🎯 Uso

### Modo Demo
Acesse sem autenticação para testar o sistema.

### Modo Autenticado
1. Crie uma conta
2. Configure categorias e cartões
3. Adicione membros da família (opcional)
4. Comece a registrar suas finanças

## 📊 APIs REST

O sistema oferece APIs REST completas para integração:

```bash
# Listar despesas
GET /api/expenses?user_id=UUID&start_date=2026-01-01

# Criar despesa
POST /api/expenses
{
  "user_id": "UUID",
  "amount": 150.50,
  "description": "Supermercado",
  "expense_date": "2026-03-13",
  "category_id": "UUID"
}

# Listar cartões com faturas
GET /api/credit-cards?user_id=UUID&month=2026-03

# Criar compra parcelada
POST /api/credit-card-purchases
{
  "user_id": "UUID",
  "credit_card_id": "UUID",
  "description": "Notebook",
  "total_amount": 5000.00,
  "installments": 12,
  "purchase_date": "2026-03-13"
}
```

Ver [API_DOCUMENTATION.md](API_DOCUMENTATION.md) para detalhes completos.

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Ver arquivo [LICENSE](LICENSE) para detalhes.

## 👤 Autor

**Édipo de Almeida Santos**

- GitHub: [@edipo-dados](https://github.com/edipo-dados)
- Email: contato@eastech.com.br

## 🙏 Agradecimentos

- Next.js Team
- Supabase Team
- Vercel Team
- Comunidade Open Source

---

Desenvolvido com 💙 para gestão financeira inteligente
