'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts'
import { TrendingDown, TrendingUp, Minus, Dumbbell, Heart, BarChart2 } from 'lucide-react'

type Range = '7' | '14' | '30' | 'all'

interface Registro {
  fecha: string
  peso: number
  entreno: boolean
  cardio: boolean
}

interface Configuracion {
  peso_inicial: number | null
  peso_objetivo: number | null
  altura: number | null
}

// ── Tooltip custom ───────────────────────────────────────
function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  const peso = payload[0].value
  return (
    <div
      className="rounded-xl px-3 py-2 text-sm shadow-lg"
      style={{
        background: 'var(--surface-container-highest)',
        border: '1px solid var(--outline-variant)',
        color: 'var(--on-surface)',
      }}
    >
      <p className="font-bold">{peso.toFixed(1)} kg</p>
      <p className="text-xs mt-0.5" style={{ color: 'var(--on-surface-variant)' }}>{label}</p>
    </div>
  )
}

// ── Stat chip ─────────────────────────────────────────────
function StatChip({ label, value, sub, color }: {
  label: string; value: string; sub?: string; color?: string
}) {
  return (
    <div
      className="flex flex-col gap-1 rounded-2xl p-4"
      style={{
        background: 'var(--surface-container)',
        border: '1px solid var(--outline-variant)',
      }}
    >
      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--on-surface-variant)' }}>
        {label}
      </span>
      <span className="text-xl font-bold" style={{ color: color ?? 'var(--on-surface)' }}>
        {value}
      </span>
      {sub && (
        <span className="text-[10px]" style={{ color: 'var(--on-surface-variant)' }}>{sub}</span>
      )}
    </div>
  )
}

export default function EstadisticasPage() {
  const supabase = createClient()

  const [registros, setRegistros]         = useState<Registro[]>([])
  const [configuracion, setConfiguracion] = useState<Configuracion | null>(null)
  const [range, setRange]                 = useState<Range>('30')
  const [tab, setTab]                     = useState<'progreso' | 'stats'>('progreso')
  const [loading, setLoading]             = useState(true)

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [{ data: regs }, { data: cfg }] = await Promise.all([
      supabase
        .from('registros_diarios')
        .select('fecha, peso, entreno, cardio')
        .eq('user_id', user.id)
        .order('fecha', { ascending: true }),
      supabase
        .from('configuracion_usuario')
        .select('peso_inicial, peso_objetivo, altura')
        .eq('id', user.id)
        .maybeSingle(),
    ])

    setRegistros(regs ?? [])
    setConfiguracion(cfg ?? null)
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Filtrar por rango ───────────────────────────────────
  const filtered = (() => {
    if (range === 'all') return registros
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - parseInt(range))
    const cutoffStr = cutoff.toISOString().split('T')[0]
    return registros.filter(r => r.fecha >= cutoffStr)
  })()

  // ── Datos para el gráfico ───────────────────────────────
  const chartData = filtered.map(r => ({
    fecha: new Date(r.fecha + 'T00:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }),
    peso: r.peso,
    entreno: r.entreno,
    cardio: r.cardio,
  }))

  // ── Stats calculadas ────────────────────────────────────
  const pesos = filtered.map(r => r.peso)
  const pesoMin  = pesos.length ? Math.min(...pesos) : null
  const pesoMax  = pesos.length ? Math.max(...pesos) : null
  const pesoMedio = pesos.length ? pesos.reduce((a, b) => a + b, 0) / pesos.length : null
  const primero  = filtered[0]?.peso ?? null
  const ultimo   = filtered[filtered.length - 1]?.peso ?? null
  const variacion = primero != null && ultimo != null ? ultimo - primero : null
  const tendencia = variacion == null ? null : variacion < 0 ? 'baja' : variacion > 0 ? 'sube' : 'estable'

  let progresoMensaje = null
  let progresoColor: string | undefined = undefined
  if (variacion != null && configuracion?.peso_objetivo != null) {
    const pInicial = configuracion.peso_inicial ?? primero ?? ultimo ?? 0
    const quiereBajar = configuracion.peso_objetivo < pInicial
    const quiereSubir = configuracion.peso_objetivo > pInicial
    
    if (quiereBajar) {
      if (variacion <= -0.1) { progresoMensaje = '¡Venís re bien! Te acercás a tu objetivo. 👏'; progresoColor = 'var(--secondary)' }
      else if (variacion >= 0.1) { progresoMensaje = 'Subiste un poco. ¡A no aflojar! 💪'; progresoColor = 'var(--tertiary)' }
      else { progresoMensaje = 'Te estás manteniendo. ¡Seguí así! 👍'; progresoColor = 'var(--on-surface)' }
    } else if (quiereSubir) {
      if (variacion >= 0.1) { progresoMensaje = '¡Venís re bien! Ganando peso. 👏'; progresoColor = 'var(--secondary)' }
      else if (variacion <= -0.1) { progresoMensaje = 'Bajaste un poco. ¡A comer más! 💪'; progresoColor = 'var(--tertiary)' }
      else { progresoMensaje = 'Te estás manteniendo. ¡A meterle! 👍'; progresoColor = 'var(--on-surface)' }
    } else {
      progresoMensaje = 'Mantenimiento de peso. ¡Excelente! 🎯'
      progresoColor = 'var(--secondary)'
    }
  }

  const diasConEntreno = filtered.filter(r => r.entreno).length
  const diasConCardio  = filtered.filter(r => r.cardio).length
  const totalDias      = filtered.length

  // IMC
  const pesoActual = ultimo
  const altura     = configuracion?.altura
  const imc = pesoActual != null && altura != null
    ? pesoActual / ((altura / 100) ** 2)
    : null
  const imcLabel = imc == null ? null
    : imc < 18.5 ? 'Bajo peso'
    : imc < 25   ? 'Peso normal'
    : imc < 30   ? 'Sobrepeso'
    : 'Obesidad'
  const imcColor = imc == null ? undefined
    : imc < 18.5 ? 'var(--tertiary)'
    : imc < 25   ? 'var(--secondary)'
    : imc < 30   ? '#f59e0b'
    : 'var(--error)'

  // Domain del gráfico con padding
  const yMin = pesoMin != null ? Math.floor(pesoMin - 1) : undefined
  const yMax = pesoMax != null ? Math.ceil(pesoMax + 1) : undefined

  const rangeOptions: { label: string; value: Range }[] = [
    { label: '7d', value: '7' },
    { label: '14d', value: '14' },
    { label: '30d', value: '30' },
    { label: 'Todo', value: 'all' },
  ]

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div
          className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 pb-4 flex flex-col gap-4 page-enter">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--on-surface)' }}>
          Estadísticas
        </h1>
        <p className="text-xs mt-0.5" style={{ color: 'var(--on-surface-variant)' }}>
          Análisis de tu progreso
        </p>
      </div>

      {/* Tabs internas */}
      <div
        className="flex rounded-xl p-1 gap-1"
        style={{ background: 'var(--surface-container)' }}
      >
        {[
          { id: 'progreso', label: 'Progreso' },
          { id: 'stats', label: 'Estadísticas' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as 'progreso' | 'stats')}
            className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
            style={{
              background: tab === t.id ? 'var(--surface-container-highest)' : 'transparent',
              color: tab === t.id ? 'var(--primary)' : 'var(--on-surface-variant)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Range filters */}
      <div className="flex gap-2">
        {rangeOptions.map(opt => (
          <button
            key={opt.value}
            onClick={() => setRange(opt.value)}
            className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all"
            style={{
              background: range === opt.value ? 'rgba(192,193,255,0.15)' : 'var(--surface-container)',
              border: `1px solid ${range === opt.value ? 'var(--primary)' : 'var(--outline-variant)'}`,
              color: range === opt.value ? 'var(--primary)' : 'var(--on-surface-variant)',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div
          className="text-center py-12 rounded-2xl"
          style={{ background: 'var(--surface-container)', border: '1px solid var(--outline-variant)' }}
        >
          <BarChart2 size={32} className="mx-auto mb-3" style={{ color: 'var(--outline-variant)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--on-surface)' }}>Sin datos en este período</p>
          <p className="text-xs mt-1" style={{ color: 'var(--on-surface-variant)' }}>Registrá tu peso para ver estadísticas</p>
        </div>
      ) : tab === 'progreso' ? (
        <>
          {/* Tendencia badge */}
          {variacion != null && (
            <div
              className="flex items-center gap-3 rounded-2xl p-4"
              style={{
                background: tendencia === 'baja' ? 'rgba(78,222,163,0.1)' : tendencia === 'sube' ? 'rgba(255,178,183,0.1)' : 'var(--surface-container)',
                border: `1px solid ${tendencia === 'baja' ? 'rgba(78,222,163,0.3)' : tendencia === 'sube' ? 'rgba(255,178,183,0.3)' : 'var(--outline-variant)'}`,
              }}
            >
              {tendencia === 'baja'
                ? <TrendingDown size={20} style={{ color: 'var(--secondary)' }} />
                : tendencia === 'sube'
                ? <TrendingUp size={20} style={{ color: 'var(--tertiary)' }} />
                : <Minus size={20} style={{ color: 'var(--on-surface-variant)' }} />
              }
              <div>
                <p className="text-sm font-bold" style={{
                  color: tendencia === 'baja' ? 'var(--secondary)' : tendencia === 'sube' ? 'var(--tertiary)' : 'var(--on-surface)'
                }}>
                  {variacion === 0
                    ? 'Peso estable en este período'
                    : variacion < 0
                    ? `Bajaste ${Math.abs(variacion).toFixed(1)} kg en este período`
                    : `Subiste ${variacion.toFixed(1)} kg en este período`
                  }
                </p>
                {progresoMensaje && (
                  <p className="text-[13px] font-bold mt-1" style={{ color: progresoColor }}>
                    {progresoMensaje}
                  </p>
                )}
                <p className="text-xs mt-1" style={{ color: 'var(--on-surface-variant)' }}>
                  {totalDias} registros analizados
                </p>
              </div>
            </div>
          )}

          {/* Gráfico */}
          <div
            className="rounded-2xl p-4"
            style={{
              background: 'var(--surface-container)',
              border: '1px solid var(--outline-variant)',
            }}
          >
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--on-surface-variant)' }}>
              Evolución del peso
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="pesoGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#c0c1ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#c0c1ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.06)"
                  vertical={false}
                />
                <XAxis
                  dataKey="fecha"
                  tick={{ fill: 'var(--on-surface-variant)', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={[yMin ?? 'auto', yMax ?? 'auto']}
                  tick={{ fill: 'var(--on-surface-variant)', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={v => `${v}`}
                />
                <Tooltip content={<CustomTooltip />} />
                {/* Línea objetivo */}
                {configuracion?.peso_objetivo && (
                  <ReferenceLine
                    y={configuracion.peso_objetivo}
                    stroke="#4edea3"
                    strokeDasharray="4 3"
                    strokeWidth={1.5}
                    label={{
                      value: `Meta ${configuracion.peso_objetivo}`,
                      fill: '#4edea3',
                      fontSize: 9,
                      position: 'insideTopRight',
                    }}
                  />
                )}
                <Area
                  type="monotone"
                  dataKey="peso"
                  stroke="#c0c1ff"
                  strokeWidth={2}
                  fill="url(#pesoGradient)"
                  dot={{ r: 3, fill: '#c0c1ff', strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#c0c1ff', stroke: 'var(--surface)', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Mini stats bajo el gráfico */}
          <div className="grid grid-cols-3 gap-3">
            <StatChip
              label="Mínimo"
              value={pesoMin != null ? `${pesoMin.toFixed(1)} kg` : '—'}
              color="var(--secondary)"
            />
            <StatChip
              label="Promedio"
              value={pesoMedio != null ? `${pesoMedio.toFixed(1)} kg` : '—'}
            />
            <StatChip
              label="Máximo"
              value={pesoMax != null ? `${pesoMax.toFixed(1)} kg` : '—'}
              color="var(--tertiary)"
            />
          </div>
        </>
      ) : (
        /* ── Tab Estadísticas ─────────────────────────────── */
        <>
          {/* IMC */}
          {imc != null && (
            <div
              className="rounded-2xl p-4 flex items-center justify-between"
              style={{ background: 'var(--surface-container)', border: '1px solid var(--outline-variant)' }}
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--on-surface-variant)' }}>
                  IMC Actual
                </p>
                <p className="text-3xl font-bold" style={{ color: imcColor }}>
                  {imc.toFixed(1)}
                </p>
                <p className="text-xs mt-0.5 font-semibold" style={{ color: imcColor }}>
                  {imcLabel}
                </p>
              </div>
              {/* IMC scale bar */}
              <div className="flex flex-col gap-1 text-right">
                {[
                  { label: '< 18.5 Bajo peso', color: 'var(--tertiary)' },
                  { label: '18.5–25 Normal', color: 'var(--secondary)' },
                  { label: '25–30 Sobrepeso', color: '#f59e0b' },
                  { label: '> 30 Obesidad', color: 'var(--error)' },
                ].map(row => (
                  <div key={row.label} className="flex items-center gap-1.5 justify-end">
                    <span className="text-[10px]" style={{ color: 'var(--on-surface-variant)' }}>
                      {row.label.split(' ').slice(1).join(' ')}
                    </span>
                    <div className="w-2 h-2 rounded-full" style={{ background: row.color }} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actividad */}
          <div
            className="rounded-2xl p-4"
            style={{ background: 'var(--surface-container)', border: '1px solid var(--outline-variant)' }}
          >
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--on-surface-variant)' }}>
              Actividad física
            </p>
            <div className="flex flex-col gap-3">
              {/* Entreno bar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Dumbbell size={13} style={{ color: 'var(--primary)' }} />
                    <span className="text-xs font-semibold" style={{ color: 'var(--on-surface)' }}>Entreno</span>
                  </div>
                  <span className="text-xs font-bold" style={{ color: 'var(--primary)' }}>
                    {diasConEntreno}/{totalDias} días
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-container-high)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: totalDias ? `${(diasConEntreno / totalDias) * 100}%` : '0%',
                      background: 'var(--primary)',
                    }}
                  />
                </div>
              </div>
              {/* Cardio bar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Heart size={13} style={{ color: 'var(--secondary)' }} />
                    <span className="text-xs font-semibold" style={{ color: 'var(--on-surface)' }}>Cardio</span>
                  </div>
                  <span className="text-xs font-bold" style={{ color: 'var(--secondary)' }}>
                    {diasConCardio}/{totalDias} días
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-container-high)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: totalDias ? `${(diasConCardio / totalDias) * 100}%` : '0%',
                      background: 'var(--secondary)',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Grid de stats */}
          <div className="grid grid-cols-2 gap-3">
            <StatChip
              label="Días registrados"
              value={String(totalDias)}
              sub="en el período seleccionado"
            />
            <StatChip
              label="Variación total"
              value={variacion != null ? `${variacion > 0 ? '+' : ''}${variacion.toFixed(1)} kg` : '—'}
              color={variacion == null ? undefined : variacion < 0 ? 'var(--secondary)' : variacion > 0 ? 'var(--tertiary)' : 'var(--on-surface-variant)'}
            />
            <StatChip
              label="Peso mínimo"
              value={pesoMin != null ? `${pesoMin.toFixed(1)} kg` : '—'}
              color="var(--secondary)"
            />
            <StatChip
              label="Peso máximo"
              value={pesoMax != null ? `${pesoMax.toFixed(1)} kg` : '—'}
              color="var(--tertiary)"
            />
          </div>
        </>
      )}
    </div>
  )
}
