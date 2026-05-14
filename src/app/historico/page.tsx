import { AppShell } from '@/components/AppShell'
import { WallpaperHistory } from '@/components/WallpaperHistory'

export const metadata = {
  title: 'Histórico · OAB Maranhão',
}

export default function HistoricoPage() {
  return (
    <AppShell>
      <div className="mb-8">
        <h1 className="font-bold text-3xl text-[#003366]">Histórico</h1>
        <p className="mt-2 text-gray-500">Todos os wallpapers gerados, disponíveis para download ou exclusão.</p>
      </div>
      <WallpaperHistory />
    </AppShell>
  )
}
