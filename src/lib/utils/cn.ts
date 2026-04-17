import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combina clases de Tailwind de forma segura
 * Maneja conflictos entre clases automáticamente
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
