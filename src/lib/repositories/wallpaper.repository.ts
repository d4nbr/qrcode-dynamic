import { prisma } from '@/lib/prisma'
import type { Wallpaper } from '@prisma/client'

type CreateWallpaperData = {
  location: string
  wifiSsid: string
  wifiPassword: string
  wifiSecurity: string
  qrContent: string
  storedPath: string
  publicUrl: string
  templateId: string
}

type UpdateWallpaperData = Partial<CreateWallpaperData>

type WallpaperWithTemplate = Wallpaper & {
  template: { name: string }
}

export const wallpaperRepository = {
  findMany(cursor?: string, limit = 20): Promise<WallpaperWithTemplate[]> {
    return prisma.wallpaper.findMany({
      take: limit + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { template: { select: { name: true } } },
    }) as Promise<WallpaperWithTemplate[]>
  },

  findById(id: string): Promise<WallpaperWithTemplate | null> {
    return prisma.wallpaper.findUnique({
      where: { id },
      include: { template: { select: { name: true } } },
    }) as Promise<WallpaperWithTemplate | null>
  },

  create(data: CreateWallpaperData): Promise<Wallpaper> {
    return prisma.wallpaper.create({ data })
  },

  update(id: string, data: UpdateWallpaperData): Promise<WallpaperWithTemplate> {
    return prisma.wallpaper.update({
      where: { id },
      data,
      include: { template: { select: { name: true } } },
    }) as Promise<WallpaperWithTemplate>
  },

  delete(id: string): Promise<Wallpaper> {
    return prisma.wallpaper.delete({ where: { id } })
  },
}
