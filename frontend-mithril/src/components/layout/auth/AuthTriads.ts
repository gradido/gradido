// AI-GENERATED — not an architecture reference

import m from 'mithril'
import { repeatWhileVisible } from '@/browser/timer'
import { t } from '@/i18n'
import classes from './AuthTriads.module.css'

// how long one triad stays before the next one slides in
const TRIAD_INTERVAL_MS = 7000
// two full rounds, then the slogan stays where it is
const ROUNDS = 2

// read when drawn: in the language shown then
const TRIADS = {
  slogan: () => [
    t('auth.triads.slogan.help'),
    t('auth.triads.slogan.give'),
    t('auth.triads.slogan.thank'),
  ],
  design: () => [
    t('auth.triads.design.communityBased'),
    t('auth.triads.design.decentralized'),
    t('auth.triads.design.openSource'),
  ],
  purpose: () => [
    t('auth.triads.purpose.youAndMe'),
    t('auth.triads.purpose.community'),
    t('auth.triads.purpose.nature'),
  ],
}
const NAMES = ['slogan', 'design', 'purpose'] as const

/** Runs once what `dom` is moved by is over. */
const moved = (dom: Element) =>
  Promise.allSettled(dom.getAnimations().map((animation) => animation.finished))

/**
 * Three times three words above a sign-in form, one triad after the other, sliding as the
 * pictures on the desk do. They stop after two rounds, and as soon as somebody is in a field:
 * nothing moves beside what is being typed.
 */
export class AuthTriads implements m.ClassComponent {
  #shown = 0
  #steps = 0
  #stop?: () => void

  oninit() {
    const stopTimer = repeatWhileVisible(TRIAD_INTERVAL_MS, () => {
      this.#shown = (this.#shown + 1) % NAMES.length
      this.#steps++
      // after two rounds the slogan is shown again
      if (this.#steps === ROUNDS * NAMES.length) {
        this.#stop?.()
      }
      // a timer, outside of Mithril's handlers
      m.redraw()
    })
    const stopWhenTyping = (event: Event) => {
      if (event.target instanceof Element && event.target.closest('input, textarea, select')) {
        this.#stop?.()
      }
    }
    document.addEventListener('focusin', stopWhenTyping)
    this.#stop = () => {
      stopTimer()
      document.removeEventListener('focusin', stopWhenTyping)
    }
  }

  onremove() {
    this.#stop?.()
  }

  #triad(name: (typeof NAMES)[number], attrs: m.Attributes) {
    return m(
      '.triad',
      attrs,
      TRIADS[name]().map((part) => m('span.triad-part', part)),
    )
  }

  view() {
    const shown = NAMES[this.#shown]
    return m(
      '.auth-triads.text-center',
      { class: classes.authTriads },
      // a screen reader gets the three triads once, not again with every change
      m(
        'span.visually-hidden',
        { 'data-test': 'triads-spoken' },
        NAMES.flatMap((name) => TRIADS[name]()).join(' '),
      ),
      m(
        '.triad-stage',
        { class: classes.triadStage, 'aria-hidden': 'true', 'data-test': 'triad-stage' },
        // Every triad once more, unseen, in the cell of the one shown: the cell is as high
        // as the tallest, and the form below does not move when one replaces another.
        NAMES.map((name) =>
          this.#triad(name, {
            class: `triad-sizer ${classes.triad} ${classes.triadSizer}`,
            'data-test': 'triad-sizer',
          }),
        ),
        // keyed, in a list of its own: another triad is another element, which slides
        [
          this.#triad(shown, {
            key: shown,
            class: classes.triad,
            'data-test': `triad-${shown}`,
            // The classes of the styles' slide (`triad-slide-*`, as Vue's transition set them):
            // in from the right, out to the left. Not the slogan the page starts with.
            oncreate: ({ dom }: m.VnodeDOM) => {
              if (this.#steps === 0) {
                return
              }
              dom.classList.add('triad-slide-enter-from', 'triad-slide-enter-active')
              // read, so that the browser has laid the start out before it is taken away
              dom.getBoundingClientRect()
              dom.classList.remove('triad-slide-enter-from')
              moved(dom).then(() => dom.classList.remove('triad-slide-enter-active'))
            },
            onbeforeremove: ({ dom }: m.VnodeDOM) => {
              dom.classList.add('triad-slide-leave-active', 'triad-slide-leave-to')
              return moved(dom)
            },
          }),
        ],
      ),
    )
  }
}
