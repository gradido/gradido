// AI-GENERATED — not an architecture reference
import { defineComponent, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { backOrOverview } from '@/utils/backOrOverview'
import { renderQrCodeCanvas } from '@/utils/qrCode'
import IMdiArrowLeft from '~icons/mdi/arrow-left'
import classes from './OwnCodeView.module.scss'

/**
 * A member's own code, big enough to be read off the screen at a counter.
 *
 * ## Why it is a page and not a dialogue
 *
 * The gesture is "hold up my square", and the phone gets turned around while it happens.
 * A dialogue would keep the wallet behind it, with the member's balance and name on the
 * screen that is being handed over. `bareChrome` takes all of that away and leaves the
 * code -- which is also the only way the code gets the width it needs on a phone.
 *
 * ## The drawing
 *
 * The same generator as everywhere else (`utils/qrCode`), so the code on the screen and
 * the code on the paper are the same picture. Not a second one, deliberately: two
 * generators are how a shown code and a printed one start to disagree.
 *
 * ⚠️ The round counter is not decoration. `link` arrives late on the thank-you card --
 * empty first, then filled when the query answers -- so there is a real transition, and
 * two draws can be in flight at once on a slow device. Whichever finishes LAST would
 * otherwise write, and that is not necessarily the current one.
 */
export const OwnCodeView = defineComponent({
  name: 'OwnCodeView',
  props: {
    title: { type: String, required: true },
    // May be empty: the thank-you card has none until its card is known, and none at all
    // while the card function is switched off.
    link: { type: String, default: '' },
    // Off where the code stands inside another page rather than being the page: the page for
    // showing Gradido to somebody opens it in its first door, under its own heading, and a
    // second heading with a back arrow there would lead out of a page nobody wants to leave.
    // The title stays either way -- it is the picture's alternative text.
    showHead: { type: Boolean, default: true },
  },
  setup(props, { slots }) {
    const { t } = useI18n()
    const router = useRouter()
    const picture = ref('')

    let round = 0

    const draw = async (link: string) => {
      const mine = ++round
      if (!link) {
        picture.value = ''
        return
      }
      try {
        const canvas = await renderQrCodeCanvas(link)
        if (mine === round) {
          picture.value = canvas.toDataURL('image/png')
        }
      } catch {
        // The coin in the middle of the code is fetched from our own server, so this only
        // happens when the wallet's own assets are unreachable. Showing nothing is the
        // honest outcome; the page's own text stays, and the way out stays.
        if (mine === round) {
          picture.value = ''
        }
      }
    }

    watch(() => props.link, draw, { immediate: true })

    /**
     * Back where they came from, and to the overview when there is no "came from" inside the
     * signed-in wallet -- a bookmark, a typed address, or the sign-in form the member passed on
     * the way here. The rule and its reasons live in utils/backOrOverview.
     */
    const goBack = () => backOrOverview(router)

    return () => (
      <div class={['own-code-view', classes['own-code-view']]}>
        {/* The page's own chrome, like the scanner's and the calculator's: the route is
            bareChrome on a phone, so there this arrow is the only way out. 44px target.

            The arrow has a line of its own and the title stands beneath it, centred over the
            code and in the size of the sentence under the code (`fs-5`, as the two pages set
            it): beside the arrow it was the smallest writing on the page, although it is the
            page's heading. (Bernd, 08.10.2026)

            From lg on the wallet's own chrome is back and the layout prints the title as the
            page heading, so this head goes -- see the style module. */}
        {props.showHead ? (
          <div class='own-code-head' data-test='own-code-head'>
            <button
              type='button'
              class='own-code-back'
              aria-label={t('my-codes.back')}
              data-test='own-code-back'
              onClick={goBack}
            >
              <IMdiArrowLeft />
            </button>
            <div class='own-code-title fs-5' data-test='own-code-title'>
              {props.title}
            </div>
          </div>
        ) : null}

        <div class='own-code-body'>
          {slots.above?.()}

          {picture.value ? (
            <img
              src={picture.value}
              class='own-code-picture'
              alt={props.title}
              data-test='own-code-picture'
            />
          ) : null}

          {slots.default?.()}
        </div>
      </div>
    )
  },
})
