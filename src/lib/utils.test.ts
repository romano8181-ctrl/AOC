import { describe, expect, it } from 'vitest'
import { cn } from './utils'

// Smoke test: proves Vitest and the @/ setup work. Domain tests arrive in T-03..T-07.
describe('cn', () => {
  it('merges class names and resolves Tailwind conflicts', () => {
    const isHidden = false
    expect(cn('px-2', 'px-4', isHidden && 'hidden', 'text-sm')).toBe('px-4 text-sm')
  })
})
