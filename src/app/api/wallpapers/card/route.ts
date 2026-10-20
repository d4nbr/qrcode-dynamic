import { NextResponse } from 'next/server'
import { wallpaperService } from '@/lib/services/wallpaper.service'
import { qrCardSchema } from '@/lib/validations'

export const runtime = 'nodejs'

// Cartão do QR para a prévia. É POST para que a senha do Wi-Fi vá no corpo, e
// não na URL, que acaba em logs de acesso e no cache do navegador.
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = qrCardSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const buffer = await wallpaperService.renderCard(parsed.data)

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store',
        'Content-Length': String(buffer.length),
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro interno'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
