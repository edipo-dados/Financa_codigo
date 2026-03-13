import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * GET /api/categories/[id]
 * Busca uma categoria específica
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'expense'

    const tableName = type === 'expense' ? 'expense_categories' : 'income_categories'

    const { data: category, error: categoryError } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', id)
      .single()

    if (categoryError || !category) {
      return NextResponse.json(
        { error: 'Categoria não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: category,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * PATCH /api/categories/[id]
 * Atualiza uma categoria
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { type, ...updateData } = body

    const tableName = type === 'expense' ? 'expense_categories' : 'income_categories'

    const { data: category, error: updateError } = await supabase
      .from(tableName)
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: category,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * DELETE /api/categories/[id]
 * Exclui uma categoria
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'expense'

    const tableName = type === 'expense' ? 'expense_categories' : 'income_categories'
    const relatedTable = type === 'expense' ? 'expenses' : 'incomes'

    // Verificar se existem registros vinculados
    const { data: related, error: relatedError } = await supabase
      .from(relatedTable)
      .select('id')
      .eq('category_id', id)
      .limit(1)

    if (relatedError) {
      return NextResponse.json({ error: relatedError.message }, { status: 500 })
    }

    if (related && related.length > 0) {
      return NextResponse.json(
        { error: `Não é possível excluir uma categoria com ${type === 'expense' ? 'despesas' : 'receitas'} vinculadas` },
        { status: 400 }
      )
    }

    const { error: deleteError } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Categoria excluída com sucesso',
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
