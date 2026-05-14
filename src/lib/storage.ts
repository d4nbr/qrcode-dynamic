import fs from 'node:fs'
import path from 'node:path'

export const storageRoot = path.join(process.cwd(), 'public', 'uploads')
export const templatesDir = path.join(storageRoot, 'templates')
export const wallpapersDir = path.join(storageRoot, 'wallpapers')

export function ensureDirs() {
  ;[storageRoot, templatesDir, wallpapersDir].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  })
}

export function toPublicUrl(absolutePath: string): string {
  const publicRoot = path.join(process.cwd(), 'public')
  return absolutePath.replace(publicRoot, '').replace(/\\/g, '/')
}

export function saveBuffer(absolutePath: string, buffer: Buffer): void {
  fs.writeFileSync(absolutePath, buffer)
}

export function deleteFileIfExists(absolutePath: string): void {
  try {
    if (fs.existsSync(absolutePath)) fs.unlinkSync(absolutePath)
  } catch {
    // silently ignore deletion errors
  }
}
