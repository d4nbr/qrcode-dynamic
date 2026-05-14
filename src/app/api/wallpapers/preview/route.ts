import { NextResponse } from 'next/server'
import { wallpaperService } from '@/lib/services/wallpaper.service'
import { previewQuerySchema } from '@/lib/validations'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const parsed = previewQuerySchema.safeParse({
      templateId: searchParams.get('templateId'),
      ssid: searchParams.get('ssid'),
      password: searchParams.get('password') ?? '',
      security: searchParams.get('security') ?? 'WPA',
    })

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const buffer = await wallpaperService.preview(
      parsed.data.templateId,
      parsed.data.ssid,
      parsed.data.password,
      parsed.data.security
    )

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
    const status = msg.includes('não encontrado') ? 404 : 400
    return NextResponse.json({ error: msg }, { status })
  }
}
