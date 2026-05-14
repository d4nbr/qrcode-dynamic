import { NextResponse } from 'next/server'
import { wallpaperService } from '@/lib/services/wallpaper.service'

export const runtime = 'nodejs'

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await wallpaperService.delete(id)
    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro interno'
    const status = msg.includes('não encontrado') ? 404 : 400
    return NextResponse.json({ error: msg }, { status })
  }
}
