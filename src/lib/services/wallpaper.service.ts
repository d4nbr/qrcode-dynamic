import { randomUUID } from 'node:crypto'
import { fitPlacement, LEGACY_PLACEMENT, type QrPlacement, samePlacement, storedPlacement } from '@/lib/qr-placement'
import { templateRepository } from '@/lib/repositories/template.repository'
import { wallpaperRepository } from '@/lib/repositories/wallpaper.repository'
import { generateWallpaper, renderQrCard } from '@/lib/services/image-generator'
import { deleteFile, downloadFile, loadStoredImage, type StoredImage, uploadFile } from '@/lib/storage'
import type {
  GenerateWallpaperInput,
  PaginatedWallpapers,
  QrCardContent,
  UpdateWallpaperInput,
  WallpaperDto,
  WifiSecurity,
} from '@/lib/types'
import { buildQrString } from '@/lib/utils'

// Caminho único por publicação: evita colisão entre requisições simultâneas e
// garante que a URL nova invalide o cache imutável do proxy de imagem.
function buildStoragePath(): string {
  return `wallpapers/${randomUUID()}.png`
}

async function loadActiveTemplate(templateId: string) {
  const template = await templateRepository.findById(templateId)
  if (!template) throw new Error('Template não encontrado.')
  if (!template.isActive) throw new Error('Template inativo.')
  return template
}

// Os três campos chegam juntos ou não chegam (garantido pelo schema).
function requestedPlacement(input: { qrLeft?: number; qrTop?: number; qrSize?: number }): QrPlacement | null {
  if (input.qrLeft === undefined || input.qrTop === undefined || input.qrSize === undefined) return null
  return { qrLeft: input.qrLeft, qrTop: input.qrTop, qrSize: input.qrSize }
}

function toDto(w: {
  id: string
  location: string
  wifiSsid: string
  wifiPassword: string
  wifiSecurity: string
  publicUrl: string
  storedPath: string
  templateId: string
  qrLeft: number | null
  qrTop: number | null
  qrSize: number | null
  createdAt: Date
  template: { name: string }
}): WallpaperDto {
  return {
    id: w.id,
    location: w.location,
    wifiSsid: w.wifiSsid,
    wifiPassword: w.wifiPassword,
    wifiSecurity: w.wifiSecurity,
    publicUrl: w.publicUrl,
    storedPath: w.storedPath,
    templateId: w.templateId,
    templateName: w.template.name,
    ...storedPlacement(w),
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

  // Cartão do QR para a prévia, no tamanho legado; a tela o escala por CSS.
  // Não lê nada do banco: devolve só o que o próprio chamador enviou.
  renderCard(content: QrCardContent): Promise<Buffer> {
    return renderQrCard(content, LEGACY_PLACEMENT.qrSize)
  },

  async generate(input: GenerateWallpaperInput): Promise<WallpaperDto> {
    const template = await loadActiveTemplate(input.templateId)

    // Posição enviada; senão, o padrão do template; senão, a legada.
    const placement = fitPlacement(requestedPlacement(input) ?? storedPlacement(template), input.wifiSecurity !== 'nopass')

    const qrContent = buildQrString(input.wifiSsid, input.wifiPassword, input.wifiSecurity)

    const templateBuffer = await downloadFile(template.storedPath)

    const buffer = await generateWallpaper({
      templateBuffer,
      wifiSsid: input.wifiSsid,
      wifiPassword: input.wifiPassword,
      wifiSecurity: input.wifiSecurity,
      placement,
    })

    const storagePath = buildStoragePath()
    const publicUrl = await uploadFile(storagePath, buffer)

    // Grava os valores usados, nunca vazio: mudar o padrão do template depois
    // não altera wallpapers já gerados.
    const wallpaper = await wallpaperRepository.create({
      location: input.location,
      wifiSsid: input.wifiSsid,
      wifiPassword: input.wifiPassword,
      wifiSecurity: input.wifiSecurity,
      qrContent,
      storedPath: storagePath,
      publicUrl,
      templateId: input.templateId,
      ...placement,
    })

    return toDto({ ...wallpaper, template: { name: template.name } })
  },

  async update(id: string, input: UpdateWallpaperInput): Promise<WallpaperDto> {
    const current = await wallpaperRepository.findById(id)
    if (!current) throw new Error('Wallpaper não encontrado.')

    const next = {
      templateId: input.templateId ?? current.templateId,
      location: input.location ?? current.location,
      wifiSsid: input.wifiSsid ?? current.wifiSsid,
      wifiPassword: input.wifiPassword ?? current.wifiPassword,
      wifiSecurity: (input.wifiSecurity ?? current.wifiSecurity) as WifiSecurity,
    }

    // Registros sem posição gravada valem como posição legada, que é onde o QR
    // foi desenhado; assim, salvar sem mexer na posição não regera a imagem.
    const currentPlacement = storedPlacement(current)
    const nextPlacement = fitPlacement(requestedPlacement(input) ?? currentPlacement, next.wifiSecurity !== 'nopass')

    // Estes campos estão embutidos no PNG. Mudar apenas a localização é
    // atualização de metadado: não regera imagem nem toca no storage.
    const needsRegeneration =
      next.templateId !== current.templateId ||
      next.wifiSsid !== current.wifiSsid ||
      next.wifiPassword !== current.wifiPassword ||
      next.wifiSecurity !== current.wifiSecurity ||
      !samePlacement(nextPlacement, currentPlacement)

    if (!needsRegeneration) {
      const updated = await wallpaperRepository.update(id, { location: next.location })
      return toDto(updated)
    }

    const template = await loadActiveTemplate(next.templateId)

    const templateBuffer = await downloadFile(template.storedPath)
    const buffer = await generateWallpaper({
      templateBuffer,
      wifiSsid: next.wifiSsid,
      wifiPassword: next.wifiPassword,
      wifiSecurity: next.wifiSecurity,
      placement: nextPlacement,
    })

    // Publica no caminho novo antes de atualizar o registro, e remove o antigo
    // só depois: um objeto órfão é preferível a um registro apontando para nada.
    const storagePath = buildStoragePath()
    const publicUrl = await uploadFile(storagePath, buffer)

    const updated = await wallpaperRepository.update(id, {
      ...next,
      ...nextPlacement,
      qrContent: buildQrString(next.wifiSsid, next.wifiPassword, next.wifiSecurity),
      storedPath: storagePath,
      publicUrl,
    })

    await deleteFile(current.storedPath)

    return toDto(updated)
  },

  async delete(id: string): Promise<void> {
    const wallpaper = await wallpaperRepository.findById(id)
    if (!wallpaper) throw new Error('Wallpaper não encontrado.')
    await wallpaperRepository.delete(id)
    await deleteFile(wallpaper.storedPath)
  },

  async getImage(id: string): Promise<StoredImage> {
    const wallpaper = await wallpaperRepository.findById(id)
    if (!wallpaper) throw new Error('Wallpaper não encontrado.')
    return loadStoredImage(wallpaper.storedPath, wallpaper.publicUrl)
  },

  async getById(id: string): Promise<WallpaperDto | null> {
    const w = await wallpaperRepository.findById(id)
    return w ? toDto(w) : null
  },
}
