import { z } from 'zod'

export const generateWallpaperSchema = z.object({
  templateId: z.string().min(1, 'Selecione um template.'),
  comarcaName: z.string().max(80, 'Nome muito longo (máx. 80 caracteres).').optional().default(''),
  wifiSsid: z.string().min(1, 'Informe o nome da rede Wi-Fi.').max(32, 'SSID deve ter no máximo 32 caracteres.'),
  wifiPassword: z.string().max(63, 'Senha deve ter no máximo 63 caracteres.'),
  wifiSecurity: z.enum(['WPA', 'WEP', 'nopass']).default('WPA'),
})

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
export type PreviewQuery = z.infer<typeof previewQuerySchema>
export type UploadTemplateInput = z.infer<typeof uploadTemplateSchema>
