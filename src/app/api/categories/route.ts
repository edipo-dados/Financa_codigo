import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * GET /api/categories
 * Lista todas as categorias de despesas do usuário
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const type = searchParams.get('type') // 'expense' ou 'income'

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar categorias de despesas
    if (!type || type === 'expense') {
      const { data: expenseCategories, error: expenseError } = await supabase
        .from('expense_categories')
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true })

      if (expenseError) {
        return NextResponse.json({ error: expenseError.message }, { status: 500 })
      }

      // Se só quer categorias de despesas
      if (type === 'expense') {
        return NextResponse.json({
          success: true,
          type: 'expense',
          data: expenseCategories,
        })
      }

      // Buscar categorias de receitas também
      const { data: incomeCategories, error: incomeError } = await supabase
        .from('income_categories')
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true })

      if (incomeError) {
        return NextResponse.json({ error: incomeError.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        data: {
          expenses: expenseCategories,
          incomes: incomeCategories,
        },
      })
    }

    // Buscar apenas categorias de receitas
    if (type === 'income') {
      const { data: incomeCategories, error: incomeError } = await supabase
        .from('income_categories')
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true })

      if (incomeError) {
        return NextResponse.json({ error: incomeError.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        type: 'income',
        data: incomeCategories,
      })
    }

    return NextResponse.json(
      { error: 'Tipo inválido. Use "expense" ou "income"' },
      { status: 400 }
    )
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/categories
 * Cria uma nova categoria
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, name, color, icon, type } = body

    // Validações
    if (!user_id || !name || !type) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: user_id, name, type' },
        { status: 400 }
      )
    }

    if (type !== 'expense' && type !== 'income') {
      return NextResponse.json(
        { error: 'type deve ser "expense" ou "income"' },
        { status: 400 }
      )
    }

    const tableName = type === 'expense' ? 'expense_categories' : 'income_categories'

    // Criar a categoria
    const { data: category, error: categoryError } = await supabase
      .from(tableName)
      .insert({
        user_id,
        name,
        color: color || '#3b82f6',
        icon: icon || '📁',
      })
      .select()
      .single()

    if (categoryError) {
      return NextResponse.json({ error: categoryError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: category,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
