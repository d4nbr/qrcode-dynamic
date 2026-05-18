import { randomUUID } from 'node:crypto'
import sharp from 'sharp'
import { templateRepository } from '@/lib/repositories/template.repository'
import { uploadFile, deleteFile } from '@/lib/storage'
import { sanitizeFilename } from '@/lib/utils'
import type { TemplateDto } from '@/lib/types'

const ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/webp']
const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

function toDto(t: {
  id: string
  name: string
  description: string | null
  publicUrl: string
  isActive: boolean
  createdAt: Date
}): TemplateDto {
  return {
    id: t.id,
    name: t.name,
    description: t.description,
    publicUrl: t.publicUrl,
    isActive: t.isActive,
    createdAt: t.createdAt.toISOString(),
  }
}

export const templateService = {
  async listAll(): Promise<TemplateDto[]> {
    const templates = await templateRepository.findAll()
    return templates.map(toDto)
  },

  async listActive(): Promise<TemplateDto[]> {
    const templates = await templateRepository.findAllActive()
    return templates.map(toDto)
  },

  async upload(file: File, name: string, description?: string): Promise<TemplateDto> {
    if (!ALLOWED_MIME.includes(file.type)) {
      throw new Error('Formato não suportado. Use PNG, JPG ou WebP.')
    }
    if (file.size > MAX_SIZE) {
      throw new Error('Arquivo muito grande. Máximo 10 MB.')
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const metadata = await sharp(buffer).metadata()

    if (!metadata.width || !metadata.height) {
      throw new Error('Não foi possível ler as dimensões da imagem.')
    }

    const slug = sanitizeFilename(name)
    const uuid = randomUUID().slice(0, 8)
    const filename = `${slug}-${uuid}.png`
    const storagePath = `templates/${filename}`

    const pngBuffer = await sharp(buffer).png().toBuffer()
    const publicUrl = await uploadFile(storagePath, pngBuffer)

    const template = await templateRepository.create({
      name,
      description: description || null,
      filename: file.name,
      storedPath: storagePath,
      publicUrl,
      widthPx: metadata.width,
      heightPx: metadata.height,
    })

    return toDto(template)
  },

  async toggleActive(id: string, isActive: boolean): Promise<TemplateDto> {
    const template = await templateRepository.toggleActive(id, isActive)
    return toDto(template)
  },

  async delete(id: string): Promise<void> {
    const count = await templateRepository.countWallpapers(id)
    if (count > 0) {
      throw new Error(`Este template possui ${count} wallpaper(s) gerado(s). Exclua-os primeiro.`)
    }
    const template = await templateRepository.findById(id)
    if (!template) throw new Error('Template não encontrado.')

    await templateRepository.delete(id)
    await deleteFile(template.storedPath)
  },
}
