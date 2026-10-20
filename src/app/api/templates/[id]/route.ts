import { NextResponse } from 'next/server'
import { templateService } from '@/lib/services/template.service'
import { updateTemplateSchema } from '@/lib/validations'

export const runtime = 'nodejs'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const parsed = updateTemplateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const template = await templateService.update(id, parsed.data)
    return NextResponse.json(template)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro interno'
    const status = msg.includes('não encontrado') ? 404 : 400
    return NextResponse.json({ error: msg }, { status })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await templateService.delete(id)
    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro interno'
    const status = msg.includes('possui') ? 409 : 400
    return NextResponse.json({ error: msg }, { status })
  }
}
