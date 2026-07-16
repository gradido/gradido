import { describe, it, expect, beforeEach } from 'vitest'
import { useCreaSupplement } from './useCreaSupplement'

describe('useCreaSupplement', () => {
  beforeEach(() => {
    localStorage.clear()
    useCreaSupplement().setLastSupplement('')
  })

  it('stores and exposes the last supplement reactively', () => {
    const { lastSupplement, setLastSupplement } = useCreaSupplement()
    expect(lastSupplement.value).toBe('')
    setLastSupplement('Genehmigt, da frei geteilte Impulse.')
    expect(lastSupplement.value).toBe('Genehmigt, da frei geteilte Impulse.')
  })

  it('persists the value to localStorage', () => {
    useCreaSupplement().setLastSupplement('a note')
    expect(localStorage.getItem('crea.lastSupplement')).toBe('a note')
  })

  it('shares one value across all callers', () => {
    const a = useCreaSupplement()
    const b = useCreaSupplement()
    a.setLastSupplement('shared')
    expect(b.lastSupplement.value).toBe('shared')
  })
})
