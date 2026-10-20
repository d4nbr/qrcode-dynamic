import { NextResponse } from 'next/server'
import { imageResponse } from '@/lib/image-response'
import { wallpaperService } from '@/lib/services/wallpaper.service'

export const runtime = 'nodejs'

// Wallpaper para exibir na tela (miniaturas do Histórico e resultado do Gerar).
// O download com nome de arquivo continua em /api/wallpapers/{id}/download.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    return imageResponse(await wallpaperService.getImage(id))
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro interno'
    const status = msg.includes('não encontrado') ? 404 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
