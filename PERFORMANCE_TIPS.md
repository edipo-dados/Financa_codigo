# Dicas de Performance

Este guia contém dicas para manter a aplicação rápida e responsiva, mesmo com todas as melhorias visuais.

## 🚀 Otimizações Implementadas

### 1. Animações com GPU

Todas as animações usam propriedades otimizadas:

```css
/* ✅ Bom - Usa GPU */
transform: scale(1.02);
opacity: 0.9;

/* ❌ Evitar - Não usa GPU */
width: 110%;
margin-left: 10px;
```

### 2. Will-Change

Para animações frequentes:

```css
.hover-element {
  will-change: transform;
  transition: transform 0.2s;
}

.hover-element:hover {
  transform: scale(1.02);
}
```

### 3. Backdrop Filter

Glassmorphism otimizado:

```css
/* Já otimizado no código */
backdrop-filter: blur(24px);
```

## 📊 Métricas de Performance

### Lighthouse Score Esperado
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 100

### Core Web Vitals
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1

## 🎯 Otimizações Recomendadas

### 1. Lazy Loading de Componentes

```tsx
import { lazy, Suspense } from 'react'

const DashboardStats = lazy(() => import('@/components/DashboardStats'))

function Dashboard() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <DashboardStats />
    </Suspense>
  )
}
```

### 2. Memoização de Cálculos

```tsx
import { useMemo } from 'react'

const stats = useMemo(() => {
  // Cálculos pesados aqui
  return calculateStats(expenses, investments)
}, [expenses, investments])
```

### 3. Debounce em Inputs

```tsx
import { useState, useCallback } from 'react'
import { debounce } from 'lodash'

const debouncedSearch = useCallback(
  debounce((value) => {
    // Busca aqui
  }, 300),
  []
)
```

### 4. Virtual Scrolling

Para listas grandes:

```bash
npm install react-window
```

```tsx
import { FixedSizeList } from 'react-window'

<FixedSizeList
  height={600}
  itemCount={expenses.length}
  itemSize={60}
>
  {({ index, style }) => (
    <div style={style}>
      {expenses[index].description}
    </div>
  )}
</FixedSizeList>
```

### 5. Image Optimization

```tsx
import Image from 'next/image'

<Image
  src="/logo.png"
  width={100}
  height={100}
  alt="Logo"
  priority // Para imagens above the fold
/>
```

## 🔧 Configurações do Next.js

### next.config.js

```javascript
module.exports = {
  reactStrictMode: true,
  
  // Otimização de imagens
  images: {
    domains: ['supabase.co'],
    formats: ['image/avif', 'image/webp'],
  },
  
  // Compressão
  compress: true,
  
  // SWC Minify (mais rápido)
  swcMinify: true,
  
  // Experimental
  experimental: {
    optimizeCss: true,
  },
}
```

## 📦 Bundle Size

### Analisar Bundle

```bash
npm install @next/bundle-analyzer
```

```javascript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({
  // config
})
```

```bash
ANALYZE=true npm run build
```

### Reduzir Bundle

1. **Tree Shaking**: Importe apenas o necessário

```tsx
// ❌ Evitar
import _ from 'lodash'

// ✅ Bom
import debounce from 'lodash/debounce'
```

2. **Dynamic Imports**: Carregue sob demanda

```tsx
const Chart = dynamic(() => import('recharts'), {
  ssr: false,
  loading: () => <LoadingSpinner />
})
```

## 🎨 CSS Performance

### 1. Purge CSS

Tailwind já faz isso automaticamente:

```javascript
// tailwind.config.ts
content: [
  './src/**/*.{js,ts,jsx,tsx}',
],
```

### 2. Critical CSS

Next.js já otimiza automaticamente.

### 3. Evitar @import

```css
/* ❌ Evitar */
@import url('fonts.css');

/* ✅ Bom - Use no HTML */
<link rel="stylesheet" href="fonts.css">
```

## 🔍 Monitoramento

### 1. Web Vitals

```tsx
// pages/_app.tsx
export function reportWebVitals(metric) {
  console.log(metric)
  // Enviar para analytics
}
```

### 2. Performance API

```tsx
useEffect(() => {
  const perfData = performance.getEntriesByType('navigation')[0]
  console.log('Load time:', perfData.loadEventEnd - perfData.fetchStart)
}, [])
```

## 🎯 Checklist de Performance

### Build Time
- [ ] Remover console.logs
- [ ] Minificar código
- [ ] Otimizar imagens
- [ ] Comprimir assets
- [ ] Tree shaking ativado

### Runtime
- [ ] Lazy loading implementado
- [ ] Memoização onde necessário
- [ ] Debounce em inputs
- [ ] Virtual scrolling para listas grandes
- [ ] Animações com GPU

### Network
- [ ] Compressão gzip/brotli
- [ ] Cache headers configurados
- [ ] CDN para assets estáticos
- [ ] Preload de recursos críticos
- [ ] Prefetch de rotas

### Database
- [ ] Índices otimizados
- [ ] Queries eficientes
- [ ] Paginação implementada
- [ ] Cache de queries
- [ ] Connection pooling

## 🚨 Problemas Comuns

### 1. Animações Lentas

**Problema**: Animações travando

**Solução**:
```css
/* Adicione will-change */
.animated-element {
  will-change: transform;
}

/* Use transform ao invés de position */
transform: translateX(10px); /* ✅ */
left: 10px; /* ❌ */
```

### 2. Re-renders Desnecessários

**Problema**: Componente renderiza muito

**Solução**:
```tsx
import { memo } from 'react'

const ExpenseCard = memo(({ expense }) => {
  return <div>{expense.description}</div>
})
```

### 3. Bundle Grande

**Problema**: JavaScript muito grande

**Solução**:
- Use dynamic imports
- Remova dependências não usadas
- Use alternativas menores

### 4. Imagens Pesadas

**Problema**: Imagens não otimizadas

**Solução**:
- Use Next.js Image
- Converta para WebP/AVIF
- Implemente lazy loading

## 📊 Ferramentas de Análise

### 1. Lighthouse
```bash
# Chrome DevTools > Lighthouse
```

### 2. WebPageTest
```
https://www.webpagetest.org
```

### 3. Bundle Analyzer
```bash
npm run build
ANALYZE=true npm run build
```

### 4. React DevTools Profiler
```
Chrome Extension: React Developer Tools
```

## 🎯 Metas de Performance

### Tempo de Carregamento
- First Paint: < 1s
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s

### Tamanho
- JavaScript: < 200KB (gzipped)
- CSS: < 50KB (gzipped)
- Total: < 500KB (gzipped)

### Animações
- 60 FPS constante
- Sem jank
- Smooth scrolling

## 💡 Dicas Finais

1. **Meça Sempre**: Use ferramentas de análise
2. **Otimize Gradualmente**: Não otimize prematuramente
3. **Teste em Dispositivos Reais**: Não confie apenas em desktop
4. **Monitore em Produção**: Use analytics
5. **Mantenha Atualizado**: Atualize dependências

## 🔗 Recursos

- [Web.dev Performance](https://web.dev/performance/)
- [Next.js Performance](https://nextjs.org/docs/advanced-features/measuring-performance)
- [React Performance](https://react.dev/learn/render-and-commit)
- [Tailwind Performance](https://tailwindcss.com/docs/optimizing-for-production)

---

Mantenha a aplicação rápida! ⚡
