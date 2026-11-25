// AI-GENERATED — not an architecture reference
import { expect, it } from 'bun:test'
import { icon } from './icon'

const svg = '<svg viewBox="0 0 16 16"><path d="M0 0"/></svg>'

it('draws the icon as it is', () => {
  expect(icon(svg).children).toBe(svg)
})

it('writes its attributes onto the svg', () => {
  expect(icon(svg, { class: 'me-2', 'aria-hidden': 'true' }).children).toBe(
    '<svg class="me-2" aria-hidden="true" viewBox="0 0 16 16"><path d="M0 0"/></svg>',
  )
})
