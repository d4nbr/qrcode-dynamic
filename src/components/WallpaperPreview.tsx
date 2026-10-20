'use client'

import { ImageIcon, Move } from 'lucide-react'
import { QrCardPositioner, useQrCardImage } from '@/components/QrCardPositioner'
import { Button } from '@/components/ui/button'
import type { QrPlacement } from '@/lib/qr-placement'
import type { QrCardContent, TemplateDto } from '@/lib/types'
import { templateImageUrl } from '@/lib/utils'

type Props = {
  template: TemplateDto | null
  content: QrCardContent
  placement: QrPlacement
  onPlacementChange: (placement: QrPlacement) => void
  savedUrl: string | null
  onAdjust: () => void
}

export function WallpaperPreview({ template, content, placement, onPlacementChange, savedUrl, onAdjust }: Props) {
  const card = useQrCardImage(template ? content : null)

  if (savedUrl) {
    return (
      <div className="space-y-3">
        <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={savedUrl} alt="Wallpaper gerado" className="h-full w-full object-cover" />
          <div className="absolute right-2 bottom-2 rounded-md bg-black/50 px-2 py-1 text-white text-xs">1920 × 1080</div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onAdjust}>
          <Move className="h-3.5 w-3.5" />
          Ajustar posição
        </Button>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-gray-200 border-dashed bg-gray-50 text-gray-400">
        <ImageIcon className="h-12 w-12" />
        <p className="font-medium text-sm">Escolha um template para visualizar</p>
      </div>
    )
  }

  return (
    <QrCardPositioner
      backgroundUrl={templateImageUrl(template.id)}
      cardUrl={card.url}
      cardError={card.error}
      placement={placement}
      hasPassword={content.wifiSecurity !== 'nopass'}
      onChange={onPlacementChange}
    />
  )
}
