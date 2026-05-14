import { NextResponse } from 'next/server'
import { templateService } from '@/lib/services/template.service'
import { uploadTemplateSchema } from '@/lib/validations'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const templates = await templateService.listAll()
    return NextResponse.json(templates)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro interno'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const name = formData.get('name')
    const description = formData.get('description')

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Arquivo obrigatório.' }, { status: 400 })
    }

    const parsed = uploadTemplateSchema.safeParse({
      name: String(name ?? ''),
      description: description ? String(description) : undefined,
    })

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const template = await templateService.upload(file, parsed.data.name, parsed.data.description)

    return NextResponse.json(template, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro interno'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
