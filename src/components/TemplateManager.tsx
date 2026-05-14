'use client'

import { useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Upload, Trash2, ToggleLeft, ToggleRight, Loader2, ImageIcon, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'
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
        <h3 className="text-lg font-semibold text-[#003366] mb-4">Templates Cadastrados ({templates.length})</h3>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border overflow-hidden">
                <Skeleton className="aspect-video" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
            <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Nenhum template cadastrado</p>
            <p className="text-sm mt-1">Faça upload de uma imagem 1920×1080 acima.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
      <h3 className="text-lg font-semibold text-[#003366] mb-6">Upload de Template</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Drop zone */}
        <div
          className={`aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors ${
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
            <img src={preview} alt="preview" className="w-full h-full object-cover rounded-xl" />
          ) : (
            <>
              <Upload className="w-10 h-10 text-gray-400" />
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Arraste ou clique para selecionar</p>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG ou WebP · Max 10MB · 1920×1080px</p>
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

          {uploadMutation.isError && <p className="text-sm text-red-500">{uploadMutation.error.message}</p>}
          {success && (
            <div className="flex items-center gap-2 text-sm text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
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
                <Loader2 className="w-4 h-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
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
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="aspect-video relative bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={template.publicUrl} alt={template.name} className="w-full h-full object-cover" loading="lazy" />
        <div className="absolute top-2 right-2">
          <Badge variant={template.isActive ? 'success' : 'secondary'}>{template.isActive ? 'Ativo' : 'Inativo'}</Badge>
        </div>
      </div>
      <div className="p-4">
        <p className="font-semibold text-[#003366] text-sm">{template.name}</p>
        {template.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{template.description}</p>}
        <p className="text-xs text-gray-400 mt-1">{formatDate(template.createdAt)}</p>

        <div className="flex gap-2 mt-3">
          <Button size="sm" variant="outline" className="flex-1" disabled={toggling} onClick={() => onToggle(!template.isActive)}>
            {toggling ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : template.isActive ? (
              <>
                <ToggleRight className="w-3.5 h-3.5" />
                Desativar
              </>
            ) : (
              <>
                <ToggleLeft className="w-3.5 h-3.5" />
                Ativar
              </>
            )}
          </Button>
          <Button size="sm" variant="destructive" disabled={deleting} onClick={onDelete}>
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>
    </div>
  )
}
