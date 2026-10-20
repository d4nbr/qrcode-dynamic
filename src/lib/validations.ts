import { z } from 'zod'
import { OUTPUT_HEIGHT, OUTPUT_WIDTH, QR_SIZE_MAX, QR_SIZE_MIN } from '@/lib/qr-placement'

const location = z.string().trim().min(1, 'Informe a localização.').max(80, 'Localização muito longa (máx. 80 caracteres).')
const wifiSsid = z.string().min(1, 'Informe o nome da rede Wi-Fi.').max(32, 'SSID deve ter no máximo 32 caracteres.')
const wifiPassword = z.string().max(63, 'Senha deve ter no máximo 63 caracteres.')
const wifiSecurity = z.enum(['WPA', 'WEP', 'nopass'])

// Posição do cartão do QR em px da imagem 1920×1080. O servidor ainda encaixa
// o cartão na imagem; aqui só se rejeita o que não faz sentido.
const placementFields = {
  qrLeft: z
    .number()
    .int('Posição do QR inválida.')
    .min(0, 'Posição do QR inválida.')
    .max(OUTPUT_WIDTH, 'Posição do QR inválida.')
    .optional(),
  qrTop: z
    .number()
    .int('Posição do QR inválida.')
    .min(0, 'Posição do QR inválida.')
    .max(OUTPUT_HEIGHT, 'Posição do QR inválida.')
    .optional(),
  qrSize: z
    .number()
    .int('Tamanho do QR inválido.')
    .min(QR_SIZE_MIN, `O QR deve ter no mínimo ${QR_SIZE_MIN} px.`)
    .max(QR_SIZE_MAX, `O QR deve ter no máximo ${QR_SIZE_MAX} px.`)
    .optional(),
}

// Posição e tamanho só valem juntos: metade de uma posição não tem significado.
function placementComplete(data: { qrLeft?: number; qrTop?: number; qrSize?: number }): boolean {
  const informed = [data.qrLeft, data.qrTop, data.qrSize].filter(value => value !== undefined).length
  return informed === 0 || informed === 3
}
const placementCompleteError = { message: 'Informe posição e tamanho do QR juntos.', path: ['qrSize'] }

export const generateWallpaperSchema = z
  .object({
    templateId: z.string().min(1, 'Selecione um template.'),
    location,
    wifiSsid,
    wifiPassword,
    wifiSecurity: wifiSecurity.default('WPA'),
    ...placementFields,
  })
  .refine(placementComplete, placementCompleteError)

// Edição no histórico: mesmas regras da geração, todos os campos opcionais e
// sem defaults, para que campo ausente signifique "não muda". Derivar com
// .partial() não serve: o Zod 4 aplica o default de wifiSecurity mesmo assim.
export const updateWallpaperSchema = z
  .object({
    templateId: z.string().min(1, 'Selecione um template.').optional(),
    location: location.optional(),
    wifiSsid: wifiSsid.optional(),
    wifiPassword: wifiPassword.optional(),
    wifiSecurity: wifiSecurity.optional(),
    ...placementFields,
  })
  .refine(data => Object.keys(data).length > 0, 'Nenhum campo para atualizar.')
  .refine(placementComplete, placementCompleteError)

// Corpo estrito: um campo inesperado é erro, não é ignorado em silêncio.
export const updateTemplateSchema = z
  .strictObject(
    {
      isActive: z.boolean('isActive deve ser verdadeiro ou falso.').optional(),
      ...placementFields,
    },
    { error: issue => (issue.code === 'unrecognized_keys' ? 'Campo não permitido na atualização do template.' : undefined) }
  )
  .refine(data => Object.keys(data).length > 0, 'Nenhum campo para atualizar.')
  .refine(placementComplete, placementCompleteError)

export const qrCardSchema = z.object({
  wifiSsid,
  wifiPassword: wifiPassword.default(''),
  wifiSecurity: wifiSecurity.default('WPA'),
})

export const uploadTemplateSchema = z.object({
  name: z.string().min(3, 'Nome muito curto (mín. 3 caracteres).').max(100),
  description: z.string().max(300).optional(),
})

export type GenerateWallpaperFormInput = z.input<typeof generateWallpaperSchema>
export type GenerateWallpaperInput = z.output<typeof generateWallpaperSchema>
export type UpdateWallpaperInput = z.output<typeof updateWallpaperSchema>
export type UpdateTemplateInput = z.output<typeof updateTemplateSchema>
export type QrCardInput = z.output<typeof qrCardSchema>
export type UploadTemplateInput = z.infer<typeof uploadTemplateSchema>
