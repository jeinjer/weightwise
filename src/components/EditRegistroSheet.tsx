'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { type Registro } from './HistorialCard'
import {
  X, Loader2, Trash2, CheckCircle2, Dumbbell, Heart, Tag,
} from 'lucide-react'

const QUICK_TAGS = ['🦵 Piernas', '💪 Empuje', '🏋️ Tirón', '🏃 Caminar/Trotar', '🚲 Bici']

interface Props {
  registro: Registro | null
  onClose: () => void
  onSaved: () => void
}

function formatFechaLarga(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

export default function EditRegistroSheet({ registro, onClose, onSaved }: Props) {
  const supabase = createClient()

  const [peso, setPeso]       = useState('')
  const [entreno, setEntreno] = useState(false)
  const [cardio, setCardio]   = useState(false)
  const [tags, setTags]       = useState<string[]>([])
  const [saving, setSaving]   = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [visible, setVisible] = useState(false)

  // Animate in on mount
  useEffect(() => {
    if (registro) {
      setPeso(registro.peso.toString())
      setEntreno(registro.entreno)
      setCardio(registro.cardio)
      setTags(registro.tags ?? [])
      setConfirmDelete(false)
      setError(null)
      // Trigger animation after micro-delay
      requestAnimationFrame(() => setVisible(true))
    }
  }, [registro])

  function handleClose() {
    setVisible(false)
    setTimeout(onClose, 300)
  }

  function toggleTag(tag: string) {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  async function handleSave() {
    if (!registro || !peso) return
    setSaving(true)
    setError(null)

    const { error: dbError } = await supabase
      .from('registros_diarios')
      .update({ peso: parseFloat(peso), entreno, cardio, tags })
      .eq('id', registro.id)

    if (dbError) {
      setError('Error al guardar. Intentá de nuevo.')
      setSaving(false)
      return
    }

    setSaving(false)
    setVisible(false)
    setTimeout(() => { onSaved(); onClose() }, 280)
  }

  async function handleDelete() {
    if (!registro) return
    setDeleting(true)

    const { error: dbError } = await supabase
      .from('registros_diarios')
      .delete()
      .eq('id', registro.id)

    if (dbError) {
      setError('Error al eliminar.')
      setDeleting(false)
      return
    }

    setDeleting(false)
    setVisible(false)
    setTimeout(() => { onSaved(); onClose() }, 280)
  }

  if (!registro) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] transition-all duration-300"
        style={{
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(4px)',
          opacity: visible ? 1 : 0,
        }}
        onClick={handleClose}
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[70] rounded-t-3xl flex flex-col transition-transform duration-300 ease-out"
        style={{
          background: 'var(--surface-container-highest)',
          border: '1px solid var(--outline-variant)',
          borderBottom: 'none',
          maxHeight: '92dvh',
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--outline-variant)' }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3"
          style={{ borderBottom: '1px solid var(--outline-variant)' }}>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--on-surface-variant)' }}>
              Editar registro
            </p>
            <p className="text-sm font-semibold capitalize mt-0.5" style={{ color: 'var(--on-surface)' }}>
              {formatFechaLarga(registro.fecha)}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl transition-colors"
            style={{ color: 'var(--on-surface-variant)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">

          {/* Peso */}
          <div
            className="rounded-xl px-4 py-3"
            style={{ background: 'var(--surface-container-high)', border: '1px solid var(--outline-variant)' }}
          >
            <label htmlFor="edit-peso"
              className="text-[10px] font-bold uppercase tracking-widest block mb-1"
              style={{ color: 'var(--on-surface-variant)' }}>
              Peso
            </label>
            <div className="flex items-end gap-2">
              <input
                id="edit-peso"
                type="number"
                inputMode="decimal"
                step="0.1"
                min="20"
                max="300"
                value={peso}
                onChange={e => setPeso(e.target.value)}
                className="flex-1 bg-transparent outline-none text-4xl font-bold"
                style={{ color: 'var(--on-surface)' }}
                autoFocus
              />
              <span className="text-lg font-semibold pb-0.5" style={{ color: 'var(--on-surface-variant)' }}>
                kg
              </span>
            </div>
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Entrené', icon: Dumbbell, value: entreno, set: setEntreno, color: 'var(--primary)', bg: 'rgba(192,193,255,0.15)' },
              { label: 'Cardio', icon: Heart, value: cardio, set: setCardio, color: 'var(--secondary)', bg: 'rgba(78,222,163,0.12)' },
            ].map(({ label, icon: Icon, value, set, color, bg }) => (
              <button
                key={label}
                type="button"
                onClick={() => set(!value)}
                className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all active:scale-95"
                style={{
                  background: value ? bg : 'var(--surface-container-high)',
                  border: `1.5px solid ${value ? color : 'var(--outline-variant)'}`,
                  color: value ? color : 'var(--on-surface-variant)',
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
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--on-surface-variant)' }}>
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
                      background: active ? 'rgba(192,193,255,0.18)' : 'var(--surface-container)',
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
        </div>

        {/* Actions */}
        <div className="px-5 pt-3 pb-safe flex flex-col gap-2.5" style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}>

          {/* Delete */}
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all active:scale-[0.98]"
              style={{
                background: 'rgba(255,180,171,0.1)',
                border: '1px solid rgba(255,180,171,0.3)',
                color: 'var(--error)',
              }}
            >
              <Trash2 size={15} />
              Eliminar registro
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold"
                style={{ background: 'var(--surface-container-high)', color: 'var(--on-surface)' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
                style={{ background: 'rgba(255,180,171,0.2)', color: 'var(--error)', border: '1px solid rgba(255,180,171,0.4)' }}
              >
                {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                ¿Confirmar?
              </button>
            </div>
          )}

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving || !peso}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-40"
            style={{ background: 'var(--primary)', color: 'var(--on-primary)' }}
          >
            {saving
              ? <><Loader2 size={16} className="animate-spin" /> Guardando…</>
              : <><CheckCircle2 size={16} /> Guardar cambios</>
            }
          </button>
        </div>
      </div>
    </>
  )
}
