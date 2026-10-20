'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye, EyeOff, LayoutTemplate, Loader2, MapPin, Save, Wifi, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { QrCardPositioner, SAMPLE_CARD_CONTENT, useQrCardImage } from '@/components/QrCardPositioner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { fitPlacement, type QrPlacement, storedPlacement } from '@/lib/qr-placement'
import type { QrCardContent, TemplateDto, WallpaperDto, WifiSecurity } from '@/lib/types'
import { templateImageUrl } from '@/lib/utils'
import { type GenerateWallpaperFormInput, type GenerateWallpaperInput, generateWallpaperSchema } from '@/lib/validations'

type Props = {
  wallpaper: WallpaperDto
  onClose: () => void
}

export function WallpaperEditDialog({ wallpaper, onClose }: Props) {
  const queryClient = useQueryClient()
  const [showPassword, setShowPassword] = useState(false)

  // Lista completa: a arte de fundo da prévia precisa existir mesmo quando o
  // template do wallpaper foi desativado depois da geração.
  const { data: allTemplates = [], isLoading: loadingTemplates } = useQuery<TemplateDto[]>({
    queryKey: ['templates', 'all'],
    queryFn: async () => {
      const res = await fetch('/api/templates')
      if (!res.ok) throw new Error('Erro ao carregar templates')
      return res.json()
    },
  })
  const templates = allTemplates.filter(t => t.isActive)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors, isValid, isDirty },
  } = useForm<GenerateWallpaperFormInput, unknown, GenerateWallpaperInput>({
    resolver: zodResolver(generateWallpaperSchema),
    mode: 'onChange',
    defaultValues: {
      templateId: wallpaper.templateId,
      location: wallpaper.location,
      wifiSsid: wallpaper.wifiSsid,
      wifiPassword: wallpaper.wifiPassword,
      wifiSecurity: wallpaper.wifiSecurity as WifiSecurity,
      qrLeft: wallpaper.qrLeft,
      qrTop: wallpaper.qrTop,
      qrSize: wallpaper.qrSize,
    },
  })

  const [templateId, wifiSsid, wifiPassword, wifiSecurity, qrLeft, qrTop, qrSize] = watch([
    'templateId',
    'wifiSsid',
    'wifiPassword',
    'wifiSecurity',
    'qrLeft',
    'qrTop',
    'qrSize',
  ])

  const selectedTemplate = allTemplates.find(t => t.id === templateId) ?? null
  const security = wifiSecurity ?? 'WPA'
  const placement = fitPlacement(
    { qrLeft: qrLeft ?? wallpaper.qrLeft, qrTop: qrTop ?? wallpaper.qrTop, qrSize: qrSize ?? wallpaper.qrSize },
    security !== 'nopass'
  )

  const cardContent: QrCardContent = wifiSsid
    ? { wifiSsid, wifiPassword: security === 'nopass' ? '' : (wifiPassword ?? ''), wifiSecurity: security }
    : { ...SAMPLE_CARD_CONTENT, wifiSecurity: security }
  const card = useQrCardImage(cardContent)

  const setPlacement = useCallback(
    (next: QrPlacement) => {
      setValue('qrLeft', next.qrLeft, { shouldDirty: true })
      setValue('qrTop', next.qrTop, { shouldDirty: true })
      setValue('qrSize', next.qrSize, { shouldDirty: true })
    },
    [setValue]
  )

  // As opções do select chegam depois do registro do campo, e o navegador então
  // seleciona a primeira. Reaplicar o valor mantém o select, a arte de fundo e o
  // formulário apontando para o mesmo template.
  useEffect(() => {
    if (!loadingTemplates) setValue('templateId', getValues('templateId'))
  }, [loadingTemplates, setValue, getValues])

  // Trocar de template leva o cartão ao padrão da nova arte. Abrir o diálogo
  // não conta como troca: a edição começa na posição atual do wallpaper.
  const previousTemplateId = useRef(wallpaper.templateId)
  useEffect(() => {
    if (!selectedTemplate || previousTemplateId.current === selectedTemplate.id) return
    previousTemplateId.current = selectedTemplate.id
    setPlacement(storedPlacement(selectedTemplate))
  }, [selectedTemplate, setPlacement])

  const updateMutation = useMutation({
    mutationFn: async (data: GenerateWallpaperInput) => {
      const res = await fetch(`/api/wallpapers/${wallpaper.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Erro ao salvar alterações')
      }
      return res.json() as Promise<WallpaperDto>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallpapers'] })
      onClose()
    },
  })

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !updateMutation.isPending) onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, updateMutation.isPending])

  // O template atual pode ter sido desativado depois da geração. Sem esta opção
  // extra o select abriria em branco e o usuário perderia o vínculo sem querer.
  const currentTemplateMissing = !loadingTemplates && !templates.some(t => t.id === wallpaper.templateId)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-dialog-title"
        className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 id="edit-dialog-title" className="font-bold text-[#003366] text-xl">
              Editar Wallpaper
            </h2>
            <p className="mt-1 text-gray-500 text-sm">
              Alterar rede, senha, segurança, template ou a posição do QR regera a imagem.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={updateMutation.isPending}
            aria-label="Fechar"
            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit(data => updateMutation.mutate({ ...data, ...placement }))}
          className="grid grid-cols-1 gap-6 lg:grid-cols-2"
        >
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="edit-location">
                <MapPin className="mr-1 mb-0.5 inline h-4 w-4" />
                Localização
              </Label>
              <Input id="edit-location" placeholder="Ex: Sede São Luís — Sala de Atendimento" {...register('location')} />
              {errors.location && <p className="text-red-500 text-xs">{errors.location.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-templateId">Template Institucional</Label>
              <Select id="edit-templateId" disabled={loadingTemplates} {...register('templateId')}>
                {currentTemplateMissing && <option value={wallpaper.templateId}>{wallpaper.templateName} (inativo)</option>}
                {templates.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
              {errors.templateId && <p className="text-red-500 text-xs">{errors.templateId.message}</p>}
              {currentTemplateMissing && (
                <p className="text-amber-600 text-xs">
                  O template original foi desativado. Salvar mantendo-o não é possível — escolha um template ativo.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-wifiSsid">
                <Wifi className="mr-1 mb-0.5 inline h-4 w-4" />
                Nome da Rede Wi-Fi (SSID)
              </Label>
              <Input id="edit-wifiSsid" placeholder="Ex: OAB-CENTRAL-2GHz" {...register('wifiSsid')} />
              {errors.wifiSsid && <p className="text-red-500 text-xs">{errors.wifiSsid.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-wifiSecurity">Tipo de Segurança</Label>
              <Select id="edit-wifiSecurity" {...register('wifiSecurity')}>
                <option value="WPA">WPA / WPA2 (recomendado)</option>
                <option value="WEP">WEP</option>
                <option value="nopass">Aberta (sem senha)</option>
              </Select>
            </div>

            {wifiSecurity !== 'nopass' && (
              <div className="space-y-2">
                <Label htmlFor="edit-wifiPassword">Senha do Wi-Fi</Label>
                <div className="relative">
                  <Input
                    id="edit-wifiPassword"
                    type={showPassword ? 'text' : 'password'}
                    className="pr-10"
                    {...register('wifiPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.wifiPassword && <p className="text-red-500 text-xs">{errors.wifiPassword.message}</p>}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium text-gray-700 text-sm">Posição do QR</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!selectedTemplate}
                onClick={() => selectedTemplate && setPlacement(storedPlacement(selectedTemplate))}
              >
                <LayoutTemplate className="h-3.5 w-3.5" />
                Usar padrão do template
              </Button>
            </div>
            <QrCardPositioner
              backgroundUrl={selectedTemplate ? templateImageUrl(selectedTemplate.id) : null}
              cardUrl={card.url}
              cardError={card.error}
              placement={placement}
              hasPassword={security !== 'nopass'}
              onChange={setPlacement}
            />
          </div>

          <div className="space-y-4 lg:col-span-2">
            {updateMutation.isError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">
                {updateMutation.error.message}
              </div>
            )}

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onClose} disabled={updateMutation.isPending} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" disabled={!isValid || !isDirty || updateMutation.isPending} className="flex-1">
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Salvar
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
