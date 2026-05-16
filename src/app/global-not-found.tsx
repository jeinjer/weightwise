import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

export default function GlobalNotFound() {
  return (
    <html lang="es">
      <head>
        <title>404 - Página no encontrada | WeightWise</title>
      </head>
      <body style={{ margin: 0, padding: 0 }}>
        <div 
          className="flex flex-col items-center justify-center min-h-[100dvh] px-4 text-center" 
          style={{ 
            background: '#131313',
            color: '#e3e3e3',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}
        >
          <div 
            className="w-16 h-16 rounded-3xl flex items-center justify-center mb-6"
            style={{ background: 'rgba(255, 180, 171, 0.1)', color: '#ffb4ab' }}
          >
            <AlertCircle size={32} strokeWidth={2.5} />
          </div>
          
          <h1 className="text-3xl font-bold mb-2 tracking-tight">
            404
          </h1>
          
          <p className="text-sm max-w-[260px] mx-auto mb-8 font-medium" style={{ color: '#c7c7c7' }}>
            La ruta a la que intentás acceder no existe o fue movida.
          </p>

          <Link
            href="/progreso"
            className="px-8 py-3.5 rounded-full font-bold text-sm transition-transform active:scale-95"
            style={{ 
              background: '#00e676', 
              color: '#00391c',
              textDecoration: 'none'
            }}
          >
            Volver a Progreso
          </Link>
        </div>
      </body>
    </html>
  )
}
