'use client'

import { Input } from '@/components/comun/Input'
import { Search, X } from 'lucide-react'
import { useCallback, useState, useEffect } from 'react'

interface BuscaTextoProps {
  valor: string
  onChange: (valor: string) => void
  placeholder?: string
  debounceMs?: number
}

export function BuscaTexto({ valor, onChange, placeholder = 'Buscar licitaciones...', debounceMs = 300 }: BuscaTextoProps) {
  const [inputValue, setInputValue] = useState(valor)

  // Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(inputValue)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [inputValue, onChange, debounceMs])

  const handleLimpiar = useCallback(() => {
    setInputValue('')
    onChange('')
  }, [onChange])

  return (
    <div className='relative'>
      <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
      <Input
        placeholder={placeholder}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        className='pl-10 pr-10'
      />
      {inputValue && (
        <button
          onClick={handleLimpiar}
          className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
        >
          <X className='h-4 w-4' />
        </button>
      )}
    </div>
  )
}
