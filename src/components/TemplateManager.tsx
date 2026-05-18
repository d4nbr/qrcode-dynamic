'use client'

import { useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Upload, Trash2, ToggleLeft, ToggleRight, Loader2, ImageIcon, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate, proxyImageUrl } from '@/lib/utils'
import type { TemplateDto } from '@/lib/types'

export function TemplateManager() {
  const queryClient = useQueryClient()

  const { data: templates = [], isLoading } = useQuery<TemplateDto[]>({
    queryKey: ['templates', 'all'],
    queryFn: async () => {
      const res = await fetch('/api/templates')
      if (!res.ok) throw new Error('Erro ao carregar templates')
      return res.json()
    },
  })

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch(`/api/templates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      })
      if (!res.ok) throw new Error('Erro ao atualizar')
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templates'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Erro ao excluir')
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templates'] }),
    onError: (err: Error) => alert(err.message),
  })

  return (
    <div className="space-y-8">
      <TemplateUploadZone />

      <div>
        <h3 className="mb-4 font-semibold text-[#003366] text-lg">Templates Cadastrados ({templates.length})</h3>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-xl border bg-white">
                <Skeleton className="aspect-video" />
                <div className="space-y-2 p-4">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : templates.length === 0 ? (
          <div className="rounded-xl border border-gray-200 border-dashed bg-white py-16 text-center text-gray-400">
            <ImageIcon className="mx-auto mb-3 h-12 w-12 opacity-30" />
            <p className="font-medium">Nenhum template cadastrado</p>
            <p className="mt-1 text-sm">Faça upload de uma imagem 1920×1080 acima.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map(t => (
              <TemplateCard
                key={t.id}
                template={t}
                onToggle={isActive => toggleMutation.mutate({ id: t.id, isActive })}
                onDelete={() => deleteMutation.mutate(t.id)}
                toggling={toggleMutation.isPending && (toggleMutation.variables as { id: string })?.id === t.id}
                deleting={deleteMutation.isPending && deleteMutation.variables === t.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function TemplateUploadZone() {
  const queryClient = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [success, setSuccess] = useState(false)

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile || !name.trim()) throw new Error('Nome e arquivo obrigatórios.')
      const form = new FormData()
      form.append('file', selectedFile)
      form.append('name', name.trim())
      if (description.trim()) form.append('description', description.trim())
      const res = await fetch('/api/templates', { method: 'POST', body: form })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Erro ao enviar')
      }
      return res.json()
    },
    onSuccess: () => {
      setSelectedFile(null)
      setPreview(null)
      setName('')
      setDescription('')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
  })

  const handleFile = (file: File) => {
    setSelectedFile(file)
    setPreview(URL.createObjectURL(file))
    setSuccess(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
      <h3 className="mb-6 font-semibold text-[#003366] text-lg">Upload de Template</h3>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Drop zone */}
        <div
          className={`flex aspect-video cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition-colors ${
            dragOver ? 'border-[#003366] bg-[#003366]/5' : 'border-gray-300 bg-gray-50 hover:border-[#003366]/50'
          }`}
          onDragOver={e => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="preview" className="h-full w-full rounded-xl object-cover" />
          ) : (
            <>
              <Upload className="h-10 w-10 text-gray-400" />
              <div className="text-center">
                <p className="font-medium text-gray-600 text-sm">Arraste ou clique para selecionar</p>
                <p className="mt-1 text-gray-400 text-xs">PNG, JPG ou WebP · Max 10MB · 1920×1080px</p>
              </div>
            </>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={e => {
              const f = e.target.files?.[0]
              if (f) handleFile(f)
            }}
          />
        </div>

        {/* Fields */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tplName">Nome do Template *</Label>
            <Input id="tplName" placeholder="Ex: Sede São Luís" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tplDesc">Descrição (opcional)</Label>
            <Input
              id="tplDesc"
              placeholder="Descreva o template..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          {uploadMutation.isError && <p className="text-red-500 text-sm">{uploadMutation.error.message}</p>}
          {success && (
            <div className="flex items-center gap-2 text-emerald-600 text-sm">
              <CheckCircle2 className="h-4 w-4" />
              Template enviado com sucesso!
            </div>
          )}

          <Button
            className="w-full"
            disabled={!selectedFile || !name.trim() || uploadMutation.isPending}
            onClick={() => uploadMutation.mutate()}
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Enviar Template
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

function TemplateCard({
  template,
  onToggle,
  onDelete,
  toggling,
  deleting,
}: {
  template: TemplateDto
  onToggle: (v: boolean) => void
  onDelete: () => void
  toggling: boolean
  deleting: boolean
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="relative aspect-video bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={proxyImageUrl(template.publicUrl)} alt={template.name} className="h-full w-full object-cover" loading="lazy" />
        <div className="absolute top-2 right-2">
          <Badge variant={template.isActive ? 'success' : 'secondary'}>{template.isActive ? 'Ativo' : 'Inativo'}</Badge>
        </div>
      </div>
      <div className="p-4">
        <p className="font-semibold text-[#003366] text-sm">{template.name}</p>
        {template.description && <p className="mt-0.5 truncate text-gray-400 text-xs">{template.description}</p>}
        <p className="mt-1 text-gray-400 text-xs">{formatDate(template.createdAt)}</p>

        <div className="mt-3 flex gap-2">
          <Button size="sm" variant="outline" className="flex-1" disabled={toggling} onClick={() => onToggle(!template.isActive)}>
            {toggling ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : template.isActive ? (
              <>
                <ToggleRight className="h-3.5 w-3.5" />
                Desativar
              </>
            ) : (
              <>
                <ToggleLeft className="h-3.5 w-3.5" />
                Ativar
              </>
            )}
          </Button>
          <Button size="sm" variant="destructive" disabled={deleting} onClick={onDelete}>
            {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>
    </div>
  )
}
