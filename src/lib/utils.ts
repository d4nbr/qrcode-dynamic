import { clsx, type ClassValue } from 'clsx'
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

export function escapeWifiField(value: string): string {
  return value.replace(/[\\;,"]/g, char => `\\${char}`)
}

export function buildQrString(ssid: string, password: string, security: string): string {
  if (security === 'nopass') {
    return `WIFI:T:nopass;S:${escapeWifiField(ssid)};;`
  }
  return `WIFI:T:${security};S:${escapeWifiField(ssid)};P:${escapeWifiField(password)};;`
}

export function proxyImageUrl(url: string): string {
  if (!url || url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('/')) return url
  try {
    const { protocol } = new URL(url)
    if (protocol === 'http:') return `/api/image-proxy?url=${encodeURIComponent(url)}`
  } catch {}
  return url
}
