import { z } from 'zod'

export const generateWallpaperSchema = z.object({
  templateId: z.string().min(1, 'Selecione um template.'),
  location: z
    .string()
    .trim()
    .min(1, 'Informe a localização.')
    .max(80, 'Localização muito longa (máx. 80 caracteres).'),
  wifiSsid: z.string().min(1, 'Informe o nome da rede Wi-Fi.').max(32, 'SSID deve ter no máximo 32 caracteres.'),
  wifiPassword: z.string().max(63, 'Senha deve ter no máximo 63 caracteres.'),
  wifiSecurity: z.enum(['WPA', 'WEP', 'nopass']).default('WPA'),
})

// Edição no histórico: mesmos campos e mesmas regras, todos opcionais.
export const updateWallpaperSchema = generateWallpaperSchema
  .partial()
  .refine(data => Object.keys(data).length > 0, 'Nenhum campo para atualizar.')

export const previewQuerySchema = z.object({
  templateId: z.string().min(1),
  ssid: z.string().min(1).max(32),
  password: z.string().max(63).default(''),
  security: z.enum(['WPA', 'WEP', 'nopass']).default('WPA'),
})

export const uploadTemplateSchema = z.object({
  name: z.string().min(3, 'Nome muito curto (mín. 3 caracteres).').max(100),
  description: z.string().max(300).optional(),
})

export type GenerateWallpaperFormInput = z.input<typeof generateWallpaperSchema>
export type GenerateWallpaperInput = z.output<typeof generateWallpaperSchema>
export type UpdateWallpaperFormInput = z.input<typeof updateWallpaperSchema>
export type UpdateWallpaperInput = z.output<typeof updateWallpaperSchema>
export type PreviewQuery = z.infer<typeof previewQuerySchema>
export type UploadTemplateInput = z.infer<typeof uploadTemplateSchema>
