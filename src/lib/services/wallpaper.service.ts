import { templateRepository } from '@/lib/repositories/template.repository'
import { wallpaperRepository } from '@/lib/repositories/wallpaper.repository'
import { generateWallpaper } from '@/lib/services/image-generator'
import { deleteFile, downloadFile, uploadFile } from '@/lib/storage'
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

    const templateBuffer = await downloadFile(template.storedPath)

    return generateWallpaper({ templateBuffer, wifiSsid, wifiPassword, wifiSecurity })
  },

  async generate(input: GenerateWallpaperInput): Promise<WallpaperDto> {
    const template = await templateRepository.findById(input.templateId)
    if (!template) throw new Error('Template não encontrado.')
    if (!template.isActive) throw new Error('Template inativo.')

    const qrContent = buildQrString(input.wifiSsid, input.wifiPassword, input.wifiSecurity)

    const templateBuffer = await downloadFile(template.storedPath)

    const buffer = await generateWallpaper({
      templateBuffer,
      wifiSsid: input.wifiSsid,
      wifiPassword: input.wifiPassword,
      wifiSecurity: input.wifiSecurity,
    })

    const storagePath = `wallpapers/${Date.now()}.png`
    const publicUrl = await uploadFile(storagePath, buffer)

    const wallpaper = await wallpaperRepository.create({
      comarcaName: input.comarcaName,
      wifiSsid: input.wifiSsid,
      wifiPassword: input.wifiPassword,
      wifiSecurity: input.wifiSecurity,
      qrContent,
      storedPath: storagePath,
      publicUrl,
      templateId: input.templateId,
    })

    return toDto({ ...wallpaper, template: { name: template.name } })
  },

  async delete(id: string): Promise<void> {
    const wallpaper = await wallpaperRepository.findById(id)
    if (!wallpaper) throw new Error('Wallpaper não encontrado.')
    await wallpaperRepository.delete(id)
    await deleteFile(wallpaper.storedPath)
  },

  async getById(id: string): Promise<WallpaperDto | null> {
    const w = await wallpaperRepository.findById(id)
    return w ? toDto(w) : null
  },
}
