'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Dumbbell, Heart, Plus, Loader2, CheckCircle2, Tag } from 'lucide-react'

const QUICK_TAGS = ['🦵 Piernas', '💪 Empuje', '🏋️ Tirón', '🏃 Caminar/Trotar', '🚲 Bici']

interface Props {
  onSaved: () => void
  configuracion: { peso_inicial: number | null; peso_objetivo: number | null } | null
}

export default function RegistroRapido({ onSaved }: Props) {
  const supabase = createClient()

  const [peso, setPeso]       = useState('')
  const [entreno, setEntreno] = useState(false)
  const [cardio, setCardio]   = useState(false)
  const [tags, setTags]       = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  function toggleTag(tag: string) {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!peso) return
    setError(null)
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const now = new Date()
    const today = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split('T')[0]

    const { error: dbError } = await supabase
      .from('registros_diarios')
      .upsert(
        { user_id: user.id, fecha: today, peso: parseFloat(peso), entreno, cardio, tags },
        { onConflict: 'user_id,fecha' }
      )

    if (dbError) {
      setError('Error al guardar. Intentá de nuevo.')
      setLoading(false)
      return
    }

    setPeso(''); setEntreno(false); setCardio(false); setTags([])
    setSuccess(true)
    setTimeout(() => setSuccess(false), 2500)
    setLoading(false)
    onSaved()
  }

  return (
    <section
      className="rounded-2xl overflow-hidden mb-5"
      style={{
        background: 'var(--surface-container)',
        border: '1px solid var(--outline-variant)',
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center gap-2"
        style={{ borderBottom: '1px solid var(--outline-variant)' }}
      >
        <Plus size={14} style={{ color: 'var(--primary)' }} />
        <h2
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: 'var(--on-surface-variant)' }}
        >
          Nuevo Registro
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">

        {/* Big peso input */}
        <div
          className="rounded-xl px-4 py-3"
          style={{
            background: 'var(--surface-container-high)',
            border: '1px solid var(--outline-variant)',
          }}
        >
          <label
            htmlFor="peso-input"
            className="text-[10px] font-bold uppercase tracking-widest block mb-1"
            style={{ color: 'var(--on-surface-variant)' }}
          >
            Peso de hoy
          </label>
          <div className="flex items-end gap-2">
            <input
              id="peso-input"
              type="number"
              inputMode="decimal"
              step="0.1"
              min="20"
              max="300"
              placeholder="75.0"
              value={peso}
              onChange={e => setPeso(e.target.value)}
              required
              className="flex-1 bg-transparent outline-none text-4xl font-bold tracking-tight"
              style={{ color: 'var(--on-surface)' }}
            />
            <span
              className="text-lg font-semibold pb-0.5"
              style={{ color: 'var(--on-surface-variant)' }}
            >
              kg
            </span>
          </div>
        </div>

        {/* Toggles */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Entrené', icon: Dumbbell, value: entreno, set: setEntreno, activeColor: 'var(--primary)', activeBg: 'rgba(192,193,255,0.15)' },
            { label: 'Cardio', icon: Heart, value: cardio, set: setCardio, activeColor: 'var(--secondary)', activeBg: 'rgba(78,222,163,0.12)' },
          ].map(({ label, icon: Icon, value, set, activeColor, activeBg }) => (
            <button
              key={label}
              type="button"
              onClick={() => set(!value)}
              className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all active:scale-95"
              style={{
                background: value ? activeBg : 'var(--surface-container-high)',
                border: `1.5px solid ${value ? activeColor : 'var(--outline-variant)'}`,
                color: value ? activeColor : 'var(--on-surface-variant)',
              }}
            >
              <Icon size={15} strokeWidth={2} />
              {label}
            </button>
          ))}
        </div>

        {/* Tags */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Tag size={11} style={{ color: 'var(--on-surface-variant)' }} />
            <span
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: 'var(--on-surface-variant)' }}
            >
              Etiquetas
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {QUICK_TAGS.map(tag => {
              const active = tags.includes(tag)
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95"
                  style={{
                    background: active ? 'rgba(192,193,255,0.18)' : 'var(--surface-container-high)',
                    border: `1px solid ${active ? 'var(--primary)' : 'var(--outline-variant)'}`,
                    color: active ? 'var(--primary)' : 'var(--on-surface-variant)',
                  }}
                >
                  {tag}
                </button>
              )
            })}
          </div>
        </div>

        {error && <p className="text-xs" style={{ color: 'var(--error)' }}>{error}</p>}

        <button
          type="submit"
          disabled={loading || !peso}
          className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-40"
          style={{
            background: success ? 'var(--secondary)' : 'var(--primary)',
            color: success ? 'var(--on-secondary)' : 'var(--on-primary)',
          }}
        >
          {loading
            ? <><Loader2 size={16} className="animate-spin" /> Guardando…</>
            : success
            ? <><CheckCircle2 size={16} /> ¡Guardado!</>
            : <><Plus size={16} /> Guardar registro</>
          }
        </button>
      </form>
    </section>
  )
}
