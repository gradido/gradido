// AI-GENERATED — not an architecture reference
import { expect, it } from 'bun:test'
import { icon } from './icon'

const svg = '<svg viewBox="0 0 16 16"><path d="M0 0"/></svg>'

it('hides an icon without a name from a screen reader', () => {
  expect(icon(svg).children).toBe(
    '<svg aria-hidden="true" viewBox="0 0 16 16"><path d="M0 0"/></svg>',
  )
})

it('is a picture where it has a name', () => {
  expect(icon(svg, { 'aria-label': 'Sent' }).children).toBe(
    '<svg role="img" aria-label="Sent" viewBox="0 0 16 16"><path d="M0 0"/></svg>',
  )
})

it('writes its attributes onto the svg', () => {
  expect(icon(svg, { class: 'me-2', 'aria-hidden': 'true' }).children).toBe(
    '<svg aria-hidden="true" class="me-2" viewBox="0 0 16 16"><path d="M0 0"/></svg>',
  )
})
