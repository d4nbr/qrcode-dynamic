import { AppShell } from '@/components/AppShell'
import { TemplateManager } from '@/components/TemplateManager'

export const metadata = {
  title: 'Admin · Templates · OAB Maranhão',
}

export default function AdminTemplatesPage() {
  return (
    <AppShell>
      <div className="mb-8">
        <h1 className="font-bold text-3xl text-[#003366]">Gestão de Templates</h1>
        <p className="mt-2 text-gray-500">Faça upload e gerencie as imagens base para geração dos wallpapers.</p>
      </div>
      <TemplateManager />
    </AppShell>
  )
}
