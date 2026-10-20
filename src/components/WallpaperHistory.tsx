'use client'

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Calendar, Download, Loader2, MapPin, Pencil, Trash2, Wifi } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { WallpaperEditDialog } from '@/components/WallpaperEditDialog'
import type { PaginatedWallpapers, WallpaperDto } from '@/lib/types'
import { formatDate, wallpaperImageUrl } from '@/lib/utils'

async function fetchWallpapers({ pageParam }: { pageParam?: string }): Promise<PaginatedWallpapers> {
  const params = new URLSearchParams({ limit: '12' })
  if (pageParam) params.set('cursor', pageParam)
  const res = await fetch(`/api/wallpapers?${params}`)
  if (!res.ok) throw new Error('Erro ao carregar histórico')
  return res.json()
}

export function WallpaperHistory() {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<WallpaperDto | null>(null)

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
    return <div className="py-12 text-center text-red-500">Erro ao carregar histórico.</div>
  }
  if (allItems.length === 0) {
    return (
      <div className="py-16 text-center text-gray-400">
        <Wifi className="mx-auto mb-3 h-12 w-12 opacity-30" />
        <p className="font-medium">Nenhum wallpaper gerado ainda.</p>
        <p className="mt-1 text-sm">Acesse a aba &ldquo;Gerar&rdquo; para criar o primeiro.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {allItems.map(item => (
          <WallpaperCard
            key={item.id}
            item={item}
            onEdit={() => setEditing(item)}
            onDelete={() => deleteMutation.mutate(item.id)}
            deleting={deleteMutation.isPending && deleteMutation.variables === item.id}
          />
        ))}
      </div>

      {editing && <WallpaperEditDialog wallpaper={editing} onClose={() => setEditing(null)} />}

      {hasNextPage && (
        <div className="text-center">
          <Button variant="outline" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
            {isFetchingNextPage ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
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

function WallpaperCard({
  item,
  onEdit,
  onDelete,
  deleting,
}: {
  item: WallpaperDto
  onEdit: () => void
  onDelete: () => void
  deleting: boolean
}) {
  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = `/api/wallpapers/${item.id}/download`
    link.click()
  }

  return (
    <div className="group overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={wallpaperImageUrl(item)}
          alt={item.location}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      </div>

      {/* Info */}
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 font-semibold text-[#003366] text-sm leading-tight">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{item.location}</span>
            </p>
            <p className="mt-0.5 text-gray-400 text-xs">{item.templateName}</p>
          </div>
          <Badge variant="secondary">{item.wifiSecurity}</Badge>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-gray-600 text-xs">
            <Wifi className="h-3.5 w-3.5 text-[#003366]" />
            <span className="truncate font-medium">{item.wifiSsid}</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-400 text-xs">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formatDate(item.createdAt)}</span>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <Button size="sm" variant="outline" className="flex-1" onClick={handleDownload}>
            <Download className="h-3.5 w-3.5" />
            Baixar
          </Button>
          <Button size="sm" variant="outline" onClick={onEdit} aria-label="Editar wallpaper">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="destructive" onClick={onDelete} disabled={deleting}>
            {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>
    </div>
  )
}

function HistorySkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-gray-100 bg-white">
          <Skeleton className="aspect-video" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}
