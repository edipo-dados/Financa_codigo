# Expense Deletion Dashboard Update Fixes

## Problem
User reported that after deleting a R$ 1,550 expense, the dashboard didn't update properly. The expense total should have changed from R$ 26,406 to R$ 24,856, but it didn't reflect the change.

## Root Causes Identified

### 1. **Incorrect Function Call in ExpensesList.tsx**
- **Issue**: The `handleDelete` function was being called with `expense.id` instead of the full `expense` object
- **Impact**: This caused the deletion logic to fail when trying to handle credit card installments
- **Fix**: Changed `onClick: () => handleDelete(expense.id)` to `onClick: () => handleDelete(expense)`

### 2. **Missing Credit Card Filtering in StatsCardsWidget.tsx**
- **Issue**: The current period expenses were not being filtered to exclude credit card parent purchases
- **Impact**: Credit card parent purchases were being counted twice (parent + installments)
- **Fix**: Added filtering logic: `const filteredPeriodExpenses = periodExpenses.filter(e => !e.is_credit_card || e.is_installment)`

### 3. **Missing Credit Card Filtering in Chart Widgets**
- **Issue**: `ExpenseChartWidget.tsx` and `ExpenseChartCore.tsx` were not filtering credit card parent purchases
- **Impact**: Charts showed incorrect expense totals including parent purchases
- **Fix**: Added filtering logic in both widgets before calculating category totals

### 4. **Dashboard Refresh Dependencies**
- **Issue**: `StatsCardsWidget` wasn't refreshing when expenses were deleted
- **Impact**: Dashboard showed stale data after expense operations
- **Fix**: Added `expenses.length`, `incomes.length`, `investments.length` as dependencies to force refresh

## Files Modified

1. **src/components/ExpensesList.tsx**
   - Fixed `handleDelete` function calls to pass full expense object

2. **src/components/widgets/StatsCardsWidget.tsx**
   - Added credit card filtering for current period expenses
   - Added refresh dependencies to useEffect

3. **src/components/widgets/ExpenseChartWidget.tsx**
   - Added credit card filtering before calculating category data

4. **src/components/widgets/ExpenseChartCore.tsx**
   - Added credit card filtering before calculating category data

## Expected Behavior After Fixes

1. **Expense Deletion**: When deleting an expense, the dashboard should immediately update
2. **Credit Card Filtering**: Only credit card installments are counted, not parent purchases
3. **Real-time Updates**: All widgets refresh automatically when data changes
4. **Consistent Calculations**: All widgets use the same filtering logic

## Testing Steps

1. Delete an expense and verify dashboard updates immediately
2. Check that credit card expenses show only installments in totals
3. Verify that charts and stats cards show consistent values
4. Confirm that the balance calculations are correct

## Balance Calculation Formula (Confirmed)

- **Saldo Líquido** = (Receitas - Despesas - Investimentos) + Saldo Acumulado Anterior
- **Saldo de Patrimônio** = Saldo Líquido + Investimentos
- **Despesas Contabilizadas** = Despesas Normais + Parcelas de Cartão (excluindo compras parent)