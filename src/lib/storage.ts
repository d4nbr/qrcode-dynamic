import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

const BUCKET = process.env.MINIO_BUCKET ?? 'images'
const ENDPOINT = process.env.MINIO_ENDPOINT!
const PUBLIC_URL = process.env.MINIO_PUBLIC_URL ?? ENDPOINT

const s3 = new S3Client({
  endpoint: ENDPOINT,
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY!,
    secretAccessKey: process.env.MINIO_SECRET_KEY!,
  },
  forcePathStyle: true,
})

export async function uploadFile(storagePath: string, buffer: Buffer): Promise<string> {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: storagePath,
      Body: buffer,
      ContentType: 'image/png',
    }),
  )

  return getPublicUrl(storagePath)
}

export async function downloadFile(storagePath: string): Promise<Buffer> {
  const response = await s3.send(
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: storagePath,
    }),
  )

  if (!response.Body) throw new Error(`Falha ao baixar do Storage: objeto vazio`)

  const bytes = await response.Body.transformToByteArray()
  return Buffer.from(bytes)
}

export async function deleteFile(storagePath: string): Promise<void> {
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: storagePath }))
  } catch {
    // silently ignore deletion errors
  }
}

export function getPublicUrl(storagePath: string): string {
  return `${PUBLIC_URL}/${BUCKET}/${storagePath}`
}

export type StoredImage = { buffer: Buffer } | { redirect: string }

// O bucket é privado: o navegador recebe as imagens pelo app, que as lê com as
// credenciais do servidor. Registros antigos podem apontar para outro storage
// público (o MinIO anterior); se o objeto não estiver no bucket atual, devolve
// esse endereço gravado para a rota redirecionar, como funcionava antes.
export async function loadStoredImage(storagePath: string, publicUrl: string): Promise<StoredImage> {
  try {
    return { buffer: await downloadFile(storagePath) }
  } catch (err) {
    if (publicUrl && publicUrl !== getPublicUrl(storagePath)) return { redirect: publicUrl }
    throw err
  }
}
