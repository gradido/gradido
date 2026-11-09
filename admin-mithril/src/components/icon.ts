// AI-GENERATED — not an architecture reference
import m from 'mithril'

/** An icon (the SVG text of `~icons/...`) with attributes of its own, as the old admin drew it. */
export const icon = (svg: string, attributes: Record<string, string>) =>
  m.trust(
    svg.replace(
      '<svg ',
      `<svg ${Object.entries(attributes)
        .map(([name, value]) => `${name}="${value}"`)
        .join(' ')} `,
    ),
  )
