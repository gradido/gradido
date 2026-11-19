// AI-GENERATED — not an architecture reference
import { defineComponent } from 'vue'
import IBiBalloonHeart from '~icons/bi/balloon-heart'
import IBiBellFill from '~icons/bi/bell-fill'
import IBiCheck from '~icons/bi/check'
import IBiDropletHalf from '~icons/bi/droplet-half'
import IBiExclamationTriangle from '~icons/bi/exclamation-triangle'
import IBiGift from '~icons/bi/gift'
import IBiHeart from '~icons/bi/heart'
import IBiLink from '~icons/bi/link'
import IBiLink45deg from '~icons/bi/link-45deg'
import IBiPersonCheck from '~icons/bi/person-check'
import IBiQuestion from '~icons/bi/question'
import IBiTrash from '~icons/bi/trash'
import IBiXCircle from '~icons/bi/x-circle'
import ITablerCards from '~icons/tabler/cards'
import classes from './VariantIcon.module.scss'

const ICONS: Record<string, typeof IBiCheck> = {
  check: IBiCheck,
  'x-circle': IBiXCircle,
  link45deg: IBiLink45deg,
  link: IBiLink,
  'droplet-half': IBiDropletHalf,
  trash: IBiTrash,
  question: IBiQuestion,
  'bell-fill': IBiBellFill,
  'exclamation-triangle': IBiExclamationTriangle,
  heart: IBiHeart,
  'person-check': IBiPersonCheck,
  gift: IBiGift,
  // A heart-shaped balloon, for a thank-you greeting (Bernd chose it on 16.10.2026). It
  // replaced a bunch of flowers drawn here by hand, which at the size of a line of text
  // did not read as flowers.
  'balloon-heart': IBiBalloonHeart,
  // Two cards lying on top of each other. Deliberately NOT a credit card: a thank you
  // card is a printed piece of paper, and every card icon that carries a chip or a
  // magnetic stripe says bank. (Bernd chose this one on 19.08.2026.)
  cards: ITablerCards,
}

export const VariantIcon = defineComponent({
  name: 'VariantIcon',
  props: {
    icon: { type: String, default: '' },
    variant: { type: String, default: 'gray-dark' },
  },
  setup(props) {
    // Read once, as the template's `ref` was: a variant that changes later does not recolour.
    const color = `var(--bs-${props.variant})`

    return () => {
      const Icon = ICONS[props.icon]
      return Icon ? (
        <Icon class={['icon-variant', classes.icon]} style={{ '--variant-icon-color': color }} />
      ) : null
    }
  },
})
