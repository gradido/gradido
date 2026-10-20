// AI-GENERATED — not an architecture reference
import { computed, defineComponent, type PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import { AVATAR_COLOR_PALETTE, avatarPaletteEntry } from '@/utils/avatarColor'
import classes from './MemberAvatar.module.css'

// A button only where there is a picture to open, a plain div everywhere else: a tab stop
// on every circle of a moderation list would announce twenty controls that do nothing.
export const MemberAvatar = defineComponent({
  name: 'MemberAvatar',
  props: {
    size: { type: Number, default: 48 },
    name: { type: String, default: '' },
    initials: { type: String, default: '' },
    // A picture instead of the letters. The moderation interface passes a base64 data URI.
    src: { type: String, default: '' },
    // Where the COLOUR comes from, when that is not what the circle SHOWS: the letters follow
    // the alias, the colour keeps following the real initials (AS-010).
    colorSeed: { type: String as PropType<string | null>, default: null },
    // The same colour as a finished palette index, computed by the server from the real
    // initials (NU-017) -- for rows where the real name is not delivered at all. Where it is
    // given and valid it wins over the seed.
    colorIndex: { type: Number as PropType<number | null>, default: null },
    // Off where the circle is part of a button that does something else (the menu in the top
    // bar): a button inside a button is not valid, and the outer one takes the tap.
    zoomable: { type: Boolean, default: true },
  },
  emits: ['zoom'],
  setup(props, { emit }) {
    const opensPicture = computed(() => props.zoomable && Boolean(props.src))

    // The wallet's words for the same thing, under the same keys -- the two interfaces show the
    // same people, and a member should not be "enlarged" here and "opened" there. Without a name
    // the plain form, so a row whose member has no alias still says what the button does.
    const { t } = useI18n()
    const zoomLabel = computed(() =>
      props.name ? t('avatar.zoom-open', { name: props.name }) : t('avatar.zoom-open-plain'),
    )

    const palette = computed(() => {
      const index = props.colorIndex
      if (typeof index === 'number' && Number.isInteger(index) && AVATAR_COLOR_PALETTE[index]) {
        return AVATAR_COLOR_PALETTE[index]
      }
      // `?? initials`: a caller that has no separate seed colours from what the circle shows,
      // which is what every circle did before the two parted company.
      return avatarPaletteEntry(props.colorSeed ?? props.initials)
    })

    return () => {
      const Tag = opensPicture.value ? 'button' : 'div'
      return (
        <Tag
          class={[
            classes.memberAvatar,
            'd-inline-flex justify-content-center align-items-center rounded-circle',
            { [classes.memberAvatarOpenable]: opensPicture.value },
          ]}
          type={opensPicture.value ? 'button' : undefined}
          title={opensPicture.value ? zoomLabel.value : undefined}
          aria-label={opensPicture.value ? zoomLabel.value : undefined}
          style={{
            width: `${props.size}px`,
            height: `${props.size}px`,
            backgroundColor: props.src ? undefined : palette.value.bg,
            textTransform: 'uppercase',
          }}
          data-test='member-avatar'
          onClick={() => opensPicture.value && emit('zoom')}
        >
          {props.src ? (
            <img class={classes.memberAvatarImage} src={props.src} alt='' />
          ) : (
            <span
              style={{
                fontSize: `${props.size * 0.4}px`,
                lineHeight: '1',
                color: palette.value.text,
              }}
              class='fw-medium'
            >
              {props.initials}
            </span>
          )}
        </Tag>
      )
    }
  },
})
