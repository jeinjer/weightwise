'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import {
  Flag, SlidersHorizontal, LogOut, Loader2, CheckCircle2,
  User, Scale, Trash2, ChevronRight,
} from 'lucide-react'

interface Configuracion {
  peso_inicial: number | null
  peso_objetivo: number | null
  altura: number | null
}

// ── Reusable number input field ───────────────────────────
function ConfigField({
  id, label, value, unit, min, max, step, placeholder, onChange,
}: {
  id: string; label: string; value: string; unit: string
  min: number; max: number; step: number; placeholder: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center justify-between py-3.5"
      style={{ borderBottom: '1px solid var(--outline-variant)' }}>
      <label htmlFor={id} className="text-sm font-medium" style={{ color: 'var(--on-surface)' }}>
        {label}
      </label>
      <div className="flex items-center gap-1">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          step={step}
          min={min}
          max={max}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-20 text-right bg-transparent outline-none text-sm font-bold"
          style={{ color: 'var(--primary)' }}
        />
        <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>{unit}</span>
      </div>
    </div>
  )
}

// ── Section card wrapper ──────────────────────────────────
function Section({ icon: Icon, title, children }: {
  icon: React.ElementType; title: string; children: React.ReactNode
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--surface-container)', border: '1px solid var(--outline-variant)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3"
        style={{ borderBottom: '1px solid var(--outline-variant)' }}>
        <Icon size={14} style={{ color: 'var(--primary)' }} />
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--on-surface-variant)' }}>
          {title}
        </span>
      </div>
      <div className="px-4">{children}</div>
    </div>
  )
}

export default function ConfiguracionPage() {
  const supabase = createClient()
  const router   = useRouter()

  const [email, setEmail]   = useState('')
  const [config, setConfig] = useState<Configuracion>({
    peso_inicial: null, peso_objetivo: null, altura: null,
  })
  const [form, setForm] = useState({
    peso_inicial: '', peso_objetivo: '', altura: '',
  })
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setEmail(user.email ?? '')

    const { data: cfg } = await supabase
      .from('configuracion_usuario')
      .select('peso_inicial, peso_objetivo, altura')
      .eq('id', user.id)
      .maybeSingle()

    if (cfg) {
      setConfig(cfg)
      setForm({
        peso_inicial: cfg.peso_inicial?.toString() ?? '',
        peso_objetivo: cfg.peso_objetivo?.toString() ?? '',
        altura: cfg.altura?.toString() ?? '',
      })
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    queueMicrotask(() => {
      void fetchData()
    })
  }, [fetchData])

  async function handleSave() {
    setSaving(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const payload = {
      id: user.id,
      peso_inicial: form.peso_inicial ? parseFloat(form.peso_inicial) : config.peso_inicial,
      peso_objetivo: form.peso_objetivo ? parseFloat(form.peso_objetivo) : config.peso_objetivo,
      altura: form.altura ? parseFloat(form.altura) : config.altura,
    }

    const { error: dbError } = await supabase
      .from('configuracion_usuario')
      .upsert(payload)

    if (dbError) {
      setError('Error al guardar. Intentá de nuevo.')
      setSaving(false)
      return
    }

    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
    setSaving(false)
    fetchData()
  }

  async function handleDeleteAllRecords() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('registros_diarios')
      .delete()
      .eq('user_id', user.id)

    setShowDeleteConfirm(false)
    router.refresh()
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Derived: IMC
  const pesoActual = form.peso_objetivo ? parseFloat(form.peso_objetivo) : config.peso_objetivo
  const alturaNum  = form.altura ? parseFloat(form.altura) : config.altura
  const imc = pesoActual && alturaNum ? pesoActual / ((alturaNum / 100) ** 2) : null

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 pb-6 flex flex-col gap-5 page-enter">

      {/* Header */}
      <h1 className="text-xl font-bold" style={{ color: 'var(--on-surface)' }}>
        Configuración
      </h1>

      {/* Profile card */}
      <div
        className="rounded-2xl p-4 flex items-center gap-4"
        style={{ background: 'var(--surface-container)', border: '1px solid var(--outline-variant)' }}
      >
        {/* Avatar */}
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
          style={{ background: 'rgba(192,193,255,0.18)' }}
        >
          <User size={22} style={{ color: 'var(--primary)' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate" style={{ color: 'var(--on-surface)' }}>
            Mi cuenta
          </p>
          <p className="text-xs truncate mt-0.5" style={{ color: 'var(--on-surface-variant)' }}>
            {email}
          </p>
        </div>
      </div>

      {/* Metas de Peso */}
      <Section icon={Flag} title="Metas de Peso">
        <ConfigField
          id="peso-inicial"
          label="Peso inicial"
          value={form.peso_inicial}
          unit="kg"
          min={20} max={300} step={0.1}
          placeholder={config.peso_inicial?.toString() ?? '—'}
          onChange={v => setForm(f => ({ ...f, peso_inicial: v }))}
        />
        <ConfigField
          id="peso-objetivo"
          label="Peso objetivo"
          value={form.peso_objetivo}
          unit="kg"
          min={20} max={300} step={0.1}
          placeholder={config.peso_objetivo?.toString() ?? '—'}
          onChange={v => setForm(f => ({ ...f, peso_objetivo: v }))}
        />
        <ConfigField
          id="altura"
          label="Altura"
          value={form.altura}
          unit="cm"
          min={100} max={250} step={1}
          placeholder={config.altura?.toString() ?? '—'}
          onChange={v => setForm(f => ({ ...f, altura: v }))}
        />
        {/* IMC estimado */}
        {imc != null && (
          <div className="py-3 flex items-center justify-between">
            <span className="text-sm font-medium" style={{ color: 'var(--on-surface-variant)' }}>
              IMC estimado
            </span>
            <span className="text-sm font-bold" style={{ color: 'var(--primary)' }}>
              {imc.toFixed(1)}
            </span>
          </div>
        )}
      </Section>

      {/* Preferencias */}
      <Section icon={SlidersHorizontal} title="Preferencias">
        <button
          className="w-full flex items-center justify-between py-3.5 text-sm font-medium"
          style={{ color: 'var(--on-surface)', borderBottom: '1px solid var(--outline-variant)' }}
          onClick={() => router.push('/onboarding')}
        >
          <div className="flex items-center gap-2">
            <Scale size={15} style={{ color: 'var(--on-surface-variant)' }} />
            Repetir onboarding
          </div>
          <ChevronRight size={15} style={{ color: 'var(--on-surface-variant)' }} />
        </button>
        <button
          className="w-full flex items-center justify-between py-3.5 text-sm font-medium"
          style={{ color: 'var(--on-surface)', borderBottom: '1px solid var(--outline-variant)' }}
          onClick={() => setShowDeleteConfirm(true)}
        >
          <div className="flex items-center gap-2">
            <Trash2 size={15} style={{ color: 'var(--error)' }} />
            <span style={{ color: 'var(--error)' }}>Borrar todos los registros</span>
          </div>
          <ChevronRight size={15} style={{ color: 'var(--on-surface-variant)' }} />
        </button>
        <button
          className="w-full flex items-center justify-between py-3.5 text-sm font-medium"
          style={{ color: 'var(--on-surface)' }}
          onClick={handleLogout}
        >
          <div className="flex items-center gap-2">
            <LogOut size={15} style={{ color: 'var(--on-surface-variant)' }} />
            Cerrar sesión
          </div>
          <ChevronRight size={15} style={{ color: 'var(--on-surface-variant)' }} />
        </button>
      </Section>

      {/* Error */}
      {error && (
        <p className="text-xs" style={{ color: 'var(--error)' }}>{error}</p>
      )}

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-50"
        style={{
          background: saved ? 'var(--secondary)' : 'var(--primary)',
          color: saved ? 'var(--on-secondary)' : 'var(--on-primary)',
        }}
      >
        {saving
          ? <><Loader2 size={16} className="animate-spin" /> Guardando…</>
          : saved
          ? <><CheckCircle2 size={16} /> ¡Cambios guardados!</>
          : 'Guardar cambios'
        }
      </button>

      {/* Delete confirm modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-4"
            style={{ background: 'var(--surface-container-highest)', border: '1px solid var(--outline-variant)' }}
          >
            <div className="flex flex-col gap-1">
              <p className="font-bold" style={{ color: 'var(--on-surface)' }}>
                ¿Borrar todos los registros?
              </p>
              <p className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>
                Esta acción es irreversible. Se eliminarán permanentemente todos tus registros de peso.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold"
                style={{ background: 'var(--surface-container-high)', color: 'var(--on-surface)' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAllRecords}
                className="flex-1 py-3 rounded-xl text-sm font-semibold"
                style={{ background: 'rgba(255,180,171,0.2)', color: 'var(--error)', border: '1px solid rgba(255,180,171,0.4)' }}
              >
                Borrar todo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* App version */}
      <p className="text-center text-[10px]" style={{ color: 'var(--outline)' }}>
        WeightWise v1.0 · Datos almacenados de forma segura
      </p>
    </div>
  )
}
