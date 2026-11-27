// AI-GENERATED — not an architecture reference
import './AuthCarousel.css'
import m from 'mithril'
import { repeatWhileVisible } from '@/browser/timer'
import { t } from '@/i18n'

const SLIDE_INTERVAL_MS = 13_000
// long enough for a picture on a slow line, short enough that most visitors never pay for it
const FETCH_AHEAD_MS = 3_000

// the words read when drawn: in the language shown then
const SLIDES = [
  {
    picture: 'Foto_01_2400_small.jpg',
    words: () => [t('auth.left.gratitude'), t('auth.left.oneGratitude')],
  },
  {
    picture: 'Foto_05_2400_small.jpg',
    words: () => [t('auth.left.dignity'), t('auth.left.oneDignity')],
  },
  {
    picture: 'Foto_04_2400_small.jpg',
    words: () => [t('auth.left.donation'), t('auth.left.oneDonation')],
  },
]

/**
 * The three pictures beside the form on the desk, each with its two lines, one after the
 * other. They slide by Bootstrap's own classes: the next one is set beside the one shown
 * (`carousel-item-next`), then both move (`carousel-item-start`).
 *
 * Together the pictures weigh about a megabyte, and most visitors sign in before the second
 * is due. So a picture is fetched a little before its turn, and the two move only once it
 * is here: the one shown stays a moment longer rather than giving way to an empty grey box.
 */
export class AuthCarousel implements m.ClassComponent {
  #shown = 0
  #next?: number
  #moving = false
  // the pictures asked for: kept, so that the second round takes them from the cache
  #fetched = new Set([0])
  #stop?: () => void
  #fetchAhead?: ReturnType<typeof setTimeout>

  oninit() {
    this.#fetchAheadOf(1)
    let turnedAt = Date.now()
    this.#stop = repeatWhileVisible(SLIDE_INTERVAL_MS, () => {
      // A tab seen again calls at once. A picture that came only a moment ago stays: a tab
      // opened behind another, and seen then, would turn it at its first sight.
      if (Date.now() - turnedAt < SLIDE_INTERVAL_MS / 2) {
        return
      }
      turnedAt = Date.now()
      this.#next = (this.#shown + 1) % SLIDES.length
      // where the tab was hidden the turn comes at once: the picture is fetched now
      this.#fetched.add(this.#next)
      this.#fetchAheadOf((this.#next + 1) % SLIDES.length)
      // a timer, outside of Mithril's handlers
      m.redraw()
    })
  }

  onremove() {
    this.#stop?.()
    clearTimeout(this.#fetchAhead)
  }

  // the `<img>` fetches its picture once it has a `src`, shown or not
  #fetchAheadOf(index: number) {
    clearTimeout(this.#fetchAhead)
    this.#fetchAhead = setTimeout(() => {
      this.#fetched.add(index)
      m.redraw()
    }, SLIDE_INTERVAL_MS - FETCH_AHEAD_MS)
  }

  onupdate({ dom }: m.VnodeDOM) {
    // a picture that failed is `complete` as well, but has no width
    const nextPicture =
      this.#next === undefined ? undefined : dom.querySelectorAll('img')[this.#next]
    if (nextPicture?.complete && nextPicture.naturalWidth > 0 && !this.#moving) {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
        // Bootstrap moves nothing then, and no transition ends: the next one is shown at once
        this.#shown = this.#next ?? this.#shown
        this.#next = undefined
      } else {
        // read, so that the browser has set the next picture beside before the two move
        dom.getBoundingClientRect()
        this.#moving = true
      }
      m.redraw()
    }
  }

  view() {
    return m(
      '.carousel',
      m(
        '.carousel.slide',
        m(
          '.carousel-inner',
          SLIDES.map(({ picture, words }, index) =>
            m(
              '.carousel-item',
              {
                class: [
                  index === this.#shown ? 'active' : '',
                  index === this.#next ? 'carousel-item-next' : '',
                  this.#moving && (index === this.#shown || index === this.#next)
                    ? 'carousel-item-start'
                    : '',
                ].join(' '),
                // until the picture is here
                style: { background: 'rgb(171, 171, 171)' },
                ontransitionend: () => {
                  if (this.#next !== undefined && this.#moving) {
                    this.#shown = this.#next
                    this.#next = undefined
                    this.#moving = false
                  }
                },
              },
              m('img.d-block.w-100', {
                src: this.#fetched.has(index) ? `/img/template/${picture}` : undefined,
                alt: '',
                onload: () => {
                  // nothing to do: Mithril draws anew after its handler, and the two move
                },
              }),
              m(
                '.carousel-caption',
                m('.caption-first-text', words()[0]),
                m('.caption-second-text', words()[1]),
              ),
            ),
          ),
        ),
      ),
    )
  }
}
