'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h1>Error</h1>
          <p>{error.message || 'Algo salió mal'}</p>
          <button onClick={() => reset()}>Intentar de nuevo</button>
        </div>
      </body>
    </html>
  )
}
