import { NextResponse } from 'next/server'
import { imageResponse } from '@/lib/image-response'
import { templateService } from '@/lib/services/template.service'

export const runtime = 'nodejs'

// Arte do template para a prévia e as miniaturas do Admin.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    return imageResponse(await templateService.getImage(id))
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro interno'
    const status = msg.includes('não encontrado') ? 404 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
