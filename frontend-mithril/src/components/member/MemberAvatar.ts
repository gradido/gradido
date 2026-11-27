// AI-GENERATED — not an architecture reference
import './MemberAvatar.css'
import { avatarPaletteEntry } from '@frontend/utils/avatarColor'
import m from 'mithril'

type Attrs = m.Attributes & {
  /** in pixels */
  size: number
  initials: string
  /** a picture instead of the letters, as a data URI */
  src?: string
  /** where the colour comes from where that is not the letters shown */
  colorSeed?: string
}

/**
 * The circle of a member: their picture, or their letters on their colour. Every other
 * attribute goes to the circle (`class`, `aria-hidden`).
 */
export class MemberAvatar implements m.ClassComponent<Attrs> {
  view({ attrs: { size, initials, src, colorSeed, ...circle } }: m.Vnode<Attrs>) {
    return m(
      '.app-avatar.d-flex.justify-content-center.align-items-center.rounded-circle',
      {
        ...circle,
        style: {
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: src ? undefined : avatarPaletteEntry(colorSeed ?? initials).bg,
          textTransform: 'uppercase',
        },
      },
      src
        ? m('img.app-avatar-image', { src, alt: '' })
        : m(
            'span.font-medium',
            { style: { fontSize: `${size * 0.4}px`, lineHeight: '1', color: '#fff' } },
            initials,
          ),
    )
  }
}
