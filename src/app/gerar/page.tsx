import { AppShell } from '@/components/AppShell'
import { WallpaperGenerator } from '@/components/WallpaperGenerator'

export const metadata = {
  title: 'Gerar Wallpaper · OAB Maranhão',
}

export default function GerarPage() {
  return (
    <AppShell>
      <div className="mb-8">
        <h1 className="font-bold text-3xl text-[#003366]">Gerar Wallpaper</h1>
        <p className="mt-2 text-gray-500">Crie papéis de parede institucionais com QR Code Wi-Fi para as salas de atendimento.</p>
      </div>
      <WallpaperGenerator />
    </AppShell>
  )
}
