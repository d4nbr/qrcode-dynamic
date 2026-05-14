import { prisma } from '@/lib/prisma'
import type { Template } from '@prisma/client'

type CreateTemplateData = {
  name: string
  description?: string | null
  filename: string
  storedPath: string
  publicUrl: string
  widthPx?: number
  heightPx?: number
}

export const templateRepository = {
  findAll(): Promise<Template[]> {
    return prisma.template.findMany({ orderBy: { createdAt: 'desc' } })
  },

  findAllActive(): Promise<Template[]> {
    return prisma.template.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    })
  },

  findById(id: string): Promise<Template | null> {
    return prisma.template.findUnique({ where: { id } })
  },

  create(data: CreateTemplateData): Promise<Template> {
    return prisma.template.create({ data })
  },

  toggleActive(id: string, isActive: boolean): Promise<Template> {
    return prisma.template.update({ where: { id }, data: { isActive } })
  },

  delete(id: string): Promise<Template> {
    return prisma.template.delete({ where: { id } })
  },

  countWallpapers(id: string): Promise<number> {
    return prisma.wallpaper.count({ where: { templateId: id } })
  },
}
