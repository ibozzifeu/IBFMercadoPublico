'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const username = (form.elements.namedItem('username') as HTMLInputElement).value
    const password = (form.elements.namedItem('password') as HTMLInputElement).value

    setCargando(true)
    setError(null)

    const result = await signIn('credentials', {
      username,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError('Credenciales incorrectas')
      setCargando(false)
    } else {
      router.push('/licitaciones')
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-background'>
      <div className='w-full max-w-sm p-8 rounded-xl border border-border shadow-sm'>
        <h1 className='text-2xl font-bold mb-2'>Monitor Licitaciones TI</h1>
        <p className='text-sm text-muted-foreground mb-6'>Ingresa tus credenciales para continuar</p>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <label className='block text-sm font-medium mb-1' htmlFor='username'>
              Usuario
            </label>
            <input
              id='username'
              name='username'
              type='text'
              required
              autoComplete='username'
              className='w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring'
            />
          </div>

          <div>
            <label className='block text-sm font-medium mb-1' htmlFor='password'>
              Contraseña
            </label>
            <input
              id='password'
              name='password'
              type='password'
              required
              autoComplete='current-password'
              className='w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring'
            />
          </div>

          {error && (
            <p className='text-sm text-destructive'>{error}</p>
          )}

          <button
            type='submit'
            disabled={cargando}
            className='w-full py-2 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors'
          >
            {cargando ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
