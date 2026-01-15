# 🪟 Guia de Configuração - Windows

## Instruções Específicas para Windows

### 1. Pré-requisitos

**Instalar Node.js:**
1. Baixe em: https://nodejs.org/
2. Escolha a versão LTS (recomendada)
3. Execute o instalador
4. Marque "Add to PATH"
5. Reinicie o terminal

**Verificar instalação:**
```cmd
node --version
npm --version
```

### 2. Criar Projeto (Se Novo)

```cmd
# Criar pasta
mkdir controle-financeiro
cd controle-financeiro

# Inicializar Next.js
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir

# Quando perguntar:
# - TypeScript: Yes
# - ESLint: Yes
# - Tailwind CSS: Yes
# - App Router: Yes
# - Import alias: Yes (@/*)
```

### 3. Instalar Dependências

```cmd
npm install @supabase/supabase-js date-fns recharts zod
```

### 4. Configurar Supabase

**Criar conta:**
1. Acesse: https://supabase.com
2. Clique em "Start your project"
3. Faça login com GitHub
4. Crie novo projeto

**Obter credenciais:**
1. Vá em Settings > API
2. Copie:
   - Project URL
   - anon/public key

**Criar arquivo .env.local:**
```cmd
# No terminal (PowerShell)
New-Item .env.local

# Ou crie manualmente no VS Code
```

**Conteúdo do .env.local:**
```
NEXT_PUBLIC_SUPABASE_URL=sua_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui
```

### 5. Executar Migrations

**No Supabase Dashboard:**
1. Vá em SQL Editor
2. Clique em "New Query"
3. Copie conteúdo de `supabase/migrations/001_initial_schema.sql`
4. Cole e clique em "Run"
5. Repita com `002_seed_data.sql`
6. Repita com `003_add_incomes.sql`

### 6. Estrutura de Pastas

**Criar pastas necessárias:**
```cmd
# PowerShell
mkdir src\app\dashboard
mkdir src\components
mkdir src\hooks
mkdir src\lib
mkdir src\types
mkdir supabase\migrations
```

**Ou use o Explorer do Windows:**
- Botão direito > Nova Pasta

### 7. Copiar Arquivos

**Método 1: Manualmente**
1. Abra VS Code
2. Crie cada arquivo
3. Copie e cole o conteúdo

**Método 2: Git (se disponível)**
```cmd
# Clone o repositório com os arquivos
git clone <repositorio>
```

### 8. Iniciar Aplicação

```cmd
# Desenvolvimento
npm run dev

# Abrir navegador
start http://localhost:3000
```

### 9. Build de Produção

```cmd
# Build
npm run build

# Testar build
npm start
```

## 🔧 Comandos Windows

### PowerShell

```powershell
# Listar arquivos
Get-ChildItem

# Criar arquivo
New-Item arquivo.txt

# Criar pasta
New-Item -ItemType Directory pasta

# Remover arquivo
Remove-Item arquivo.txt

# Remover pasta
Remove-Item -Recurse pasta

# Ver conteúdo
Get-Content arquivo.txt

# Limpar terminal
Clear-Host
```

### CMD

```cmd
# Listar arquivos
dir

# Criar arquivo
type nul > arquivo.txt

# Criar pasta
mkdir pasta

# Remover arquivo
del arquivo.txt

# Remover pasta
rmdir /s pasta

# Ver conteúdo
type arquivo.txt

# Limpar terminal
cls
```

## 🚨 Problemas Comuns no Windows

### Erro: "npm não é reconhecido"

**Solução:**
1. Reinstale Node.js
2. Marque "Add to PATH"
3. Reinicie o terminal

### Erro: "Permissão negada"

**Solução:**
```powershell
# Execute PowerShell como Administrador
Set-ExecutionPolicy RemoteSigned
```

### Erro: "Porta 3000 em uso"

**Solução:**
```cmd
# Encontrar processo
netstat -ano | findstr :3000

# Matar processo (substitua PID)
taskkill /PID 1234 /F
```

### Erro: "ENOENT: no such file"

**Solução:**
- Verifique se está na pasta correta
- Use caminhos absolutos
- Verifique barras: use `\` no Windows

### Erro: "Module not found"

**Solução:**
```cmd
# Limpar cache
rmdir /s /q node_modules
rmdir /s /q .next
npm install
```

## 📝 Editores Recomendados

### VS Code (Recomendado)

**Download:**
https://code.visualstudio.com/

**Extensões:**
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript Vue Plugin (Volar)

**Abrir projeto:**
```cmd
code .
```

### Outras Opções

- WebStorm (pago)
- Sublime Text
- Notepad++ (básico)

## 🌐 Navegadores

**Recomendados:**
- Chrome (melhor para desenvolvimento)
- Edge (nativo do Windows)
- Firefox

**DevTools:**
- F12 para abrir
- Console para ver erros
- Network para ver requisições

## 📦 Gerenciadores de Pacotes

### npm (padrão)

```cmd
npm install
npm run dev
npm run build
```

### yarn (alternativa)

```cmd
# Instalar yarn
npm install -g yarn

# Usar yarn
yarn install
yarn dev
yarn build
```

### pnpm (mais rápido)

```cmd
# Instalar pnpm
npm install -g pnpm

# Usar pnpm
pnpm install
pnpm dev
pnpm build
```

## 🔐 Variáveis de Ambiente

### Criar .env.local

**Método 1: PowerShell**
```powershell
@"
NEXT_PUBLIC_SUPABASE_URL=sua_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave
"@ | Out-File -FilePath .env.local -Encoding utf8
```

**Método 2: Manualmente**
1. Crie arquivo `.env.local`
2. Adicione as variáveis
3. Salve

**Importante:**
- Não commite .env.local
- Use .env.local.example como template

## 🚀 Deploy

### Vercel (Recomendado)

1. Instale Vercel CLI:
```cmd
npm install -g vercel
```

2. Login:
```cmd
vercel login
```

3. Deploy:
```cmd
vercel
```

4. Produção:
```cmd
vercel --prod
```

### Alternativas

- Netlify
- Railway
- Render
- AWS Amplify

## 📊 Monitoramento

### Logs

**Ver logs do Next.js:**
- Terminal mostra automaticamente
- Erros aparecem em vermelho

**Ver logs do navegador:**
- F12 > Console
- Erros aparecem em vermelho

### Performance

**Lighthouse:**
1. F12 > Lighthouse
2. Clique em "Analyze"
3. Veja relatório

## 🎯 Checklist Windows

- [ ] Node.js instalado
- [ ] npm funcionando
- [ ] VS Code instalado
- [ ] Projeto criado
- [ ] Dependências instaladas
- [ ] Supabase configurado
- [ ] .env.local criado
- [ ] Migrations executadas
- [ ] Arquivos copiados
- [ ] npm run dev funcionando
- [ ] Navegador abrindo
- [ ] Login funcionando

## 💡 Dicas Windows

1. **Use PowerShell** ao invés de CMD
2. **Terminal integrado** do VS Code é melhor
3. **Git Bash** é uma boa alternativa
4. **WSL2** para ambiente Linux no Windows
5. **Windows Terminal** para melhor experiência

## 🆘 Suporte

**Documentação:**
- Node.js: https://nodejs.org/docs
- Next.js: https://nextjs.org/docs
- Supabase: https://supabase.com/docs

**Comunidade:**
- Stack Overflow
- GitHub Issues
- Discord do Next.js
- Discord do Supabase

---

**Sistema**: Windows 10/11  
**Node.js**: 18+  
**npm**: 9+  
**Editor**: VS Code (recomendado)
