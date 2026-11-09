// AI-GENERATED — not an architecture reference
import classes from '@admin/components/VariantIcon.module.css'
import { type ClassComponent, type Vnode } from 'mithril'
import checkIcon from '~icons/bi/check'
import personFillIcon from '~icons/bi/person-fill'
import xCircleIcon from '~icons/bi/x-circle'
import { icon } from './icon'

const ICONS = { check: checkIcon, 'x-circle': xCircleIcon, 'person-fill': personFillIcon }

interface Attrs {
  icon: keyof typeof ICONS
  /** a Bootstrap colour: success, danger, ... */
  variant: string
}

/** An icon in the colour of a Bootstrap variant. */
export class VariantIcon implements ClassComponent<Attrs> {
  view({ attrs }: Vnode<Attrs>) {
    return icon(ICONS[attrs.icon], {
      class: classes.iconVariant,
      style: `--icon-variant-color: var(--bs-${attrs.variant})`,
    })
  }
}
