import type { QrPlacement } from '@/lib/qr-placement'

export type WifiSecurity = 'WPA' | 'WEP' | 'nopass'

export type TemplateDto = {
  id: string
  name: string
  description: string | null
  publicUrl: string
  isActive: boolean
  // Posição padrão do cartão do QR; null = posição legada.
  qrLeft: number | null
  qrTop: number | null
  qrSize: number | null
  createdAt: string
}

export type WallpaperDto = {
  id: string
  location: string
  wifiSsid: string
  wifiPassword: string
  wifiSecurity: string
  publicUrl: string
  storedPath: string
  templateId: string
  templateName: string
  // Posição efetiva do cartão: a gravada ou, se vazia, a legada.
  qrLeft: number
  qrTop: number
  qrSize: number
  createdAt: string
}

export type GenerateWallpaperInput = {
  templateId: string
  location: string
  wifiSsid: string
  wifiPassword: string
  wifiSecurity: WifiSecurity
  qrLeft?: number
  qrTop?: number
  qrSize?: number
}

export type UpdateWallpaperInput = {
  templateId?: string
  location?: string
  wifiSsid?: string
  wifiPassword?: string
  wifiSecurity?: WifiSecurity
  qrLeft?: number
  qrTop?: number
  qrSize?: number
}

export type UpdateTemplateInput = {
  isActive?: boolean
  qrLeft?: number
  qrTop?: number
  qrSize?: number
}

export type QrCardContent = {
  wifiSsid: string
  wifiPassword: string
  wifiSecurity: WifiSecurity
}

export type GenerateImageParams = QrCardContent & {
  templateBuffer: Buffer
  placement: QrPlacement
}

export type ApiError = {
  error: string
}

export type PaginatedWallpapers = {
  items: WallpaperDto[]
  nextCursor: string | null
}
