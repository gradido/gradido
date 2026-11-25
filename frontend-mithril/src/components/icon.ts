import m from 'mithril'

/**
 * An icon: the SVG text of an `~icons/<set>/<name>` import, with attributes of its own
 * (`class`, `aria-label`, …). The values are written by the caller, never typed by a member.
 * With an `aria-label` it is a picture of that name; without, it is hidden from a screen
 * reader: what stands beside it says the same.
 */
export function icon(svg: string, attributes: Record<string, string> = {}) {
  const named = 'aria-label' in attributes ? { role: 'img' } : { 'aria-hidden': 'true' }
  const written = Object.entries({ ...named, ...attributes }).map(
    ([name, value]) => `${name}="${value}" `,
  )
  return m.trust(svg.replace('<svg ', `<svg ${written.join('')}`))
}
