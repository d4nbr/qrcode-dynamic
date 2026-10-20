'use client'

import { ImageIcon, Loader2 } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import {
  cardSize,
  fitPlacement,
  maxQrSizeAt,
  OUTPUT_HEIGHT,
  OUTPUT_WIDTH,
  QR_SIZE_MAX,
  QR_SIZE_MIN,
  type QrPlacement,
} from '@/lib/qr-placement'
import type { QrCardContent } from '@/lib/types'
import { cn } from '@/lib/utils'

const MOVE_STEP = 10
const MOVE_STEP_LARGE = 50
const SIZE_STEP = 10

// Conteúdo de exemplo enquanto o SSID não foi preenchido, e no Admin.
export const SAMPLE_CARD_CONTENT: QrCardContent = {
  wifiSsid: 'NOME DA REDE',
  wifiPassword: 'senha-do-wifi',
  wifiSecurity: 'WPA',
}

// Busca o PNG do cartão quando o conteúdo muda e o expõe como object URL.
// A primeira busca é imediata; as seguintes esperam a digitação parar.
// Arrastar e redimensionar não passam por aqui: só mexem no CSS.
export function useQrCardImage(content: QrCardContent | null) {
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const urlRef = useRef<string | null>(null)
  const body = content ? JSON.stringify(content) : null

  useEffect(() => {
    if (!body) return
    const controller = new AbortController()
    const timer = setTimeout(
      async () => {
        try {
          const res = await fetch('/api/wallpapers/card', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body,
            signal: controller.signal,
          })
          if (!res.ok) throw new Error('Falha ao gerar o cartão')
          const next = URL.createObjectURL(await res.blob())
          if (urlRef.current) URL.revokeObjectURL(urlRef.current)
          urlRef.current = next
          setUrl(next)
          setError(false)
        } catch {
          if (!controller.signal.aborted) setError(true)
        }
      },
      urlRef.current ? 700 : 0
    )
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [body])

  useEffect(
    () => () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    },
    []
  )

  return { url, error }
}

type DragState = {
  mode: 'move' | 'resize'
  pointerId: number
  startX: number
  startY: number
  start: QrPlacement
  // px da tela → px da imagem final
  scale: number
}

type Props = {
  backgroundUrl: string | null
  cardUrl: string | null
  cardError?: boolean
  placement: QrPlacement
  hasPassword: boolean
  onChange: (placement: QrPlacement) => void
}

// Prévia com a arte esticada para 16:9, como o sharp faz com fit 'fill', e o
// cartão por cima nas mesmas coordenadas da imagem final, em porcentagem.
export function QrCardPositioner({ backgroundUrl, cardUrl, cardError = false, placement, hasPassword, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLButtonElement>(null)
  const drag = useRef<DragState | null>(null)
  const [dragging, setDragging] = useState(false)
  const hintId = useId()

  const { width, height } = cardSize(placement.qrSize, hasPassword)

  function begin(mode: DragState['mode'], event: React.PointerEvent) {
    const container = containerRef.current
    if (!container || event.button !== 0) return
    event.preventDefault()
    event.stopPropagation()
    cardRef.current?.focus()
    cardRef.current?.setPointerCapture(event.pointerId)
    drag.current = {
      mode,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      start: placement,
      scale: OUTPUT_WIDTH / container.getBoundingClientRect().width,
    }
    setDragging(true)
  }

  function handlePointerMove(event: React.PointerEvent) {
    const state = drag.current
    if (!state || state.pointerId !== event.pointerId) return
    const dx = (event.clientX - state.startX) * state.scale
    const dy = (event.clientY - state.startY) * state.scale

    if (state.mode === 'move') {
      onChange(fitPlacement({ ...state.start, qrLeft: state.start.qrLeft + dx, qrTop: state.start.qrTop + dy }, hasPassword))
      return
    }

    // Alça: o canto superior esquerdo fica fixo e o cartão mantém a proporção.
    const startCard = cardSize(state.start.qrSize, hasPassword)
    const grow = (dx + dy * (startCard.width / startCard.height)) / 2
    const desired = state.start.qrSize * ((startCard.width + grow) / startCard.width)
    const limit = maxQrSizeAt(state.start.qrLeft, state.start.qrTop, hasPassword)
    onChange(fitPlacement({ ...state.start, qrSize: Math.min(Math.max(desired, QR_SIZE_MIN), limit) }, hasPassword))
  }

  function end(event: React.PointerEvent) {
    if (drag.current?.pointerId !== event.pointerId) return
    drag.current = null
    setDragging(false)
    if (cardRef.current?.hasPointerCapture(event.pointerId)) cardRef.current.releasePointerCapture(event.pointerId)
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    const step = event.shiftKey ? MOVE_STEP_LARGE : MOVE_STEP
    const { qrLeft, qrTop, qrSize } = placement
    let next: QrPlacement | null = null

    switch (event.key) {
      case 'ArrowLeft':
        next = { ...placement, qrLeft: qrLeft - step }
        break
      case 'ArrowRight':
        next = { ...placement, qrLeft: qrLeft + step }
        break
      case 'ArrowUp':
        next = { ...placement, qrTop: qrTop - step }
        break
      case 'ArrowDown':
        next = { ...placement, qrTop: qrTop + step }
        break
      case '+':
      case '=':
        next = { ...placement, qrSize: Math.min(qrSize + SIZE_STEP, maxQrSizeAt(qrLeft, qrTop, hasPassword)) }
        break
      case '-':
      case '_':
        next = { ...placement, qrSize: qrSize - SIZE_STEP }
        break
    }

    if (!next) return
    event.preventDefault()
    onChange(fitPlacement(next, hasPassword))
  }

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        className="relative aspect-video w-full select-none overflow-hidden rounded-xl border border-gray-200 bg-gray-900"
      >
        {backgroundUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={backgroundUrl}
            alt=""
            draggable={false}
            className="pointer-events-none absolute inset-0 h-full w-full object-fill"
          />
        )}

        {cardUrl ? (
          <button
            ref={cardRef}
            type="button"
            aria-roledescription="cartão posicionável"
            aria-label="Cartão do QR Code"
            aria-describedby={hintId}
            onPointerDown={event => begin('move', event)}
            onPointerMove={handlePointerMove}
            onPointerUp={end}
            onPointerCancel={end}
            onKeyDown={handleKeyDown}
            className={cn(
              'absolute block touch-none rounded-[4%] p-0 outline-none ring-[#c9a227] focus-visible:ring-4',
              dragging ? 'cursor-grabbing ring-4' : 'cursor-grab'
            )}
            style={{
              left: `${(placement.qrLeft / OUTPUT_WIDTH) * 100}%`,
              top: `${(placement.qrTop / OUTPUT_HEIGHT) * 100}%`,
              width: `${(width / OUTPUT_WIDTH) * 100}%`,
              height: `${(height / OUTPUT_HEIGHT) * 100}%`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cardUrl} alt="" draggable={false} className="pointer-events-none h-full w-full" />
            <span
              aria-hidden="true"
              title="Arraste para mudar o tamanho"
              onPointerDown={event => begin('resize', event)}
              className="absolute right-0.5 bottom-0.5 h-4 w-4 cursor-nwse-resize rounded-sm border-2 border-white bg-[#003366] shadow"
            />
          </button>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gray-900/40 text-white">
            {cardError ? (
              <>
                <ImageIcon className="h-8 w-8 text-red-300" />
                <p className="text-red-200 text-sm">Erro ao gerar o cartão do QR</p>
              </>
            ) : (
              <Loader2 className="h-8 w-8 animate-spin" />
            )}
          </div>
        )}
      </div>

      <p id={hintId} className="text-gray-500 text-xs">
        Arraste o cartão para posicioná-lo e use a alça do canto para mudar o tamanho. Pelo teclado: setas movem (com Shift, mais
        rápido), + e − mudam o tamanho.
      </p>
      <p className="text-gray-400 text-xs" aria-live="polite">
        Posição {placement.qrLeft} × {placement.qrTop} px · QR {placement.qrSize} px (de {QR_SIZE_MIN} a {QR_SIZE_MAX}) · imagem{' '}
        {OUTPUT_WIDTH} × {OUTPUT_HEIGHT}
      </p>
    </div>
  )
}
