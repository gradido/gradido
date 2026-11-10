// AI-GENERATED — not an architecture reference
import { computed, defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppToast } from '@/composables/useToast'
import { gradidoAddress } from '@/utils/gradidoAddress'
import IBiCopy from '~icons/bi/copy'
import classes from './GradidoAddressCopy.module.scss'

/**
 * The Gradido address of one member, shown and copyable in one control.
 *
 * Two shapes out of one call (see utils/gradidoAddress): shown without a scheme, copied with
 * one -- without it many phone cameras and chat clients do not offer to open the address at
 * all. Everything the eye sees and the clipboard gets comes from the same place, so a printed
 * address and a shown one cannot drift apart.
 *
 * This used to sit inline in the navigation bar. It moved out when the public profile page
 * became the second place that needs it; the thank-you cheque is the third consumer of the
 * same address, through the utils module rather than through this component.
 */
export const GradidoAddressCopy = defineComponent({
  name: 'GradidoAddressCopy',
  props: {
    alias: { type: String, required: true },
  },
  setup(props) {
    const { t } = useI18n()
    const toast = useAppToast()

    const address = computed(() => gradidoAddress(props.alias))
    // What follows the community: `/u/name`, cut from the shown line so the two parts cannot
    // come to say something else than the whole.
    const path = computed(() => address.value.display.slice(address.value.host.length))

    /**
     * Say "copied" only once it is copied.
     *
     * Two ways to fail, and only one of them is a rejected promise: where the page is not served
     * over TLS, and in a few of the browsers built into other apps, `navigator.clipboard` is not
     * there at all -- then the call throws on the spot and a `.catch` on the promise never runs.
     * Both are caught here, because a QR code on paper is opened by whatever browser the phone
     * happens to launch, and this control is the whole instruction on the public profile page:
     * copy the address, paste it into your own account. Claiming success without it would leave
     * the visitor pasting nothing.
     *
     * The address stays readable on screen either way, so the message can ask for the one thing
     * that always works.
     */
    const copy = async () => {
      try {
        await navigator.clipboard.writeText(address.value.link)
        toast.toastSuccess(t('gradidoid-copied-to-clipboard'))
      } catch {
        toast.toastError(t('gradidoid-not-copied'))
      }
    }

    return () => (
      <button
        type='button'
        class={['copy-clipboard-button', classes['copy-clipboard-button']]}
        title={t('copy-to-clipboard')}
        data-test='gradido-address-copy'
        onClick={copy}
      >
        {/* Two parts, so that a place too narrow for the whole address breaks it before the
            namespace and nowhere else: the community on one line, `/u/name` on the next. The
            icon is inside the second part and so never ends up on a line of its own. No
            whitespace between the parts -- it would show as a space inside the address. */}
        <span class='address-part' data-test='gradido-address-host'>
          {address.value.host}
        </span>
        <span class='address-part' data-test='gradido-address-path'>
          {path.value} <IBiCopy />
        </span>
      </button>
    )
  },
})
