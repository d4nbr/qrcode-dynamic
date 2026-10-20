import { NextResponse } from 'next/server'
import type { StoredImage } from '@/lib/storage'

// Resposta das rotas de imagem: o PNG lido do bucket ou, para registro antigo
// fora do bucket atual, um redirecionamento para o endereço gravado. As URLs
// de wallpaper levam o caminho do objeto (?v=), que muda quando a imagem é
// regerada, então um dia de cache no navegador não mostra imagem velha.
export function imageResponse(image: StoredImage): NextResponse {
  if ('redirect' in image) {
    return NextResponse.redirect(image.redirect, { status: 302, headers: { 'Cache-Control': 'private, max-age=3600' } })
  }

  return new NextResponse(new Uint8Array(image.buffer), {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Content-Length': String(image.buffer.length),
      'Cache-Control': 'private, max-age=86400',
    },
  })
}
