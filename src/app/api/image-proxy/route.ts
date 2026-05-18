import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_HOSTNAME = 'supabasekong-z12enjlk87cbbfsed61x0myg.185.249.227.151.sslip.io'

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')

  if (!url) {
    return new NextResponse('Missing url param', { status: 400 })
  }

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return new NextResponse('Invalid url', { status: 400 })
  }

  if (parsed.hostname !== ALLOWED_HOSTNAME) {
    return new NextResponse('Hostname not allowed', { status: 403 })
  }

  const response = await fetch(url)

  if (!response.ok) {
    return new NextResponse('Failed to fetch image', { status: response.status })
  }

  const contentType = response.headers.get('content-type') ?? 'image/png'
  const buffer = await response.arrayBuffer()

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
