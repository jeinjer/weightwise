'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import RegistroRapido from '@/components/RegistroRapido'
import HistorialCard, { type Registro } from '@/components/HistorialCard'
import EditRegistroSheet from '@/components/EditRegistroSheet'
import { LogOut, TrendingDown, Target, Activity } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Configuracion {
  peso_inicial: number | null
  peso_objetivo: number | null
  altura: number | null
}

export default function ProgresoPage() {
  const supabase = createClient()
  const router   = useRouter()

  const [registros, setRegistros]         = useState<Registro[]>([])
  const [configuracion, setConfiguracion] = useState<Configuracion | null>(null)
  const [loading, setLoading]             = useState(true)
  const [editTarget, setEditTarget]       = useState<Registro | null>(null)
  const [fecha]                           = useState(() =>
    new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
  )
  const [filtroActivo, setFiltroActivo]   = useState<string>('Todos')

  const fetchData = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let query = supabase
      .from('registros_diarios')
      .select('id, fecha, peso, entreno, cardio, tags')
      .eq('user_id', user.id)
      .order('fecha', { ascending: false })

    if (filtroActivo === 'Entrené') {
      query = query.eq('entreno', true)
    } else if (filtroActivo === 'Cardio') {
      query = query.eq('cardio', true)
    } else if (filtroActivo !== 'Todos') {
      query = query.contains('tags', [filtroActivo])
    }

    const [{ data: regs }, { data: cfg }] = await Promise.all([
      query,
      supabase
        .from('configuracion_usuario')
        .select('peso_inicial, peso_objetivo, altura')
        .eq('id', user.id)
        .maybeSingle(),
    ])

    setRegistros(regs ?? [])
    setConfiguracion(cfg ?? null)
    setLoading(false)
  }, [supabase, filtroActivo])

  useEffect(() => {
    queueMicrotask(() => {
      void fetchData()
    })
  }, [fetchData])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const registrosAsc = [...registros].reverse()
  const pesoActual   = registros[0]?.peso ?? null
  const pesoObjetivo = configuracion?.peso_objetivo ?? null
  const pesoInicial  = configuracion?.peso_inicial ?? null
  const totalPerdido = pesoActual != null && pesoInicial != null ? pesoInicial - pesoActual : null
  const restante     = pesoActual != null && pesoObjetivo != null ? pesoActual - pesoObjetivo : null

  return (
    <>
      <div className="px-4 pt-6 pb-2 page-enter">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--on-surface)' }}>Progreso</h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--on-surface-variant)', minHeight: '16px' }}>
              {fecha}
            </p>
          </div>
          <button onClick={handleLogout} className="p-2 rounded-xl"
            style={{ color: 'var(--on-surface-variant)' }} aria-label="Cerrar sesión">
            <LogOut size={18} />
          </button>
        </div>

        {/* Stats banner */}
        {pesoActual != null && (
          <div
            className="grid grid-cols-3 rounded-2xl overflow-hidden mb-5 slide-up"
            style={{ border: '1px solid var(--outline-variant)', animationDelay: '80ms' }}
          >
            {[
              { icon: Activity, label: 'Actual', value: `${pesoActual.toFixed(1)} kg`, color: 'var(--primary)' },
              {
                icon: TrendingDown, label: 'Perdido',
                value: totalPerdido != null ? `${totalPerdido > 0 ? '-' : '+'}${Math.abs(totalPerdido).toFixed(1)} kg` : '—',
                color: totalPerdido != null && totalPerdido > 0 ? 'var(--secondary)' : 'var(--tertiary)',
              },
              {
                icon: Target, label: 'Falta',
                value: restante != null ? restante <= 0 ? '¡Meta!' : `${restante.toFixed(1)} kg` : '—',
                color: restante != null && restante <= 0 ? 'var(--secondary)' : 'var(--on-surface-variant)',
              },
            ].map(({ icon: Icon, label, value, color }, i) => (
              <div key={label} className="flex flex-col items-center py-3 gap-1"
                style={{
                  background: 'var(--surface-container)',
                  borderRight: i < 2 ? '1px solid var(--outline-variant)' : 'none',
                }}>
                <Icon size={14} style={{ color }} />
                <span className="text-base font-bold" style={{ color: 'var(--on-surface)' }}>{value}</span>
                <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: 'var(--on-surface-variant)' }}>{label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Quick entry */}
        <RegistroRapido onSaved={fetchData} configuracion={configuracion} />

        {/* Historial */}
        <div className="flex flex-col gap-3 pb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--on-surface-variant)' }}>
              Historial
            </h2>
            {registros.length > 0 && (
              <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>
                {registros.length} registros · <span style={{ color: 'var(--primary)' }}>tocá para editar</span>
              </span>
            )}
          </div>

          <div className="flex overflow-x-auto gap-2 pb-2 mt-1 no-scrollbar">
            {['Todos', 'Entrené', 'Cardio', '🦵 Piernas', '💪 Empuje', '🏋️ Tirón', '🏃 Caminar/Trotar', '🚲 Bici'].map(f => (
              <button
                key={f}
                onClick={() => setFiltroActivo(f)}
                className="px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wide whitespace-nowrap transition-all active:scale-95"
                style={{
                  background: filtroActivo === f ? 'var(--primary)' : 'var(--surface-container-high)',
                  color: filtroActivo === f ? 'var(--on-primary)' : 'var(--on-surface-variant)',
                  border: `1px solid ${filtroActivo === f ? 'var(--primary)' : 'var(--outline-variant)'}`
                }}
              >
                {f}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 rounded-full border-2 animate-spin"
                style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
            </div>
          ) : registros.length === 0 ? (
            <div className="text-center py-10 rounded-2xl scale-pop"
              style={{ background: 'var(--surface-container)', border: '1px solid var(--outline-variant)' }}>
              <p className="text-3xl mb-2">⚖️</p>
              <p className="text-sm font-medium" style={{ color: 'var(--on-surface)' }}>Sin registros aún</p>
              <p className="text-xs mt-1" style={{ color: 'var(--on-surface-variant)' }}>Agregá tu peso de hoy para empezar</p>
            </div>
          ) : (
            registros.map((reg, idx) => {
              const ascIdx  = registrosAsc.findIndex(r => r.id === reg.id)
              const anterior = ascIdx > 0 ? registrosAsc[ascIdx - 1] : null
              return (
                <HistorialCard
                  key={reg.id}
                  registro={reg}
                  anterior={anterior}
                  pesoObjetivo={pesoObjetivo}
                  onEdit={setEditTarget}
                  index={idx}
                />
              )
            })
          )}
        </div>
      </div>

      {/* Edit bottom sheet */}
      <EditRegistroSheet
        registro={editTarget}
        onClose={() => setEditTarget(null)}
        onSaved={fetchData}
      />
    </>
  )
}
