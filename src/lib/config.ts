/**
 * Configurações da aplicação EAS Technology
 * 
 * @author Édipo de Almeida Santos
 * @copyright 2025 Édipo de Almeida Santos - Todos os direitos reservados
 */

export const APP_CONFIG = {
  name: 'EAS Technology',
  version: '1.0.0',
  author: 'Édipo de Almeida Santos',
  description: 'Sistema inteligente de gestão financeira pessoal',
  copyright: `© ${new Date().getFullYear()} Édipo de Almeida Santos. Todos os direitos reservados.`,
  
  features: {
    expenses: true,
    incomes: true,
    investments: true,
    creditCards: true,
    aiInsights: true,
    darkMode: true,
    recurrence: true,
  },
  
  social: {
    github: 'https://github.com/edipo-almeida',
    linkedin: 'https://linkedin.com/in/edipo-almeida',
  }
} as const

export type AppConfig = typeof APP_CONFIG
