// AI-GENERATED — not an architecture reference
import { describe, it, expect } from 'vitest'
import { escapeHtml } from './escapeHtml'

describe('escapeHtml', () => {
  it('leaves ordinary text as it is', () => {
    expect(escapeHtml('Tobias')).toBe('Tobias')
    expect(escapeHtml('Ira-Erste_2 Ünal')).toBe('Ira-Erste_2 Ünal')
  })

  it('writes the five signs that mean something in markup as entities', () => {
    expect(escapeHtml(`<&>"'`)).toBe('&lt;&amp;&gt;&quot;&#39;')
  })

  it('escapes every one of them, not only the first', () => {
    expect(escapeHtml('<b>a</b> & <i>b</i>')).toBe(
      '&lt;b&gt;a&lt;/b&gt; &amp; &lt;i&gt;b&lt;/i&gt;',
    )
  })

  // The ampersand first would be wrong the other way round: an entity written here is text.
  it('does not read an entity that is already there as one', () => {
    expect(escapeHtml('&lt;')).toBe('&amp;lt;')
  })

  it('makes no element out of markup, set as the inside of one', () => {
    const box = document.createElement('div')
    box.innerHTML = `<span>${escapeHtml('<img src=x onerror="alert(1)">')}</span>`

    expect(box.querySelector('img')).toBeNull()
    expect(box.querySelector('span').children).toHaveLength(0)
    expect(box.textContent).toBe('<img src=x onerror="alert(1)">')
  })

  it('writes nothing for nothing', () => {
    expect(escapeHtml(null)).toBe('')
    expect(escapeHtml(undefined)).toBe('')
    expect(escapeHtml(0)).toBe('0')
  })
})
