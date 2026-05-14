'use client'

import { History, Settings, Wifi } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/gerar', label: 'Gerar', icon: Wifi },
  { href: '/historico', label: 'Histórico', icon: History },
  { href: '/admin/templates', label: 'Admin', icon: Settings },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-[#003366] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo OAB Maranhão */}
            <Link href="/gerar" className="flex items-center gap-3">
              <Image src="/logo-oabma.png" alt="OAB Maranhão" width={120} height={38} className="object-contain" priority />
              <div className="hidden sm:block h-8 w-px bg-white/20" />
              <span className="hidden sm:block text-xs text-[#a0bcd8] leading-tight">QR Code Wallpaper WiFi</span>
            </Link>

            <nav className="flex items-center gap-1">
              {navItems.map(({ href, label, icon: Icon }) => {
                const active = pathname.startsWith(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                      active ? 'bg-white/15 text-white' : 'text-[#a0bcd8] hover:text-white hover:bg-white/10'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">{children}</main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} Gerência de Tecnologia da Informação · Sistema Interno
          </p>
          <p className="text-xs text-gray-400">Versão 1.0</p>
        </div>
      </footer>
    </div>
  )
}
