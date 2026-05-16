'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Activity, BarChart2, Settings } from 'lucide-react'

const tabs = [
  { href: '/progreso',      label: 'Progreso',     icon: Activity },
  { href: '/estadisticas',  label: 'Estadísticas', icon: BarChart2 },
  { href: '/configuracion', label: 'Config',        icon: Settings },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 pb-safe"
      style={{
        background: 'var(--surface-container-low)',
        borderTop: '1px solid var(--outline-variant)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <ul className="flex items-stretch justify-around h-16">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <li key={href} className="flex-1 relative">
              {/* Active top indicator */}
              {active && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full nav-indicator"
                  style={{ background: 'var(--primary)' }}
                />
              )}
              <Link
                href={href}
                className="flex flex-col items-center justify-center h-full gap-1 transition-all"
                style={{
                  color: active ? 'var(--primary)' : 'var(--on-surface-variant)',
                }}
              >
                <span
                  className="transition-transform"
                  style={{ transform: active ? 'scale(1.15)' : 'scale(1)' }}
                >
                  <Icon
                    size={21}
                    strokeWidth={active ? 2.5 : 1.75}
                  />
                </span>
                <span className="text-[10px] font-bold tracking-wide uppercase">
                  {label}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
