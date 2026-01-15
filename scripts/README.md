# Scripts Úteis

## Desenvolvimento

### Iniciar servidor de desenvolvimento
```bash
npm run dev
```

### Build de produção
```bash
npm run build
```

### Iniciar servidor de produção
```bash
npm start
```

### Verificar tipos TypeScript
```bash
npm run type-check
```

### Lint
```bash
npm run lint
```

## Supabase

### Backup do banco de dados
Execute no SQL Editor do Supabase:

```sql
-- Backup de categorias
COPY (SELECT * FROM expense_categories) TO '/tmp/categories.csv' CSV HEADER;

-- Backup de despesas
COPY (SELECT * FROM expenses) TO '/tmp/expenses.csv' CSV HEADER;

-- Backup de investimentos
COPY (SELECT * FROM investments) TO '/tmp/investments.csv' CSV HEADER;
```

### Reset do banco (CUIDADO!)
```sql
-- Remove todos os dados (mantém estrutura)
TRUNCATE TABLE investment_transactions CASCADE;
TRUNCATE TABLE investments CASCADE;
TRUNCATE TABLE expenses CASCADE;
TRUNCATE TABLE expense_categories CASCADE;
TRUNCATE TABLE investment_types CASCADE;
TRUNCATE TABLE profiles CASCADE;
```

## Comandos Windows

### Instalar dependências
```cmd
npm install
```

### Limpar cache
```cmd
rmdir /s /q .next
rmdir /s /q node_modules
npm install
```

### Verificar porta em uso
```cmd
netstat -ano | findstr :3000
```

### Matar processo na porta 3000
```cmd
taskkill /PID <PID> /F
```

## Git

### Commit inicial
```bash
git init
git add .
git commit -m "Initial commit: Controle Financeiro"
git branch -M main
git remote add origin <seu-repositorio>
git push -u origin main
```

### Criar branch de feature
```bash
git checkout -b feature/nome-da-feature
git add .
git commit -m "feat: descrição da feature"
git push origin feature/nome-da-feature
```

## Vercel

### Deploy manual
```bash
npm install -g vercel
vercel login
vercel
```

### Deploy de produção
```bash
vercel --prod
```

## Testes (quando implementados)

### Rodar todos os testes
```bash
npm test
```

### Testes em modo watch
```bash
npm test -- --watch
```

### Coverage
```bash
npm test -- --coverage
```
