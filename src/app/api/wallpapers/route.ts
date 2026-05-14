import { NextResponse } from 'next/server'
import { wallpaperService } from '@/lib/services/wallpaper.service'
import { generateWallpaperSchema } from '@/lib/validations'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const cursor = searchParams.get('cursor') ?? undefined
    const limit = Number(searchParams.get('limit') ?? 20)
    const data = await wallpaperService.list(cursor, limit)
    return NextResponse.json(data)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro interno'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = generateWallpaperSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const wallpaper = await wallpaperService.generate(parsed.data)
    return NextResponse.json(wallpaper, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro interno'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
