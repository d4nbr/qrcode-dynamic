import { NextResponse } from 'next/server'
import { wallpaperService } from '@/lib/services/wallpaper.service'
import { downloadFile } from '@/lib/storage'
import { sanitizeFilename } from '@/lib/utils'

export const runtime = 'nodejs'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const wallpaper = await wallpaperService.getById(id)

    if (!wallpaper) {
      return NextResponse.json({ error: 'Wallpaper não encontrado.' }, { status: 404 })
    }

    const buffer = await downloadFile(wallpaper.storedPath)
    const slug = sanitizeFilename(wallpaper.comarcaName)
    const filename = `oabma-${slug}-wifi.png`

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(buffer.length),
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro interno'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
