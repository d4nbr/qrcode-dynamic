import { ListBucketsCommand, S3Client } from '@aws-sdk/client-s3'
import { NextResponse } from 'next/server'

export async function GET() {
  const endpoint = process.env.MINIO_ENDPOINT ?? '(not set)'
  const accessKey = process.env.MINIO_ACCESS_KEY ?? '(not set)'
  const secretKey = process.env.MINIO_SECRET_KEY ?? '(not set)'
  const bucket = process.env.MINIO_BUCKET ?? '(not set)'

  const info = {
    endpoint,
    accessKey,
    secretKeyLength: secretKey.length,
    secretKeyFirst3: secretKey.slice(0, 3),
    secretKeyLast3: secretKey.slice(-3),
    bucket,
  }

  try {
    const s3 = new S3Client({
      endpoint,
      region: 'us-east-1',
      credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
      forcePathStyle: true,
    })
    const result = await s3.send(new ListBucketsCommand({}))
    return NextResponse.json({ ok: true, info, buckets: result.Buckets })
  } catch (err: unknown) {
    return NextResponse.json(
      { ok: false, info, error: String(err) },
      { status: 500 },
    )
  }
}
