'use client'

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Download, Trash2, Wifi, Calendar, Building2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate, proxyImageUrl } from '@/lib/utils'
import type { PaginatedWallpapers, WallpaperDto } from '@/lib/types'

async function fetchWallpapers({ pageParam }: { pageParam?: string }): Promise<PaginatedWallpapers> {
  const params = new URLSearchParams({ limit: '12' })
  if (pageParam) params.set('cursor', pageParam)
  const res = await fetch(`/api/wallpapers?${params}`)
  if (!res.ok) throw new Error('Erro ao carregar histórico')
  return res.json()
}

export function WallpaperHistory() {
  const queryClient = useQueryClient()

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } = useInfiniteQuery({
    queryKey: ['wallpapers'],
    queryFn: fetchWallpapers,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: last => last.nextCursor ?? undefined,
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/wallpapers/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao excluir')
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wallpapers'] }),
  })

  const allItems = data?.pages.flatMap(p => p.items) ?? []

  if (isLoading) return <HistorySkeleton />
  if (isError) {
    return <div className="text-center py-12 text-red-500">Erro ao carregar histórico.</div>
  }
  if (allItems.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <Wifi className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="font-medium">Nenhum wallpaper gerado ainda.</p>
        <p className="text-sm mt-1">Acesse a aba &ldquo;Gerar&rdquo; para criar o primeiro.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {allItems.map(item => (
          <WallpaperCard
            key={item.id}
            item={item}
            onDelete={() => deleteMutation.mutate(item.id)}
            deleting={deleteMutation.isPending && deleteMutation.variables === item.id}
          />
        ))}
      </div>

      {hasNextPage && (
        <div className="text-center">
          <Button variant="outline" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
            {isFetchingNextPage ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Carregando...
              </>
            ) : (
              'Carregar mais'
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

function WallpaperCard({ item, onDelete, deleting }: { item: WallpaperDto; onDelete: () => void; deleting: boolean }) {
  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = `/api/wallpapers/${item.id}/download`
    link.click()
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden group">
      {/* Thumbnail */}
      <div className="aspect-video bg-gray-100 relative overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={proxyImageUrl(item.publicUrl)}
          alt={item.comarcaName}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      </div>

      {/* Info */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-[#003366] text-sm leading-tight">{item.comarcaName}</p>
            <p className="text-xs text-gray-400 mt-0.5">{item.templateName}</p>
          </div>
          <Badge variant="secondary">{item.wifiSecurity}</Badge>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <Wifi className="w-3.5 h-3.5 text-[#003366]" />
            <span className="font-medium truncate">{item.wifiSsid}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDate(item.createdAt)}</span>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <Button size="sm" variant="outline" className="flex-1" onClick={handleDownload}>
            <Download className="w-3.5 h-3.5" />
            Baixar
          </Button>
          <Button size="sm" variant="destructive" onClick={onDelete} disabled={deleting}>
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>
    </div>
  )
}

function HistorySkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <Skeleton className="aspect-video" />
          <div className="p-4 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}
