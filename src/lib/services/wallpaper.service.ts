import path from 'node:path'
import { templateRepository } from '@/lib/repositories/template.repository'
import { wallpaperRepository } from '@/lib/repositories/wallpaper.repository'
import { generateWallpaper } from '@/lib/services/image-generator'
import { deleteFileIfExists, ensureDirs, saveBuffer, toPublicUrl, wallpapersDir } from '@/lib/storage'
import type { GenerateWallpaperInput, PaginatedWallpapers, WallpaperDto } from '@/lib/types'
import { buildQrString } from '@/lib/utils'

function toDto(w: {
  id: string
  comarcaName: string
  wifiSsid: string
  wifiPassword: string
  wifiSecurity: string
  publicUrl: string
  storedPath: string
  templateId: string
  createdAt: Date
  template: { name: string }
}): WallpaperDto {
  return {
    id: w.id,
    comarcaName: w.comarcaName,
    wifiSsid: w.wifiSsid,
    wifiPassword: w.wifiPassword,
    wifiSecurity: w.wifiSecurity,
    publicUrl: w.publicUrl,
    storedPath: w.storedPath,
    templateId: w.templateId,
    templateName: w.template.name,
    createdAt: w.createdAt.toISOString(),
  }
}

export const wallpaperService = {
  async list(cursor?: string, limit = 20): Promise<PaginatedWallpapers> {
    const items = await wallpaperRepository.findMany(cursor, limit)
    const hasNext = items.length > limit
    const slice = hasNext ? items.slice(0, limit) : items
    return {
      items: slice.map(toDto),
      nextCursor: hasNext ? slice[slice.length - 1].id : null,
    }
  },

  async preview(
    templateId: string,
    wifiSsid: string,
    wifiPassword: string,
    wifiSecurity: 'WPA' | 'WEP' | 'nopass'
  ): Promise<Buffer> {
    const template = await templateRepository.findById(templateId)
    if (!template) throw new Error('Template não encontrado.')
    if (!template.isActive) throw new Error('Template inativo.')

    return generateWallpaper({
      templatePath: template.storedPath,
      wifiSsid,
      wifiPassword,
      wifiSecurity,
    })
  },

  async generate(input: GenerateWallpaperInput): Promise<WallpaperDto> {
    const template = await templateRepository.findById(input.templateId)
    if (!template) throw new Error('Template não encontrado.')
    if (!template.isActive) throw new Error('Template inativo.')

    const qrContent = buildQrString(input.wifiSsid, input.wifiPassword, input.wifiSecurity)

    const buffer = await generateWallpaper({
      templatePath: template.storedPath,
      wifiSsid: input.wifiSsid,
      wifiPassword: input.wifiPassword,
      wifiSecurity: input.wifiSecurity,
    })

    ensureDirs()

    const filename = `${Date.now()}.png`
    const storedPath = path.join(wallpapersDir, filename)
    saveBuffer(storedPath, buffer)

    const wallpaper = await wallpaperRepository.create({
      comarcaName: input.comarcaName,
      wifiSsid: input.wifiSsid,
      wifiPassword: input.wifiPassword,
      wifiSecurity: input.wifiSecurity,
      qrContent,
      storedPath,
      publicUrl: toPublicUrl(storedPath),
      templateId: input.templateId,
    })

    return toDto({ ...wallpaper, template: { name: template.name } })
  },

  async delete(id: string): Promise<void> {
    const wallpaper = await wallpaperRepository.findById(id)
    if (!wallpaper) throw new Error('Wallpaper não encontrado.')
    await wallpaperRepository.delete(id)
    deleteFileIfExists(wallpaper.storedPath)
  },

  async getById(id: string): Promise<WallpaperDto | null> {
    const w = await wallpaperRepository.findById(id)
    return w ? toDto(w) : null
  },
}
