# Guia de Contribuição

Obrigado por considerar contribuir com o projeto de Controle Financeiro! Este documento fornece diretrizes para contribuições.

## Como Contribuir

### Reportar Bugs

Se encontrar um bug, abra uma issue com:
- Descrição clara do problema
- Passos para reproduzir
- Comportamento esperado vs atual
- Screenshots (se aplicável)
- Ambiente (navegador, OS, versão do Node)

### Sugerir Funcionalidades

Para sugerir novas funcionalidades:
- Descreva o problema que a funcionalidade resolve
- Explique como você imagina que funcionaria
- Considere alternativas
- Adicione mockups se possível

### Pull Requests

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'feat: Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## Padrões de Código

### Commits

Seguimos o padrão [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: adiciona nova funcionalidade
fix: corrige um bug
docs: atualiza documentação
style: formatação, ponto e vírgula, etc
refactor: refatoração de código
test: adiciona ou corrige testes
chore: atualiza dependências, configs, etc
```

Exemplos:
```
feat: adiciona filtro de despesas por período
fix: corrige cálculo de rentabilidade
docs: atualiza guia de instalação
refactor: melhora performance do dashboard
```

### TypeScript

- Use tipos explícitos sempre que possível
- Evite `any`
- Crie interfaces para objetos complexos
- Use enums para valores fixos

```typescript
// ✅ Bom
interface Expense {
  id: string
  amount: number
  description: string
}

// ❌ Evitar
const expense: any = { ... }
```

### React

- Use functional components
- Prefira hooks customizados para lógica reutilizável
- Mantenha componentes pequenos e focados
- Use `useMemo` e `useCallback` quando apropriado

```typescript
// ✅ Bom
export default function ExpenseCard({ expense }: Props) {
  const formattedAmount = useMemo(
    () => formatCurrency(expense.amount),
    [expense.amount]
  )
  
  return <div>{formattedAmount}</div>
}

// ❌ Evitar
export default function ExpenseCard(props: any) {
  return <div>{formatCurrency(props.expense.amount)}</div>
}
```

### CSS/Tailwind

- Use classes do Tailwind sempre que possível
- Mantenha consistência com o design system
- Evite estilos inline complexos

```tsx
// ✅ Bom
<button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
  Salvar
</button>

// ❌ Evitar
<button style={{ padding: '8px 16px', backgroundColor: '#0284c7' }}>
  Salvar
</button>
```

## Estrutura de Arquivos

Ao adicionar novos arquivos, siga a estrutura:

```
src/
├── app/              # Páginas (Next.js App Router)
├── components/       # Componentes reutilizáveis
├── hooks/           # Custom hooks
├── lib/             # Utilitários e configurações
└── types/           # Definições TypeScript
```

### Nomenclatura

- **Componentes**: PascalCase (`ExpenseCard.tsx`)
- **Hooks**: camelCase com prefixo `use` (`useExpenses.ts`)
- **Utilitários**: camelCase (`formatCurrency.ts`)
- **Tipos**: PascalCase (`Expense`, `Investment`)

## Testes

### Estrutura de Testes (Futuro)

```typescript
describe('ExpenseCard', () => {
  it('should render expense amount correctly', () => {
    // Arrange
    const expense = { amount: 100, description: 'Test' }
    
    // Act
    render(<ExpenseCard expense={expense} />)
    
    // Assert
    expect(screen.getByText('R$ 100,00')).toBeInTheDocument()
  })
})
```

## Database Migrations

Ao adicionar novas tabelas ou colunas:

1. Crie um novo arquivo em `supabase/migrations/`
2. Use numeração sequencial: `003_nome_da_migration.sql`
3. Inclua:
   - Criação de tabelas/colunas
   - Índices necessários
   - Políticas RLS
   - Comentários explicativos

```sql
-- 003_add_tags_to_expenses.sql

-- Adiciona suporte a tags nas despesas
ALTER TABLE expenses ADD COLUMN tags TEXT[];

-- Índice para busca por tags
CREATE INDEX idx_expenses_tags ON expenses USING GIN(tags);

-- Comentário
COMMENT ON COLUMN expenses.tags IS 'Tags para categorização adicional';
```

## Documentação

Ao adicionar funcionalidades:

1. Atualize o README.md se necessário
2. Adicione exemplos em API_EXAMPLES.md
3. Documente decisões técnicas em ARCHITECTURE.md
4. Atualize SETUP.md se houver novos passos de configuração

## Checklist para Pull Requests

Antes de submeter um PR, verifique:

- [ ] Código segue os padrões do projeto
- [ ] Commits seguem Conventional Commits
- [ ] Tipos TypeScript estão corretos
- [ ] Componentes são responsivos
- [ ] Funcionalidade foi testada manualmente
- [ ] Documentação foi atualizada
- [ ] Não há console.logs esquecidos
- [ ] Variáveis de ambiente estão documentadas
- [ ] RLS policies foram adicionadas (se aplicável)

## Áreas que Precisam de Contribuição

### Alta Prioridade
- [ ] Testes unitários e E2E
- [ ] Geração automática de despesas recorrentes
- [ ] Exportação de relatórios (PDF/Excel)
- [ ] Gráficos de evolução temporal

### Média Prioridade
- [ ] Modo escuro
- [ ] Filtros avançados
- [ ] Busca de despesas/investimentos
- [ ] Metas financeiras
- [ ] Notificações

### Baixa Prioridade
- [ ] PWA (Progressive Web App)
- [ ] Internacionalização (i18n)
- [ ] Temas personalizáveis
- [ ] Integração com bancos (Open Banking)

## Perguntas?

Se tiver dúvidas sobre como contribuir:
1. Consulte a documentação existente
2. Abra uma issue com sua pergunta
3. Entre em contato com os mantenedores

## Código de Conduta

- Seja respeitoso e inclusivo
- Aceite críticas construtivas
- Foque no que é melhor para a comunidade
- Mostre empatia com outros membros

## Licença

Ao contribuir, você concorda que suas contribuições serão licenciadas sob a mesma licença do projeto.

---

Obrigado por contribuir! 🎉
