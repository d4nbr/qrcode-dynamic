'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Download, Eye, EyeOff, RefreshCw, Wifi } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { WallpaperPreview } from '@/components/WallpaperPreview'
import type { TemplateDto, WallpaperDto } from '@/lib/types'
import { type GenerateWallpaperInput, generateWallpaperSchema } from '@/lib/validations'

export function WallpaperGenerator() {
  const queryClient = useQueryClient()
  const [showPassword, setShowPassword] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [generatedWallpaper, setGeneratedWallpaper] = useState<WallpaperDto | null>(null)

  const { data: templates = [], isLoading: loadingTemplates } = useQuery<TemplateDto[]>({
    queryKey: ['templates', 'active'],
    queryFn: async () => {
      const res = await fetch('/api/templates')
      if (!res.ok) throw new Error('Erro ao carregar templates')
      const all: TemplateDto[] = await res.json()
      return all.filter(t => t.isActive)
    },
  })

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<GenerateWallpaperInput>({
    resolver: zodResolver(generateWallpaperSchema),
    mode: 'onChange',
    defaultValues: { wifiSecurity: 'WPA' },
  })

  const [templateId, wifiSsid, wifiPassword, wifiSecurity] = watch(['templateId', 'wifiSsid', 'wifiPassword', 'wifiSecurity'])

  const buildPreviewUrl = useCallback(() => {
    if (!templateId || !wifiSsid) return null
    const params = new URLSearchParams({
      templateId,
      ssid: wifiSsid,
      password: wifiPassword ?? '',
      security: wifiSecurity ?? 'WPA',
    })
    return `/api/wallpapers/preview?${params.toString()}`
  }, [templateId, wifiSsid, wifiPassword, wifiSecurity])

  useEffect(() => {
    const timer = setTimeout(() => {
      setPreviewUrl(buildPreviewUrl())
      setGeneratedWallpaper(null)
    }, 700)
    return () => clearTimeout(timer)
  }, [buildPreviewUrl])

  const generateMutation = useMutation({
    mutationFn: async (data: GenerateWallpaperInput) => {
      const res = await fetch('/api/wallpapers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Erro ao gerar wallpaper')
      }
      return res.json() as Promise<WallpaperDto>
    },
    onSuccess: wallpaper => {
      setGeneratedWallpaper(wallpaper)
      queryClient.invalidateQueries({ queryKey: ['wallpapers'] })
    },
  })

  const onSubmit = (data: GenerateWallpaperInput) => {
    generateMutation.mutate(data)
  }

  const handleDownload = () => {
    if (!generatedWallpaper) return
    const link = document.createElement('a')
    link.href = `/api/wallpapers/${generatedWallpaper.id}/download`
    link.click()
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      {/* Form panel */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[#003366]">Gerar Wallpaper</h2>
          <p className="text-sm text-gray-500 mt-1">Preencha os dados para criar o papel de parede institucional.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Template */}
          <div className="space-y-2">
            <Label htmlFor="templateId">Template Institucional</Label>
            <Select id="templateId" disabled={loadingTemplates} {...register('templateId')}>
              <option value="">{loadingTemplates ? 'Carregando...' : 'Selecione um template'}</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
            {errors.templateId && <p className="text-xs text-red-500">{errors.templateId.message}</p>}
            {!loadingTemplates && templates.length === 0 && (
              <p className="text-xs text-amber-600">Nenhum template ativo. Cadastre um no painel Admin.</p>
            )}
          </div>

          {/* Wi-Fi */}
          <div className="space-y-2">
            <Label htmlFor="wifiSsid">
              <Wifi className="inline w-4 h-4 mr-1 mb-0.5" />
              Nome da Rede Wi-Fi (SSID)
            </Label>
            <Input id="wifiSsid" placeholder="Ex: OAB-CENTRAL-2GHz" {...register('wifiSsid')} />
            {errors.wifiSsid && <p className="text-xs text-red-500">{errors.wifiSsid.message}</p>}
          </div>

          {/* Security */}
          <div className="space-y-2">
            <Label htmlFor="wifiSecurity">Tipo de Segurança</Label>
            <Select id="wifiSecurity" {...register('wifiSecurity')}>
              <option value="WPA">WPA / WPA2 (recomendado)</option>
              <option value="WEP">WEP</option>
              <option value="nopass">Aberta (sem senha)</option>
            </Select>
          </div>

          {/* Password */}
          {wifiSecurity !== 'nopass' && (
            <div className="space-y-2">
              <Label htmlFor="wifiPassword">Senha do Wi-Fi</Label>
              <div className="relative">
                <Input
                  id="wifiPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  className="pr-10"
                  {...register('wifiPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.wifiPassword && <p className="text-xs text-red-500">{errors.wifiPassword.message}</p>}
            </div>
          )}

          {/* Error */}
          {generateMutation.isError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {generateMutation.error.message}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1" disabled={!isValid || generateMutation.isPending}>
              {generateMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Gerar Wallpaper
                </>
              )}
            </Button>

            {generatedWallpaper && (
              <Button type="button" variant="gold" onClick={handleDownload} className="flex-1">
                <Download className="w-4 h-4" />
                Baixar PNG
              </Button>
            )}
          </div>

          {generatedWallpaper && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
              ✓ Wallpaper gerado com sucesso! Clique em &ldquo;Baixar PNG&rdquo; para salvar.
            </div>
          )}
        </form>
      </div>

      {/* Preview panel */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#003366]">Preview</h2>
          <p className="text-sm text-gray-500 mt-1">Visualização em tempo real do wallpaper gerado.</p>
        </div>
        <WallpaperPreview previewUrl={previewUrl} savedUrl={generatedWallpaper?.publicUrl ?? null} />
      </div>
    </div>
  )
}
