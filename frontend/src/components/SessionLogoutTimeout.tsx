// AI-GENERATED — not an architecture reference
import { useLazyQuery } from '@vue/apollo-composable'
import { BButton, BCard, BCardText, BModal, type ButtonVariant } from 'bootstrap-vue-next'
import { computed, defineComponent, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppToast } from '@/composables/useToast'
import { verifyLogin } from '@/graphql/queries'
import { useWalletStore } from '@/store/useWalletStore'

// Warn the user this many seconds before the session (JWT) expires.
const MODAL_WARNING_SECONDS = 75

/**
 * What goes with `logout` where the session ends by the clock and not by the member's word: its
 * time ran out, or could not be extended. The button "Abmelden" of the question sends none -- that
 * is the member's own word. The layout tells the two apart (`logoutUser`).
 */
const RAN_OUT = Object.freeze({ ranOut: true })

export const SessionLogoutTimeout = defineComponent({
  name: 'SessionLogoutTimeout',
  emits: ['logout'],
  setup(_props, { emit }) {
    const store = useWalletStore()
    const { t } = useI18n()
    const { toastError } = useAppToast()

    const sessionModalModel = ref(false)

    // Renewal must hit the network: every response carries a fresh `token` header that
    // the Apollo afterware writes to the store, sliding the expiry forward. A cache-first
    // query would often skip the network and never actually renew the session.
    const { load: loadVerifyLogin, refetch: refetchVerifyLogin } = useLazyQuery(
      verifyLogin,
      {},
      { fetchPolicy: 'network-only' },
    )
    let verifyLoginLoaded = false

    const remainingTime = ref(0)
    let intervalId: ReturnType<typeof setInterval> | null = null

    // `Number()` for the types only (the store is untyped): null counts as 0 and a missing time
    // as no number, as in the multiplication alone.
    const tokenExpirationTime = computed(() => new Date(Number(store.tokenTime) * 1000))

    const calculateRemainingTime = () => {
      const diff = tokenExpirationTime.value.getTime() - Date.now()
      remainingTime.value = Math.max(0, Math.floor(diff / 1000))
      // Single source of truth for visibility: show the modal only while the remaining
      // time is inside the warning span (the final MODAL_WARNING_SECONDS before expiry).
      sessionModalModel.value =
        remainingTime.value > 0 && remainingTime.value <= MODAL_WARNING_SECONDS
      if (remainingTime.value <= 0 && intervalId) {
        clearInterval(intervalId)
        intervalId = null
      }
    }

    const formatTime = (seconds: number) => {
      if (seconds <= 0) {
        return '00'
      }
      return `${seconds.toString().padStart(2, '0')}`
    }

    // useLazyQuery's load() runs only once; use refetch() afterwards so every click
    // forces a fresh network round-trip (and therefore a fresh token).
    const renewSession = async () => {
      if (!verifyLoginLoaded) {
        verifyLoginLoaded = true
        const loaded = await loadVerifyLogin()
        if (loaded) {
          return loaded
        }
      }
      return refetchVerifyLogin()
    }

    const handleOk = async () => {
      let renewed = false
      try {
        renewed = Boolean(await renewSession())
      } catch {
        renewed = false
      }
      if (renewed) {
        // Recompute at once so the modal closes as soon as the new expiry is known.
        calculateRemainingTime()
        return
      }
      // Renewal failed (network error or empty response): tell the user in plain
      // language before logging out, instead of a silent redirect.
      toastError(t('error.session-renewal-failed'))
      emit('logout', RAN_OUT)
    }

    onMounted(() => {
      calculateRemainingTime()
      intervalId = setInterval(calculateRemainingTime, 1000)
    })

    onUnmounted(() => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    })

    watch(remainingTime, (newTime) => {
      if (newTime <= 0) {
        emit('logout', RAN_OUT)
      }
    })

    return () => (
      <div class='session-logout-timeout'>
        <BModal
          id='modalSessionTimeOut'
          class='bg-variant-danger'
          noHeaderClose
          noHeader
          noCloseOnBackdrop
          modelValue={sessionModalModel.value}
          onUpdate:modelValue={(value: boolean) => {
            sessionModalModel.value = value
          }}
          v-slots={{
            default: () => (
              <BCard headerTag='header' footerTag='footer'>
                <BCardText>
                  <div class='p-3 h2'>{t('session.warningText')}</div>
                  <div class='p-3'>{t('session.lightText')}</div>
                  <div class='p-3 h2 text-warning'>
                    {t('session.logoutIn')} <b>{formatTime(remainingTime.value)}</b>{' '}
                    {t('time.seconds')}
                  </div>
                </BCardText>
              </BCard>
            ),
            footer: () => (
              <>
                <BButton variant='secondary' onClick={() => emit('logout')}>
                  {t('navigation.logout')}
                </BButton>
                <BButton variant={'gradido' as ButtonVariant} onClick={handleOk}>
                  {t('session.extend')}
                </BButton>
              </>
            ),
          }}
        />
      </div>
    )
  },
})
