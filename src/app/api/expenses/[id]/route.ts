import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

/**
 * GET /api/expenses/[id]
 * Buscar uma despesa específica por ID
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseClient()
    const { id } = await context.params
    const { data, error } = await supabase
      .from('expenses')
      .select(`
        *,
        category:expense_categories(*),
        credit_card:credit_cards(*),
        member:family_members(*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/expenses/[id]
 * Atualizar uma despesa existente
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseClient()
    const { id } = await context.params
    const body = await request.json()

    const { data, error } = await supabase
      .from('expenses')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/expenses/[id]
 * Excluir uma despesa
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseClient()
    const { id } = await context.params
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Despesa excluída com sucesso'
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
