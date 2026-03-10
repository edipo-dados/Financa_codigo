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
 * GET /api/incomes/[id]
 * Buscar uma receita específica por ID
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseClient()
    const { id } = await context.params
    const { data, error } = await supabase
      .from('incomes')
      .select(`
        *,
        category:income_categories(*),
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
 * PATCH /api/incomes/[id]
 * Atualizar uma receita existente
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
      .from('incomes')
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
 * DELETE /api/incomes/[id]
 * Excluir uma receita
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseClient()
    const { id } = await context.params
    const { error } = await supabase
      .from('incomes')
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
      message: 'Receita excluída com sucesso'
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
