export type WifiSecurity = 'WPA' | 'WEP' | 'nopass'

export type TemplateDto = {
  id: string
  name: string
  description: string | null
  publicUrl: string
  isActive: boolean
  createdAt: string
}

export type WallpaperDto = {
  id: string
  comarcaName: string
  wifiSsid: string
  wifiPassword: string
  wifiSecurity: string
  publicUrl: string
  storedPath: string
  templateId: string
  templateName: string
  createdAt: string
}

export type GenerateWallpaperInput = {
  templateId: string
  comarcaName: string
  wifiSsid: string
  wifiPassword: string
  wifiSecurity: WifiSecurity
}

export type GenerateImageParams = {
  templateBuffer: Buffer
  wifiSsid: string
  wifiPassword: string
  wifiSecurity: WifiSecurity
}

export type ApiError = {
  error: string
}

export type PaginatedWallpapers = {
  items: WallpaperDto[]
  nextCursor: string | null
}
