'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Scale, ChevronRight, Loader2 } from 'lucide-react'

interface Step {
  id: number
  label: string
  sublabel: string
  field: 'peso_inicial' | 'peso_objetivo' | 'altura'
  unit: string
  min: number
  max: number
  step: number
  placeholder: string
  emoji: string
}

const STEPS: Step[] = [
  {
    id: 1,
    label: 'Tu peso actual',
    sublabel: 'Usaremos esto como punto de partida para calcular tu progreso.',
    field: 'peso_inicial',
    unit: 'kg',
    min: 20,
    max: 300,
    step: 0.1,
    placeholder: '75.0',
    emoji: '⚖️',
  },
  {
    id: 2,
    label: 'Tu peso objetivo',
    sublabel: 'Tu meta es lo que nos guía. Podés cambiarlo cuando quieras.',
    field: 'peso_objetivo',
    unit: 'kg',
    min: 20,
    max: 300,
    step: 0.1,
    placeholder: '68.0',
    emoji: '🎯',
  },
  {
    id: 3,
    label: 'Tu altura',
    sublabel: 'Necesitamos tu altura para calcular tu IMC correctamente.',
    field: 'altura',
    unit: 'cm',
    min: 100,
    max: 250,
    step: 1,
    placeholder: '170',
    emoji: '📏',
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()

  const [currentStep, setCurrentStep] = useState(0)
  const [values, setValues] = useState({ peso_inicial: '', peso_objetivo: '', altura: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const step = STEPS[currentStep]
  const isLast = currentStep === STEPS.length - 1
  const progress = ((currentStep + 1) / STEPS.length) * 100

  function handleNext() {
    const val = values[step.field]
    if (!val || isNaN(parseFloat(val))) return
    if (isLast) {
      handleSave()
    } else {
      setCurrentStep(prev => prev + 1)
    }
  }

  async function handleSave() {
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { error: dbError } = await supabase
      .from('configuracion_usuario')
      .upsert({
        id: user.id,
        peso_inicial: parseFloat(values.peso_inicial),
        peso_objetivo: parseFloat(values.peso_objetivo),
        altura: parseFloat(values.altura),
      })

    if (dbError) {
      setError('Error al guardar. Intentá de nuevo.')
      setLoading(false)
      return
    }

    router.push('/progreso')
    router.refresh()
  }

  return (
    <main
      className="min-h-dvh flex flex-col px-6 py-10"
      style={{ background: 'var(--surface)' }}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 mb-8">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'var(--primary-container)' }}
        >
          <Scale size={18} style={{ color: 'var(--on-primary)' }} strokeWidth={2.5} />
        </div>
        <span className="font-bold text-base" style={{ color: 'var(--on-surface)' }}>
          WeightWise
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="w-full h-1 rounded-full mb-8 overflow-hidden"
        style={{ background: 'var(--surface-container-high)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${progress}%`,
            background: 'var(--primary)',
          }}
        />
      </div>

      {/* Step indicator */}
      <div className="flex gap-1.5 mb-6">
        {STEPS.map((s, i) => (
          <div
            key={s.id}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{
              background: i <= currentStep ? 'var(--primary)' : 'var(--outline-variant)',
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col">
        <span className="text-4xl mb-4">{step.emoji}</span>

        <h1
          className="text-2xl font-bold mb-2 leading-tight"
          style={{ color: 'var(--on-surface)' }}
        >
          {step.label}
        </h1>
        <p
          className="text-sm mb-8 leading-relaxed"
          style={{ color: 'var(--on-surface-variant)' }}
        >
          {step.sublabel}
        </p>

        {/* Input */}
        <div
          className="rounded-2xl p-5 flex flex-col gap-1 mb-4"
          style={{
            background: 'var(--surface-container)',
            border: '1px solid var(--outline-variant)',
          }}
        >
          <label
            htmlFor="onboarding-input"
            className="text-xs font-medium tracking-widest uppercase"
            style={{ color: 'var(--on-surface-variant)' }}
          >
            {step.label} ({step.unit})
          </label>
          <div className="flex items-end gap-2">
            <input
              id="onboarding-input"
              type="number"
              inputMode="decimal"
              step={step.step}
              min={step.min}
              max={step.max}
              placeholder={step.placeholder}
              value={values[step.field]}
              onChange={e => setValues(prev => ({ ...prev, [step.field]: e.target.value }))}
              className="flex-1 bg-transparent outline-none text-5xl font-bold tracking-tight"
              style={{ color: 'var(--on-surface)' }}
              autoFocus
            />
            <span
              className="text-xl font-medium pb-1"
              style={{ color: 'var(--on-surface-variant)' }}
            >
              {step.unit}
            </span>
          </div>
        </div>

        {/* Quick picker */}
        {step.unit === 'kg' && (
          <div className="flex gap-2 flex-wrap mb-6">
            {(step.field === 'peso_inicial'
              ? [60, 65, 70, 75, 80, 85, 90, 95, 100]
              : [55, 60, 65, 70, 75, 80]
            ).map(v => (
              <button
                key={v}
                type="button"
                onClick={() => setValues(prev => ({ ...prev, [step.field]: String(v) }))}
                className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95"
                style={{
                  background: values[step.field] === String(v)
                    ? 'rgba(192,193,255,0.2)'
                    : 'var(--surface-container)',
                  border: `1px solid ${values[step.field] === String(v) ? 'var(--primary)' : 'var(--outline-variant)'}`,
                  color: values[step.field] === String(v) ? 'var(--primary)' : 'var(--on-surface-variant)',
                }}
              >
                {v} kg
              </button>
            ))}
          </div>
        )}
        {step.unit === 'cm' && (
          <div className="flex gap-2 flex-wrap mb-6">
            {[155, 160, 165, 170, 175, 180, 185, 190].map(v => (
              <button
                key={v}
                type="button"
                onClick={() => setValues(prev => ({ ...prev, [step.field]: String(v) }))}
                className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95"
                style={{
                  background: values[step.field] === String(v)
                    ? 'rgba(192,193,255,0.2)'
                    : 'var(--surface-container)',
                  border: `1px solid ${values[step.field] === String(v) ? 'var(--primary)' : 'var(--outline-variant)'}`,
                  color: values[step.field] === String(v) ? 'var(--primary)' : 'var(--on-surface-variant)',
                }}
              >
                {v} cm
              </button>
            ))}
          </div>
        )}

        {error && (
          <p className="text-xs mb-3" style={{ color: 'var(--error)' }}>{error}</p>
        )}

        {/* CTA */}
        <button
          onClick={handleNext}
          disabled={!values[step.field] || loading}
          className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold transition-all active:scale-[0.98] disabled:opacity-40 mt-auto"
          style={{
            background: 'var(--primary)',
            color: 'var(--on-primary)',
          }}
        >
          {loading ? (
            <><Loader2 size={18} className="animate-spin" /> Guardando…</>
          ) : isLast ? (
            '¡Empezar a trackear! 🚀'
          ) : (
            <>Siguiente <ChevronRight size={18} /></>
          )}
        </button>

        {/* Step counter */}
        <p
          className="text-center text-xs mt-4"
          style={{ color: 'var(--on-surface-variant)' }}
        >
          Paso {currentStep + 1} de {STEPS.length}
        </p>
      </div>
    </main>
  )
}
