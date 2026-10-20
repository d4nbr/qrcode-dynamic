'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, RotateCcw, Save, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { QrCardPositioner, SAMPLE_CARD_CONTENT, useQrCardImage } from '@/components/QrCardPositioner'
import { Button } from '@/components/ui/button'
import { LEGACY_PLACEMENT, type QrPlacement, samePlacement, storedPlacement } from '@/lib/qr-placement'
import type { TemplateDto } from '@/lib/types'

type Props = {
  template: TemplateDto
  onClose: () => void
}

// Posição padrão do cartão do QR para um template, ajustada com dados de exemplo.
export function TemplateQrDialog({ template, onClose }: Props) {
  const queryClient = useQueryClient()
  const initial = storedPlacement(template)
  const [placement, setPlacement] = useState<QrPlacement>(initial)
  const card = useQrCardImage(SAMPLE_CARD_CONTENT)

  const saveMutation = useMutation({
    mutationFn: async (next: QrPlacement) => {
      const res = await fetch(`/api/templates/${template.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Erro ao salvar a posição')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      onClose()
    },
  })

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !saveMutation.isPending) onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, saveMutation.isPending])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="template-qr-dialog-title"
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id="template-qr-dialog-title" className="font-bold text-[#003366] text-xl">
              Posição do QR — {template.name}
            </h2>
            <p className="mt-1 text-gray-500 text-sm">
              A tela Gerar começa nesta posição quando este template é escolhido. Wallpapers já gerados não mudam.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saveMutation.isPending}
            aria-label="Fechar"
            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <QrCardPositioner
          backgroundUrl={template.publicUrl}
          cardUrl={card.url}
          cardError={card.error}
          placement={placement}
          hasPassword={SAMPLE_CARD_CONTENT.wifiSecurity !== 'nopass'}
          onChange={setPlacement}
        />

        {saveMutation.isError && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">
            {saveMutation.error.message}
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setPlacement(LEGACY_PLACEMENT)}
            disabled={saveMutation.isPending || samePlacement(placement, LEGACY_PLACEMENT)}
          >
            <RotateCcw className="h-4 w-4" />
            Restaurar posição original
          </Button>
          <div className="ml-auto flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={saveMutation.isPending}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => saveMutation.mutate(placement)}
              disabled={saveMutation.isPending || samePlacement(placement, initial)}
            >
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
