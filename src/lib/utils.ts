import { format, parseISO, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, 'dd/MM/yyyy', { locale: ptBR })
}

export function formatMonth(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, 'MMM/yyyy', { locale: ptBR })
}

export function getCurrentMonthRange() {
  const now = new Date()
  return {
    start: format(startOfMonth(now), 'yyyy-MM-dd'),
    end: format(endOfMonth(now), 'yyyy-MM-dd'),
  }
}

export function getLastMonthsRange(months: number) {
  const now = new Date()
  return {
    start: format(startOfMonth(subMonths(now, months - 1)), 'yyyy-MM-dd'),
    end: format(endOfMonth(now), 'yyyy-MM-dd'),
  }
}

export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

export function isItemDue(itemDate: string): boolean {
  const today = new Date()
  const item = parseISO(itemDate)
  
  // Remove a parte do tempo para comparar apenas as datas
  today.setHours(0, 0, 0, 0)
  item.setHours(0, 0, 0, 0)
  
  // Item está vencido se a data é hoje ou anterior
  return item <= today
}

export function getPaymentStatus(item: { is_paid: boolean; expense_date?: string; income_date?: string }): 'paid' | 'pending' | 'future' {
  const itemDate = item.expense_date || item.income_date
  
  if (!itemDate) return item.is_paid ? 'paid' : 'pending'
  
  if (item.is_paid) return 'paid'
  
  // Se não está pago, verificar se já venceu
  return isItemDue(itemDate) ? 'pending' : 'future'
}
