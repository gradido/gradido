import m from 'mithril'

/**
 * An icon: the SVG text of an `~icons/<set>/<name>` import, with attributes of its own
 * (`class`, `aria-label`, …). The values are written by the caller, never typed by a member.
 */
export function icon(svg: string, attributes: Record<string, string> = {}) {
  const written = Object.entries(attributes).map(([name, value]) => `${name}="${value}" `)
  return m.trust(svg.replace('<svg ', `<svg ${written.join('')}`))
}
