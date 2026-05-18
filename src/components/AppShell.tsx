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
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="bg-[#003366] text-white shadow-lg">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo OAB Maranhão */}
            <Link href="/gerar" className="flex items-center gap-3">
              <Image src="/logo-oabma.png" alt="OAB Maranhão" width={120} height={38} className="object-contain" priority />
              <div className="hidden h-8 w-px bg-white/20 sm:block" />
              <span className="hidden text-[#a0bcd8] text-xs leading-tight sm:block">QR Code Wallpaper WiFi</span>
            </Link>

            <nav className="flex items-center gap-1">
              {navItems.map(({ href, label, icon: Icon }) => {
                const active = pathname.startsWith(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'flex items-center gap-2 rounded-lg px-4 py-2 font-medium text-sm transition-colors',
                      active ? 'bg-white/15 text-white' : 'text-[#a0bcd8] hover:bg-white/10 hover:text-white'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">{children}</main>

      {/* Footer */}
      <footer className="border-gray-200 border-t bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <p className="text-gray-400 text-xs">© {new Date().getFullYear()} Gerência de Tecnologia da Informação</p>
          <p className="text-gray-400 text-xs">v1.0</p>
        </div>
      </footer>
    </div>
  )
}
