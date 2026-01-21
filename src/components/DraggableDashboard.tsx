'use client'

import { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import StatsCardsWidget from './widgets/StatsCardsWidget'
import DynamicExpenseChart from './widgets/DynamicExpenseChart'
import DynamicIncomeChart from './widgets/DynamicIncomeChart'
import FinancialInsightsWidget from './widgets/FinancialInsightsWidget'
import KPIWidget from './widgets/KPIWidget'
import FutureProjectionsWidget from './widgets/FutureProjectionsWidget'
import DynamicProjectionChart from './widgets/DynamicProjectionChart'
import PaymentStatusWidget from './widgets/PaymentStatusWidget'
import CreditCardWidget from './widgets/CreditCardWidget'
import CurrentBalanceWidget from './widgets/CurrentBalanceWidget'
import { Expense, Investment, Income } from '@/types'

interface DashboardWidget {
  id: string
  type: 'stats' | 'income-chart' | 'expense-chart' | 'financial-insights' | 'kpi-widget' | 'future-projections' | 'projection-chart' | 'payment-status' | 'credit-card' | 'current-balance'
  title: string
  size: 'small' | 'medium' | 'large' | 'full'
  enabled: boolean
}

interface Props {
  expenses: Expense[]
  investments: Investment[]
  incomes: Income[]
  loading: boolean
  onRefresh?: () => void
  startDate?: string
  endDate?: string
  userId?: string
}

const STORAGE_KEY = 'dashboard-layout'

export default function DraggableDashboard({ 
  expenses, 
  investments, 
  incomes, 
  loading, 
  onRefresh, 
  startDate, 
  endDate,
  userId
}: Props) {
  const [isEditMode, setIsEditMode] = useState(false)
  const [widgets, setWidgets] = useState<DashboardWidget[]>([])

  // Configuração padrão dos widgets
  const defaultWidgets: DashboardWidget[] = [
    {
      id: 'current-balance',
      type: 'current-balance',
      title: 'Saldo Líquido',
      size: 'medium',
      enabled: true
    },
    {
      id: 'stats-cards',
      type: 'stats',
      title: 'Cartões de Estatísticas',
      size: 'full',
      enabled: true
    },
    {
      id: 'payment-status',
      type: 'payment-status',
      title: 'Status de Pagamentos',
      size: 'full',
      enabled: true
    },
    {
      id: 'future-projections',
      type: 'future-projections',
      title: 'Projeções Futuras',
      size: 'medium',
      enabled: true
    },
    {
      id: 'credit-card',
      type: 'credit-card',
      title: 'Fatura do Cartão',
      size: 'medium',
      enabled: true
    },
    {
      id: 'projection-chart',
      type: 'projection-chart',
      title: 'Gráfico de Projeção',
      size: 'full',
      enabled: true
    },
    {
      id: 'expense-chart',
      type: 'expense-chart',
      title: 'Gráfico de Despesas',
      size: 'medium',
      enabled: true
    },
    {
      id: 'income-chart',
      type: 'income-chart',
      title: 'Gráfico de Receitas',
      size: 'medium',
      enabled: true
    },
    {
      id: 'kpi-widget',
      type: 'kpi-widget',
      title: 'KPIs Configuráveis',
      size: 'full',
      enabled: true
    },
    {
      id: 'financial-insights',
      type: 'financial-insights',
      title: 'Análise Inteligente com IA',
      size: 'full',
      enabled: true
    }
  ]

  // Carregar layout salvo ou usar padrão
  useEffect(() => {
    const savedLayout = localStorage.getItem(STORAGE_KEY)
    console.log('Layout salvo encontrado:', savedLayout)
    
    if (savedLayout) {
      try {
        const parsed = JSON.parse(savedLayout)
        console.log('Widgets salvos:', parsed.length, 'Widgets padrão:', defaultWidgets.length)
        
        // Verificar se o layout salvo tem todos os widgets necessários
        const hasAllWidgets = defaultWidgets.every(defaultWidget => 
          parsed.some((savedWidget: DashboardWidget) => savedWidget.id === defaultWidget.id)
        )
        
        if (hasAllWidgets && parsed.length === defaultWidgets.length) {
          console.log('Usando layout salvo')
          setWidgets(parsed)
        } else {
          // Layout salvo está desatualizado, usar padrão e salvar
          console.log('Layout desatualizado detectado, usando configuração padrão')
          setWidgets(defaultWidgets)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultWidgets))
        }
      } catch (error) {
        console.error('Erro ao carregar layout:', error)
        setWidgets(defaultWidgets)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultWidgets))
      }
    } else {
      console.log('Nenhum layout salvo, usando padrão')
      setWidgets(defaultWidgets)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultWidgets))
    }
  }, [])

  // Criar componente baseado no tipo
  const createWidgetComponent = (widget: DashboardWidget) => {
    switch (widget.type) {
      case 'current-balance':
        return (
          <CurrentBalanceWidget
            expenses={expenses}
            investments={investments}
            incomes={incomes}
            loading={loading}
            userId={userId}
          />
        )
      case 'stats':
        return (
          <StatsCardsWidget
            expenses={expenses}
            investments={investments}
            incomes={incomes}
            loading={loading}
            startDate={startDate}
            endDate={endDate}
          />
        )
      case 'expense-chart':
        return (
          <DynamicExpenseChart
            expenses={expenses}
            loading={loading}
          />
        )
      case 'income-chart':
        return (
          <DynamicIncomeChart
            incomes={incomes}
            loading={loading}
          />
        )
      case 'financial-insights':
        return (
          <FinancialInsightsWidget
            expenses={expenses}
            investments={investments}
            incomes={incomes}
            loading={loading}
          />
        )
      case 'kpi-widget':
        return (
          <KPIWidget
            expenses={expenses}
            investments={investments}
            incomes={incomes}
            loading={loading}
            startDate={startDate}
            endDate={endDate}
          />
        )
      case 'future-projections':
        return (
          <FutureProjectionsWidget
            expenses={expenses}
            investments={investments}
            incomes={incomes}
            loading={loading}
          />
        )
      case 'projection-chart':
        return (
          <DynamicProjectionChart
            expenses={expenses}
            investments={investments}
            incomes={incomes}
            loading={loading}
          />
        )
      case 'payment-status':
        return (
          <PaymentStatusWidget
            expenses={expenses}
            incomes={incomes}
            loading={loading}
            startDate={startDate}
            endDate={endDate}
          />
        )
      case 'credit-card':
        return (
          <CreditCardWidget
            expenses={expenses}
            loading={loading}
            startDate={startDate}
            endDate={endDate}
          />
        )
      default:
        return (
          <div className="fintech-card p-6 rounded-2xl text-center">
            <span className="text-4xl mb-2 block">🚧</span>
            <p className="fintech-text-muted">Widget em desenvolvimento</p>
          </div>
        )
    }
  }

  // Salvar layout
  const saveLayout = (newWidgets: DashboardWidget[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newWidgets))
  }

  // Manipular drag and drop
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const newWidgets = Array.from(widgets)
    const [reorderedWidget] = newWidgets.splice(result.source.index, 1)
    newWidgets.splice(result.destination.index, 0, reorderedWidget)

    setWidgets(newWidgets)
    saveLayout(newWidgets)
  }

  // Alterar tamanho do widget
  const changeWidgetSize = (widgetId: string, newSize: 'small' | 'medium' | 'large' | 'full') => {
    const newWidgets = widgets.map(widget =>
      widget.id === widgetId ? { ...widget, size: newSize } : widget
    )
    setWidgets(newWidgets)
    saveLayout(newWidgets)
  }

  // Alternar visibilidade do widget
  const toggleWidget = (widgetId: string) => {
    const newWidgets = widgets.map(widget =>
      widget.id === widgetId ? { ...widget, enabled: !widget.enabled } : widget
    )
    setWidgets(newWidgets)
    saveLayout(newWidgets)
  }

  // Resetar para layout padrão
  const resetLayout = () => {
    setWidgets(defaultWidgets)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultWidgets))
    setIsEditMode(false)
  }

  // Forçar atualização para mostrar todos os widgets
  const forceShowAllWidgets = () => {
    const updatedWidgets = defaultWidgets.map(widget => ({ ...widget, enabled: true }))
    setWidgets(updatedWidgets)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedWidgets))
  }

  // Classes de tamanho
  const getSizeClass = (size: string) => {
    switch (size) {
      case 'small': return 'col-span-1'
      case 'medium': return 'col-span-1 lg:col-span-2'
      case 'large': return 'col-span-1 lg:col-span-3'
      case 'full': return 'col-span-full'
      default: return 'col-span-full'
    }
  }

  const enabledWidgets = widgets.filter(widget => widget.enabled)

  return (
    <div className="space-y-4">
      {/* Controles de Edição */}
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-fintech-dark-elevated rounded-xl">
        <div>
          <h3 className="font-semibold fintech-text-primary">⚙️ Configurar Dashboard</h3>
          <p className="text-sm fintech-text-muted">
            {isEditMode ? 'Arraste os widgets para reorganizar' : 'Personalize a disposição dos gráficos'}
          </p>
          <p className="text-xs fintech-text-muted mt-1">
            Widgets ativos: {enabledWidgets.length} de {widgets.length}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isEditMode && (
            <button
              onClick={forceShowAllWidgets}
              className="px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              📊 Mostrar Todos os Widgets
            </button>
          )}
          {isEditMode && (
            <>
              <button
                onClick={forceShowAllWidgets}
                className="px-3 py-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
              >
                📊 Mostrar Todos
              </button>
              <button
                onClick={resetLayout}
                className="px-3 py-2 text-sm text-red-600 hover:text-red-700 transition-colors"
              >
                🔄 Resetar
              </button>
            </>
          )}
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              isEditMode 
                ? 'bg-green-500 text-white hover:bg-green-600' 
                : 'bg-apple-blue text-white hover:bg-apple-blue/90'
            }`}
          >
            {isEditMode ? '✓ Salvar' : '⚙️ Editar Layout'}
          </button>
        </div>
      </div>

      {/* Painel de Widgets (apenas no modo edição) */}
      {isEditMode && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
          <h4 className="font-medium fintech-text-primary mb-3">📊 Escolha Seus Widgets</h4>
          <p className="text-sm fintech-text-muted mb-4">Marque/desmarque para mostrar ou ocultar widgets no dashboard</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {widgets.map(widget => (
              <div key={widget.id} className="flex items-center justify-between p-3 bg-white dark:bg-fintech-dark-surface rounded-lg border fintech-border">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={widget.enabled}
                    onChange={() => toggleWidget(widget.id)}
                    className="w-4 h-4 text-apple-blue rounded focus:ring-apple-blue focus:ring-2"
                  />
                  <div>
                    <span className="text-sm font-medium fintech-text-primary block">{widget.title}</span>
                    <span className={`text-xs ${widget.enabled ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                      {widget.enabled ? '✓ Visível' : '✗ Oculto'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {['S', 'M', 'L', 'F'].map((size, index) => {
                    const sizeMap = ['small', 'medium', 'large', 'full']
                    const sizeLabels = ['Pequeno', 'Médio', 'Grande', 'Completo']
                    return (
                      <button
                        key={size}
                        onClick={() => changeWidgetSize(widget.id, sizeMap[index] as any)}
                        className={`w-7 h-7 rounded text-xs font-bold transition-colors ${
                          widget.size === sizeMap[index]
                            ? 'bg-apple-blue text-white'
                            : 'bg-gray-200 dark:bg-fintech-dark-elevated text-gray-600 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                        title={`Tamanho ${sizeLabels[index]}`}
                        disabled={!widget.enabled}
                      >
                        {size}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
          
          {/* Ações Rápidas */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const allEnabled = widgets.map(w => ({ ...w, enabled: true }))
                  setWidgets(allEnabled)
                  saveLayout(allEnabled)
                }}
                className="px-3 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                ✓ Marcar Todos
              </button>
              <button
                onClick={() => {
                  const allDisabled = widgets.map(w => ({ ...w, enabled: false }))
                  setWidgets(allDisabled)
                  saveLayout(allDisabled)
                }}
                className="px-3 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                ✗ Desmarcar Todos
              </button>
            </div>
            <div className="text-sm fintech-text-muted">
              {enabledWidgets.length} de {widgets.length} widgets ativos
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Widgets */}
      {enabledWidgets.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-fintech-dark-elevated rounded-xl">
          <span className="text-6xl mb-4 block">📊</span>
          <h3 className="text-xl font-semibold fintech-text-primary mb-2">Nenhum widget selecionado</h3>
          <p className="fintech-text-muted mb-4">Clique em "⚙️ Editar Layout" para escolher quais widgets mostrar</p>
          <button
            onClick={() => setIsEditMode(true)}
            className="px-6 py-3 bg-apple-blue text-white rounded-lg hover:bg-apple-blue/90 transition-colors"
          >
            ⚙️ Configurar Widgets
          </button>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="dashboard" direction="vertical">
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={`grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 transition-all duration-200 ${
                  snapshot.isDraggingOver ? 'bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4' : ''
                }`}
              >
                {enabledWidgets.map((widget, index) => (
                  <Draggable
                    key={widget.id}
                    draggableId={widget.id}
                    index={index}
                    isDragDisabled={!isEditMode}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`
                          ${getSizeClass(widget.size)}
                          ${snapshot.isDragging ? 'rotate-1 scale-105 z-50' : ''}
                          ${isEditMode ? 'ring-2 ring-apple-blue/30 ring-offset-2 dark:ring-offset-fintech-dark-bg' : ''}
                          transition-all duration-200
                        `}
                      >
                        {/* Widget Header (apenas no modo edição) */}
                        {isEditMode && (
                          <div className="mb-2 p-2 bg-white dark:bg-fintech-dark-surface rounded-lg border fintech-border">
                            <div className="flex items-center justify-between">
                              <div
                                {...provided.dragHandleProps}
                                className="flex items-center gap-2 cursor-grab active:cursor-grabbing"
                              >
                                <span className="text-gray-400">⋮⋮</span>
                                <span className="text-sm font-medium fintech-text-primary">
                                  {widget.title}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Widget Content */}
                        <div className={isEditMode ? 'pointer-events-none opacity-75' : ''}>
                          {createWidgetComponent(widget)}
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* Instruções no modo edição */}
      {isEditMode && (
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
          <h4 className="font-medium text-amber-800 dark:text-amber-300 mb-2">💡 Como personalizar seu dashboard:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-amber-700 dark:text-amber-400">
            <div>
              <h5 className="font-semibold mb-2">🎛️ Controles de Widgets:</h5>
              <ul className="space-y-1">
                <li>• <strong>☑️ Checkbox:</strong> Marque para mostrar, desmarque para ocultar</li>
                <li>• <strong>S/M/L/F:</strong> Escolha o tamanho (Pequeno/Médio/Grande/Completo)</li>
                <li>• <strong>⋮⋮ Arrastar:</strong> Mova widgets para reorganizar posições</li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-2">⚡ Ações Rápidas:</h5>
              <ul className="space-y-1">
                <li>• <strong>✓ Marcar Todos:</strong> Mostra todos os widgets</li>
                <li>• <strong>✗ Desmarcar Todos:</strong> Oculta todos os widgets</li>
                <li>• <strong>🔄 Resetar:</strong> Volta à configuração padrão</li>
                <li>• <strong>✓ Salvar:</strong> Confirma suas alterações</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}