'use client'

import { useState, useEffect } from 'react'
import { ImageIcon, Loader2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { proxyImageUrl } from '@/lib/utils'

type Props = {
  previewUrl: string | null
  savedUrl: string | null
}

export function WallpaperPreview({ previewUrl, savedUrl }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [imgSrc, setImgSrc] = useState<string | null>(null)

  useEffect(() => {
    if (!previewUrl) {
      setImgSrc(null)
      setError(false)
      return
    }
    setLoading(true)
    setError(false)
    setImgSrc(previewUrl)
  }, [previewUrl])

  if (!imgSrc && !savedUrl) {
    return (
      <div className="aspect-video w-full rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-3 text-gray-400">
        <ImageIcon className="w-12 h-12" />
        <p className="text-sm font-medium">Preencha o formulário para visualizar</p>
      </div>
    )
  }

  const displayUrl = savedUrl ?? imgSrc

  return (
    <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-gray-200 bg-gray-900">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/60 z-10">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-red-400 bg-gray-900">
          <ImageIcon className="w-10 h-10" />
          <p className="text-sm">Erro ao gerar preview</p>
        </div>
      )}
      {displayUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={displayUrl}
          src={proxyImageUrl(displayUrl)}
          alt="Preview do wallpaper"
          className="w-full h-full object-cover"
          onLoadStart={() => setLoading(true)}
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false)
            setError(true)
          }}
        />
      )}
      {!loading && !error && displayUrl && (
        <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-md">1920 × 1080</div>
      )}
    </div>
  )
}

export function WallpaperPreviewSkeleton() {
  return <Skeleton className="aspect-video w-full rounded-xl" />
}
