// AI-GENERATED — not an architecture reference
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useMutation } from '@vue/apollo-composable'
import { useWalletStore } from '@/store/useWalletStore'
import { resendConfirmationEmail } from '@/graphql/mutations'
import { useAppToast } from '@/composables/useToast'

// ⚠️ Mirrors CONFIRMATION_GRACE_PERIOD_HOURS in the backend
// (backend/src/data/EmailConfirmation.logic.ts). The server enforces its own copy;
// this one only decides what the wallet says and in which form -- the strip inside the
// grace period, the window that cannot be closed after it. Change one, change both.
export const CONFIRMATION_GRACE_HOURS = 24

/**
 * The member's unconfirmed address and the clock it runs on (EM-013): one source for the two
 * forms the reminder takes (EM-014). Inside the 24 hours a strip on the page
 * (EmailConfirmationStrip), after them the window that cannot be closed
 * (EmailConfirmationReminder).
 *
 * The deadline, the minute ticker and the resend lived in the window while it was the only form.
 * Here they stand once, so the two forms read the same clock: in the minute the strip goes, the
 * window comes, and neither can say the grace period is over while the other says it is not.
 *
 * Each caller gets its own ticker and its own `resent`. The two forms never stand at the same
 * time, and what one of them says about the mail it has just sent again belongs to it.
 */
export const useEmailConfirmation = () => {
  const store = useWalletStore()
  const { toastError } = useAppToast()

  // `=== false`: null means the state is not known, and nothing is said about an address
  // nobody knows the state of.
  const unconfirmed = computed(() => store.emailChecked === false)

  const deadline = computed(() =>
    store.accountCreatedAt
      ? new Date(
          new Date(store.accountCreatedAt).getTime() + CONFIRMATION_GRACE_HOURS * 60 * 60 * 1000,
        )
      : null,
  )

  // A bare Date.now() is invisible to Vue: without a ticking source the computed would
  // freeze on its first value, and a session kept open across the deadline would never
  // see the window come. One-minute steps are plenty for a 24h grace period -- and they
  // make the strip go and the window come by themselves the moment the deadline passes.
  const now = ref(Date.now())
  let ticker = null
  onMounted(() => {
    ticker = setInterval(() => {
      now.value = Date.now()
    }, 60000)
  })
  onUnmounted(() => clearInterval(ticker))

  const overdue = computed(() => !!deadline.value && now.value > deadline.value.getTime())

  const deadlineText = computed(() =>
    deadline.value
      ? deadline.value.toLocaleString(store.language || undefined, {
          dateStyle: 'medium',
          timeStyle: 'short',
        })
      : '',
  )

  const resent = ref(false)
  const resending = ref(false)
  const { mutate: resendMutation } = useMutation(resendConfirmationEmail)

  const resend = async () => {
    resending.value = true
    try {
      await resendMutation()
      resent.value = true
    } catch (error) {
      toastError(error.message)
    } finally {
      resending.value = false
    }
  }

  return { unconfirmed, deadline, overdue, deadlineText, resend, resending, resent }
}
