# Guia de Customização

Este guia mostra como personalizar o design da aplicação para atender suas necessidades.

## 🎨 Alterando Cores

### Paleta Principal

Edite `tailwind.config.ts`:

```typescript
colors: {
  apple: {
    blue: '#007aff',    // Sua cor primária
    green: '#34c759',   // Sucesso
    red: '#ff3b30',     // Erro
    orange: '#ff9500',  // Aviso
    purple: '#af52de',  // Secundária
  },
}
```

### Cores de Categorias

Edite `src/components/CategoryManager.tsx`:

```typescript
const colorOptions = [
  { name: 'Azul', value: '#007aff' },
  { name: 'Verde', value: '#34c759' },
  // Adicione suas cores aqui
  { name: 'Sua Cor', value: '#123456' },
]
```

### Gradientes

Edite `src/app/globals.css`:

```css
body {
  @apply bg-gradient-to-br from-sua-cor-50 via-white to-sua-cor-100;
}
```

## 🔤 Alterando Tipografia

### Fonte Principal

Edite `tailwind.config.ts`:

```typescript
fontFamily: {
  sans: ['Sua Fonte', '-apple-system', 'sans-serif'],
}
```

### Tamanhos de Fonte

Edite componentes individuais:

```tsx
// Título grande
<h1 className="text-4xl font-bold">

// Título médio
<h2 className="text-2xl font-semibold">

// Texto normal
<p className="text-base">
```

## 🎭 Alterando Sombras

### Sombras Customizadas

Edite `tailwind.config.ts`:

```typescript
boxShadow: {
  'custom': '0 4px 6px rgba(0, 0, 0, 0.1)',
  'custom-lg': '0 10px 15px rgba(0, 0, 0, 0.1)',
}
```

Use em componentes:

```tsx
<div className="shadow-custom hover:shadow-custom-lg">
```

## 🔘 Customizando Botões

### Criar Novo Estilo de Botão

Edite `src/app/globals.css`:

```css
@layer components {
  .btn-custom {
    @apply px-6 py-3 bg-sua-cor text-white rounded-xl font-medium 
           shadow-apple transition-all duration-200 
           hover:bg-opacity-90 hover:shadow-apple-lg hover:scale-[1.02]
           active:scale-[0.98];
  }
}
```

Use no componente:

```tsx
<button className="btn-custom">
  Seu Botão
</button>
```

## 🃏 Customizando Cards

### Alterar Transparência do Glass

Edite `src/app/globals.css`:

```css
.glass-card {
  @apply bg-white/80 backdrop-blur-2xl; /* Mais opaco */
}
```

### Alterar Arredondamento

```tsx
// Menos arredondado
<div className="glass-card rounded-xl">

// Mais arredondado
<div className="glass-card rounded-3xl">
```

## ✨ Customizando Animações

### Criar Nova Animação

Edite `tailwind.config.ts`:

```typescript
animation: {
  'custom': 'customAnim 0.5s ease-out',
},
keyframes: {
  customAnim: {
    '0%': { /* estado inicial */ },
    '100%': { /* estado final */ },
  },
}
```

### Ajustar Velocidade

```tsx
// Mais rápido
<div className="transition-all duration-100">

// Mais lento
<div className="transition-all duration-500">
```

## 📐 Customizando Espaçamentos

### Padding de Cards

```tsx
// Menor
<div className="glass-card p-4">

// Maior
<div className="glass-card p-12">
```

### Gaps em Grids

```tsx
// Menor
<div className="grid gap-2">

// Maior
<div className="grid gap-8">
```

## 🎨 Temas Personalizados

### Criar Tema Escuro

1. Adicione cores escuras em `tailwind.config.ts`:

```typescript
colors: {
  dark: {
    bg: '#1c1c1e',
    card: '#2c2c2e',
    text: '#ffffff',
  },
}
```

2. Crie classes condicionais:

```tsx
<div className={`${isDark ? 'bg-dark-bg' : 'bg-white'}`}>
```

### Criar Tema Colorido

1. Defina paleta vibrante:

```typescript
colors: {
  vibrant: {
    primary: '#ff006e',
    secondary: '#8338ec',
    accent: '#ffbe0b',
  },
}
```

2. Substitua cores nos componentes:

```tsx
<button className="bg-vibrant-primary">
```

## 🖼️ Customizando Ícones

### Usar Biblioteca de Ícones

Instale uma biblioteca:

```bash
npm install lucide-react
```

Use nos componentes:

```tsx
import { DollarSign } from 'lucide-react'

<DollarSign className="w-5 h-5" />
```

### Criar Ícones SVG Customizados

```tsx
<svg className="w-5 h-5" viewBox="0 0 24 24">
  <path d="..." />
</svg>
```

## 📊 Customizando Gráficos

### Cores do Gráfico

Edite `src/components/DashboardStats.tsx`:

```typescript
const COLORS = [
  '#sua-cor-1',
  '#sua-cor-2',
  '#sua-cor-3',
]
```

### Estilo do Tooltip

```tsx
<Tooltip 
  contentStyle={{
    backgroundColor: 'sua-cor',
    borderRadius: '16px',
  }}
/>
```

## 🎯 Customizações Avançadas

### Glassmorphism Personalizado

```css
.glass-custom {
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.3);
}
```

### Gradientes Complexos

```tsx
<div className="bg-gradient-to-br from-cor1 via-cor2 to-cor3">
```

### Animações Complexas

```typescript
keyframes: {
  float: {
    '0%, 100%': { transform: 'translateY(0)' },
    '50%': { transform: 'translateY(-10px)' },
  },
}
```

## 🔧 Ferramentas Úteis

### Geradores de Cores
- [Coolors.co](https://coolors.co) - Paletas de cores
- [Color Hunt](https://colorhunt.co) - Inspiração de cores
- [Adobe Color](https://color.adobe.com) - Harmonias de cores

### Geradores de Gradientes
- [CSS Gradient](https://cssgradient.io)
- [Gradient Hunt](https://gradienthunt.com)

### Geradores de Sombras
- [Shadow Generator](https://shadows.brumm.af)
- [Smooth Shadow](https://shadows.brumm.af)

### Ícones
- [Lucide Icons](https://lucide.dev)
- [Heroicons](https://heroicons.com)
- [Phosphor Icons](https://phosphoricons.com)

### Fontes
- [Google Fonts](https://fonts.google.com)
- [Font Squirrel](https://www.fontsquirrel.com)

## 📝 Exemplos de Customização

### Tema Minimalista Preto e Branco

```typescript
// tailwind.config.ts
colors: {
  minimal: {
    black: '#000000',
    white: '#ffffff',
    gray: '#808080',
  },
}
```

```css
/* globals.css */
body {
  @apply bg-white text-minimal-black;
}

.glass-card {
  @apply bg-minimal-white border border-minimal-gray/20;
}
```

### Tema Vibrante e Colorido

```typescript
colors: {
  vibrant: {
    pink: '#ff006e',
    purple: '#8338ec',
    blue: '#3a86ff',
    yellow: '#ffbe0b',
  },
}
```

### Tema Corporativo

```typescript
colors: {
  corporate: {
    navy: '#003366',
    gold: '#d4af37',
    gray: '#4a5568',
  },
}
```

## 🎨 Dicas de Design

1. **Consistência**: Mantenha o mesmo estilo em toda aplicação
2. **Contraste**: Garanta legibilidade com contraste adequado
3. **Hierarquia**: Use tamanhos e pesos para criar hierarquia
4. **Espaçamento**: Não tenha medo de espaço em branco
5. **Cores**: Use no máximo 3-4 cores principais
6. **Animações**: Mantenha sutis e rápidas
7. **Acessibilidade**: Teste com diferentes usuários

## 🚀 Próximos Passos

Após customizar:

1. Teste em diferentes dispositivos
2. Verifique contraste de cores
3. Teste animações em dispositivos lentos
4. Peça feedback de usuários
5. Documente suas customizações

## 📚 Recursos Adicionais

- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/)
- [Material Design](https://material.io/design)
- [Refactoring UI](https://www.refactoringui.com)

---

Divirta-se customizando! 🎨
