import { createClient } from '@supabase/supabase-js'

const BUCKET = 'images'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function uploadFile(storagePath: string, buffer: Buffer): Promise<string> {
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType: 'image/png', upsert: false })

  if (error) throw new Error(`Falha no upload para o Storage: ${error.message}`)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)
  return data.publicUrl
}

export async function downloadFile(storagePath: string): Promise<Buffer> {
  const { data, error } = await supabase.storage.from(BUCKET).download(storagePath)

  if (error || !data) throw new Error(`Falha ao baixar do Storage: ${error?.message}`)

  return Buffer.from(await data.arrayBuffer())
}

export async function deleteFile(storagePath: string): Promise<void> {
  try {
    await supabase.storage.from(BUCKET).remove([storagePath])
  } catch {
    // silently ignore deletion errors
  }
}

export function getPublicUrl(storagePath: string): string {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)
  return data.publicUrl
}
