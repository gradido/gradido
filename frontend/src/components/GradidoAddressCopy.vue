<!-- AI-GENERATED — not an architecture reference -->
<template>
  <button
    type="button"
    class="copy-clipboard-button"
    :title="$t('copy-to-clipboard')"
    data-test="gradido-address-copy"
    @click="copy"
  >
    {{ address.display }}
    <IBiCopy></IBiCopy>
  </button>
</template>

<script setup>
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
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppToast } from '@/composables/useToast'
import { gradidoAddress } from '@/utils/gradidoAddress'

const props = defineProps({
  alias: { type: String, required: true },
})

const { t } = useI18n()
const toast = useAppToast()

const address = computed(() => gradidoAddress(props.alias))

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
</script>

<style lang="scss" scoped>
/* Block comments only: lightningcss parses SFC style blocks and a double slash is not a
   comment to it -- the build fails with "Invalid empty selector". */

/* The copy control is a button so that it can be reached with the keyboard, and a button
   brings none of the link appearance with it. Colour is inherited from whatever wraps it;
   the underline on hover is what the house does for every link ($link-hover-decoration),
   said here because a button is not covered by that rule. */
.copy-clipboard-button {
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
}

.copy-clipboard-button:hover {
  text-decoration: underline;
}
</style>
