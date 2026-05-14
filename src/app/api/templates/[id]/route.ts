import { NextResponse } from 'next/server'
import { templateService } from '@/lib/services/template.service'

export const runtime = 'nodejs'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const isActive = Boolean(body.isActive)
    const template = await templateService.toggleActive(id, isActive)
    return NextResponse.json(template)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro interno'
    return NextResponse.json({ error: msg }, { status: 400 })
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
