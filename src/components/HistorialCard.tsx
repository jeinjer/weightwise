import { TrendingDown, TrendingUp, Dumbbell, Heart, Minus, PenLine } from 'lucide-react'

export interface Registro {
  id: string
  fecha: string
  peso: number
  entreno: boolean
  cardio: boolean
  tags: string[] | null
}

interface Props {
  registro: Registro
  anterior: Registro | null
  pesoObjetivo: number | null
  onEdit: (r: Registro) => void
  index: number
}

function formatFecha(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-AR', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
}

export default function HistorialCard({ registro, anterior, pesoObjetivo, onEdit, index }: Props) {
  const diff = anterior != null ? registro.peso - anterior.peso : null
  const diffStr = diff != null ? `${diff > 0 ? '+' : ''}${diff.toFixed(1)} kg` : '—'
  const diffColor = diff == null ? 'var(--on-surface-variant)'
    : diff < 0 ? 'var(--secondary)' : diff > 0 ? 'var(--tertiary)' : 'var(--on-surface-variant)'

  const restante = pesoObjetivo != null ? registro.peso - pesoObjetivo : null
  const restanteStr = restante != null
    ? restante > 0 ? `Faltan ${restante.toFixed(1)} kg` : restante < 0 ? `Pasaste ${Math.abs(restante).toFixed(1)} kg` : '¡Objetivo!'
    : null

  const now = new Date()
  const localToday = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split('T')[0]
  const isToday = registro.fecha === localToday

  return (
    <button
      onClick={() => onEdit(registro)}
      className="w-full text-left rounded-2xl p-4 flex flex-col gap-3 transition-all active:scale-[0.98] card-enter group"
      style={{
        background: isToday ? 'rgba(192,193,255,0.07)' : 'var(--surface-container)',
        border: `1px solid ${isToday ? 'rgba(192,193,255,0.3)' : 'var(--outline-variant)'}`,
        animationDelay: `${index * 50}ms`,
      }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium capitalize" style={{ color: 'var(--on-surface-variant)' }}>
            {isToday ? '📅 Hoy · ' : ''}{formatFecha(registro.fecha)}
          </span>
          {restanteStr && (
            <span className="text-[10px]" style={{ color: restante === 0 ? 'var(--secondary)' : 'var(--on-surface-variant)' }}>
              {restanteStr}
            </span>
          )}
        </div>

        <div className="flex items-start gap-2">
          {/* Peso + diff */}
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-2xl font-bold tracking-tight" style={{ color: 'var(--on-surface)' }}>
              {registro.peso.toFixed(1)}
              <span className="text-sm font-normal ml-1" style={{ color: 'var(--on-surface-variant)' }}>kg</span>
            </span>
            <div className="flex items-center gap-1" style={{ color: diffColor }}>
              {diff == null ? <Minus size={12} /> : diff < 0 ? <TrendingDown size={12} /> : diff > 0 ? <TrendingUp size={12} /> : <Minus size={12} />}
              <span className="text-xs font-semibold">{diffStr}</span>
            </div>
          </div>
          {/* Edit hint */}
          <PenLine
            size={13}
            className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: 'var(--on-surface-variant)' }}
          />
        </div>
      </div>

      {/* Badges */}
      {(registro.entreno || registro.cardio || (registro.tags && registro.tags.length > 0)) && (
        <div className="flex flex-wrap gap-1.5">
          {registro.entreno && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
              style={{ background: 'rgba(192,193,255,0.15)', color: 'var(--primary)', border: '1px solid rgba(192,193,255,0.25)' }}>
              <Dumbbell size={10} /> Entreno
            </span>
          )}
          {registro.cardio && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
              style={{ background: 'rgba(78,222,163,0.15)', color: 'var(--secondary)', border: '1px solid rgba(78,222,163,0.25)' }}>
              <Heart size={10} /> Cardio
            </span>
          )}
          {registro.tags?.map(tag => (
            <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] font-medium"
              style={{ background: 'var(--surface-container-high)', color: 'var(--on-surface-variant)', border: '1px solid var(--outline-variant)' }}>
              {tag}
            </span>
          ))}
        </div>
      )}
    </button>
  )
}
