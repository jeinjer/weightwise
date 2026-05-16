import BottomNav from '@/components/BottomNav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex flex-col min-h-dvh"
      style={{ background: 'var(--surface)' }}
    >
      {/* Main scrollable area — leaves room for bottom nav */}
      <main className="flex-1 overflow-y-auto pb-24">
        {children}
      </main>

      <BottomNav />
    </div>
  )
}
