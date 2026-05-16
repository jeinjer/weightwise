'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Eye, EyeOff, Scale, AlertCircle, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd]   = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError('Email o contraseña incorrectos. Intentá de nuevo.')
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-6 py-12"
      style={{ background: 'var(--surface)' }}
    >
      {/* ── Brand ── */}
      <div className="flex flex-col items-center gap-3 mb-10">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: 'var(--primary-container)' }}
        >
          <Scale
            size={32}
            style={{ color: 'var(--on-primary)' }}
            strokeWidth={2}
          />
        </div>
        <div className="text-center">
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ color: 'var(--on-surface)' }}
          >
            WeightWise
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: 'var(--on-surface-variant)' }}
          >
            Control preciso. Resultados reales.
          </p>
        </div>
      </div>

      {/* ── Card ── */}
      <div
        className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-5"
        style={{
          background: 'var(--surface-container)',
          border: '1px solid var(--outline-variant)',
        }}
      >
        <h2
          className="text-lg font-semibold"
          style={{ color: 'var(--on-surface)' }}
        >
          Iniciar sesión
        </h2>

        {/* ── Error banner ── */}
        {error && (
          <div
            className="flex items-start gap-3 rounded-xl p-3 text-sm"
            style={{
              background: 'rgba(255,180,171,0.12)',
              border: '1px solid rgba(255,180,171,0.3)',
              color: 'var(--error)',
            }}
          >
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="text-xs font-medium tracking-wide uppercase"
              style={{ color: 'var(--on-surface-variant)' }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
              style={{
                background: 'var(--surface-container-high)',
                border: '1px solid var(--outline-variant)',
                color: 'var(--on-surface)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary)'
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(192,193,255,0.15)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--outline-variant)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-xs font-medium tracking-wide uppercase"
              style={{ color: 'var(--on-surface-variant)' }}
            >
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPwd ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl px-4 py-3 pr-12 text-sm outline-none transition-all"
                style={{
                  background: 'var(--surface-container-high)',
                  border: '1px solid var(--outline-variant)',
                  color: 'var(--on-surface)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)'
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(192,193,255,0.15)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--outline-variant)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors"
                style={{ color: 'var(--on-surface-variant)' }}
                aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-1"
            style={{
              background: 'var(--primary)',
              color: 'var(--on-primary)',
            }}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Ingresando…
              </>
            ) : (
              'Ingresar'
            )}
          </button>
        </form>

        {/* ── Footer links ── */}
        <div className="flex flex-col items-center gap-2 pt-2">
          <button
            type="button"
            className="text-sm transition-colors"
            style={{ color: 'var(--primary)' }}
          >
            ¿Olvidaste tu contraseña?
          </button>
          <p className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>
            ¿No tenés cuenta?{' '}
            <button
              type="button"
              className="font-semibold"
              style={{ color: 'var(--secondary)' }}
            >
              Registrate ahora
            </button>
          </p>
        </div>
      </div>
    </main>
  )
}
