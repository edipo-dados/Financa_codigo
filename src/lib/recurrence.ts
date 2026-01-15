import { addDays, addWeeks, addMonths, addYears, isBefore, isAfter, format, getDaysInMonth, parseISO } from 'date-fns'

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly'
export type RecurrenceEndType = 'never' | 'after_occurrences' | 'on_date'

export interface RecurrenceConfig {
  startDate: Date
  frequency: RecurrenceFrequency
  endType: RecurrenceEndType
  endDate?: Date
  occurrences?: number
}

export interface RecurrenceOccurrence {
  date: Date
  occurrenceNumber: number
}

/**
 * Calcula a próxima data de recorrência mensal, respeitando o dia do mês
 * Se o dia não existir no mês de destino, usa o último dia do mês
 */
function getNextMonthlyDate(currentDate: Date, originalDay: number): Date {
  const nextMonth = addMonths(currentDate, 1)
  const daysInNextMonth = getDaysInMonth(nextMonth)
  
  // Se o dia original existe no próximo mês, usa ele
  // Senão, usa o último dia do mês
  const dayToUse = Math.min(originalDay, daysInNextMonth)
  
  return new Date(
    nextMonth.getFullYear(),
    nextMonth.getMonth(),
    dayToUse
  )
}

/**
 * Gera lista de ocorrências futuras baseada na configuração de recorrência
 * Sempre prospectivo (apenas datas futuras)
 */
export function generateRecurrenceOccurrences(config: RecurrenceConfig, maxOccurrences: number = 12): RecurrenceOccurrence[] {
  const occurrences: RecurrenceOccurrence[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  let currentDate = new Date(config.startDate)
  currentDate.setHours(0, 0, 0, 0)
  
  // Se a data inicial é no passado, começar de hoje
  if (isBefore(currentDate, today)) {
    currentDate = new Date(today)
  }
  
  const originalDay = config.startDate.getDate()
  let occurrenceCount = 0
  
  // Determinar limite de ocorrências
  const limit = config.endType === 'after_occurrences' && config.occurrences
    ? config.occurrences
    : maxOccurrences
  
  while (occurrenceCount < limit) {
    // Verificar se passou da data final (se definida)
    if (config.endType === 'on_date' && config.endDate) {
      if (isAfter(currentDate, config.endDate)) {
        break
      }
    }
    
    // Adicionar ocorrência
    occurrences.push({
      date: new Date(currentDate),
      occurrenceNumber: occurrenceCount + 1,
    })
    
    occurrenceCount++
    
    // Calcular próxima data baseada na frequência
    switch (config.frequency) {
      case 'daily':
        currentDate = addDays(currentDate, 1)
        break
        
      case 'weekly':
        currentDate = addWeeks(currentDate, 1)
        break
        
      case 'monthly':
        // Lógica especial para mensal
        currentDate = getNextMonthlyDate(currentDate, originalDay)
        break
        
      case 'yearly':
        currentDate = addYears(currentDate, 1)
        break
    }
  }
  
  return occurrences
}

/**
 * Formata uma ocorrência para exibição
 */
export function formatOccurrence(occurrence: RecurrenceOccurrence): string {
  return `${format(occurrence.date, 'dd/MM/yyyy')} (${occurrence.occurrenceNumber}ª ocorrência)`
}

/**
 * Calcula o total projetado de uma recorrência
 */
export function calculateRecurrenceTotal(amount: number, occurrences: RecurrenceOccurrence[]): number {
  return amount * occurrences.length
}

/**
 * Obtém descrição legível da recorrência
 */
export function getRecurrenceDescription(config: RecurrenceConfig): string {
  const frequencyLabels = {
    daily: 'Diária',
    weekly: 'Semanal',
    monthly: 'Mensal',
    yearly: 'Anual',
  }
  
  const frequency = frequencyLabels[config.frequency]
  
  switch (config.endType) {
    case 'never':
      return `${frequency} - Sem fim`
      
    case 'after_occurrences':
      return `${frequency} - ${config.occurrences} vezes`
      
    case 'on_date':
      return `${frequency} - Até ${format(config.endDate!, 'dd/MM/yyyy')}`
      
    default:
      return frequency
  }
}

/**
 * Valida configuração de recorrência
 */
export function validateRecurrenceConfig(config: RecurrenceConfig): { valid: boolean; error?: string } {
  if (config.endType === 'after_occurrences') {
    if (!config.occurrences || config.occurrences < 1) {
      return { valid: false, error: 'Número de ocorrências deve ser maior que 0' }
    }
    if (config.occurrences > 365) {
      return { valid: false, error: 'Número de ocorrências não pode ser maior que 365' }
    }
  }
  
  if (config.endType === 'on_date') {
    if (!config.endDate) {
      return { valid: false, error: 'Data final é obrigatória' }
    }
    if (isBefore(config.endDate, config.startDate)) {
      return { valid: false, error: 'Data final deve ser posterior à data inicial' }
    }
  }
  
  return { valid: true }
}

/**
 * Exemplo de uso para projeção mensal
 */
export function getMonthlyProjection(
  startDate: Date,
  amount: number,
  months: number = 12
): { date: Date; amount: number }[] {
  const config: RecurrenceConfig = {
    startDate,
    frequency: 'monthly',
    endType: 'after_occurrences',
    occurrences: months,
  }
  
  const occurrences = generateRecurrenceOccurrences(config, months)
  
  return occurrences.map(occ => ({
    date: occ.date,
    amount,
  }))
}

/**
 * Calcula projeções futuras de receitas/despesas recorrentes
 */
export function calculateFutureOccurrences(
  items: Array<{
    amount: number
    is_recurring: boolean
    recurrence_frequency: RecurrenceFrequency | null
    recurrence_start_date: string | null
    recurrence_end_type: RecurrenceEndType | null
    recurrence_end_date: string | null
    recurrence_count: number | null
  }>,
  monthsAhead: number = 12
): { date: Date; amount: number }[] {
  const futureOccurrences: { date: Date; amount: number }[] = []
  
  items.forEach(item => {
    if (!item.is_recurring || !item.recurrence_frequency || !item.recurrence_start_date) {
      return
    }
    
    const config: RecurrenceConfig = {
      startDate: parseISO(item.recurrence_start_date),
      frequency: item.recurrence_frequency,
      endType: item.recurrence_end_type || 'never',
      endDate: item.recurrence_end_date ? parseISO(item.recurrence_end_date) : undefined,
      occurrences: item.recurrence_count || undefined,
    }
    
    const occurrences = generateRecurrenceOccurrences(config, monthsAhead * 4) // Gerar mais para cobrir todos os meses
    
    occurrences.forEach(occ => {
      futureOccurrences.push({
        date: occ.date,
        amount: item.amount,
      })
    })
  })
  
  return futureOccurrences.sort((a, b) => a.date.getTime() - b.date.getTime())
}

/**
 * Agrupa ocorrências futuras por mês
 */
export function groupByMonth(
  occurrences: { date: Date; amount: number }[]
): { month: string; total: number }[] {
  const grouped = occurrences.reduce((acc, occ) => {
    const monthKey = format(occ.date, 'yyyy-MM')
    if (!acc[monthKey]) {
      acc[monthKey] = 0
    }
    acc[monthKey] += occ.amount
    return acc
  }, {} as Record<string, number>)
  
  return Object.entries(grouped)
    .map(([month, total]) => ({ month, total }))
    .sort((a, b) => a.month.localeCompare(b.month))
}
