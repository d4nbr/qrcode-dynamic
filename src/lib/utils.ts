import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

export function buildDownloadFilename(location: string): string {
  const slug = sanitizeFilename(location)
  return slug ? `oabma-${slug}-wifi.png` : 'oabma-wallpaper-wifi.png'
}

export function escapeWifiField(value: string): string {
  return value.replace(/[\\;,"]/g, char => `\\${char}`)
}

export function buildQrString(ssid: string, password: string, security: string): string {
  if (security === 'nopass') {
    return `WIFI:T:nopass;S:${escapeWifiField(ssid)};;`
  }
  return `WIFI:T:${security};S:${escapeWifiField(ssid)};P:${escapeWifiField(password)};;`
}

// O bucket é privado: as imagens chegam ao navegador pelas rotas do app.
export function templateImageUrl(templateId: string): string {
  return `/api/templates/${templateId}/image`
}

// O caminho do objeto muda quando o wallpaper é regerado; levá-lo na URL faz
// o navegador buscar a imagem nova em vez de reaproveitar a do cache.
export function wallpaperImageUrl(wallpaper: { id: string; storedPath: string }): string {
  return `/api/wallpapers/${wallpaper.id}/image?v=${encodeURIComponent(wallpaper.storedPath)}`
}
