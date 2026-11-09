// AI-GENERATED — not an architecture reference
import classes from '@admin/components/MemberAvatar.module.css'
import { AVATAR_COLOR_PALETTE, avatarPaletteEntry } from '@admin/utils/avatarColor'
import m, { type ClassComponent, type Vnode } from 'mithril'
import { t } from '@/i18n'

interface Attrs {
  size: number
  initials: string
  /** a picture instead of the letters, as a data URI */
  src?: string
  /** where the colour comes from where that is not what the circle shows (AS-010) */
  colorSeed?: string | null
  /** the colour as the server computed it (NU-017); where valid it wins over the seed */
  colorIndex?: number | null
  class?: string
  /** whose circle it is, for the button that opens the picture */
  name?: string
  /** opens the picture large: given only where there is one, and then the circle is a button */
  onzoom?: () => void
}

/** The circle of a member: their picture, or their letters on their colour. */
export class MemberAvatar implements ClassComponent<Attrs> {
  view({
    attrs: { size, initials, src, colorSeed, colorIndex, class: className, name, onzoom },
  }: Vnode<Attrs>) {
    const opens = onzoom !== undefined
    const zoomLabel = name ? t('avatar.zoom-open', { name }) : t('avatar.zoom-open-plain')
    const palette =
      (typeof colorIndex === 'number' && AVATAR_COLOR_PALETTE[colorIndex]) ||
      // a caller without a seed of its own colours from what the circle shows
      avatarPaletteEntry(colorSeed ?? initials)
    return m(
      `${opens ? 'button' : 'div'}.d-inline-flex.justify-content-center.align-items-center.rounded-circle`,
      {
        class: [classes.memberAvatar, opens ? classes.memberAvatarOpenable : '', className].join(
          ' ',
        ),
        type: opens ? 'button' : undefined,
        title: opens ? zoomLabel : undefined,
        'aria-label': opens ? zoomLabel : undefined,
        onclick: opens ? onzoom : undefined,
        'data-test': 'member-avatar',
        style: {
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: src ? undefined : palette.bg,
          textTransform: 'uppercase',
        },
      },
      src
        ? m('img', { class: classes.memberAvatarImage, src, alt: '' })
        : m(
            'span.fw-medium',
            { style: { fontSize: `${size * 0.4}px`, lineHeight: '1', color: palette.text } },
            initials,
          ),
    )
  }
}
