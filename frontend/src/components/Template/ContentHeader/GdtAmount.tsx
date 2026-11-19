// AI-GENERATED — not an architecture reference
import { useMutation } from '@vue/apollo-composable'
import { BBadge, BCol, BRow, type ColorVariant } from 'bootstrap-vue-next'
import { computed, defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppToast } from '@/composables/useToast'
import { updateUserInfos } from '@/graphql/mutations'
import { useWalletStore } from '@/store/useWalletStore'
import IBiEye from '~icons/bi/eye'
import IBiEyeSlash from '~icons/bi/eye-slash'
import IBiLayers from '~icons/bi/layers'
import classes from './GdtAmount.module.scss'

export const GdtAmount = defineComponent({
  name: 'GdtAmount',
  props: {
    gdtBalance: { type: Number, required: true },
    badgeShow: { type: Boolean, default: true },
    showStatus: { type: Boolean, default: false },
  },
  setup(props) {
    const store = useWalletStore()
    const { mutate } = useMutation(updateUserInfos)
    const { t, n } = useI18n()
    const { toastError } = useAppToast()

    const hideAmount = computed(() => store.hideAmountGDT)

    const updateHideAmountGDT = async () => {
      // ⛔ Read ONCE, before the waiting. `hideAmount` is a computed on the store, so asking it
      // again after the await asks a different question: two quick clicks -- the very thing this
      // switch invites -- both read "visible" and both send "hide", and then the two commits run
      // in turn and land on visible again. The server holds hidden, the device shows the number,
      // and nothing says so until the next login. One value, used for both halves. (27.08.2026)
      const hidden = !hideAmount.value
      try {
        await mutate({
          hideAmountGDT: hidden,
        })

        store.setHideAmountGDT(hidden)
        // ⛔ No toast either way. Hiding or showing the balance is a switch whose whole result
        // is on screen the moment it lands -- the number is there or it is not -- so a message
        // saying so afterwards only repeats what the eye has already seen. Switched quickly back
        // and forth they piled up on top of each other. (Bernd, 27.08.2026)
        //
        // ⚠️ The failure still speaks, and the reason is the opposite of what stood here at
        // first: `store.setHideAmountGDT` above sits INSIDE the try, after the awaited mutation, so a
        // rejected save never reaches it and nothing changes on this device. The click simply
        // does nothing -- and a control that does nothing, silently, is the one case the eye
        // cannot report. That is what `toastError` is for.
      } catch (error) {
        toastError((error as Error).message)
      }
    }

    return () => (
      <div class={['gdt-amount mt-3 mt-lg-0', classes['gdt-amount']]}>
        <div class='text-center'>
          {props.badgeShow ? (
            <BBadge
              class={[
                'position-absolute mt--2 px-3 zindex1',
                props.showStatus ? 'bg-gradido-gradient' : 'bg-gradido-muted',
              ]}
              variant={'' as ColorVariant}
            >
              {t('GDT')}
            </BBadge>
          ) : null}
        </div>
        <div
          class={[
            'wallet-amount bg-white app-box-shadow gradido-border-radius p-4',
            props.showStatus ? 'gradido-global-border-color-accent' : 'border-light opacity-05',
          ]}
        >
          <BRow>
            <BCol class='h4'>{t('gdt.gdtKonto')}</BCol>
          </BRow>
          <BRow>
            <BCol cols='9'>
              <IBiLayers class='me-3 gradido-global-border-color-accent d-none d-lg-inline' />
              {hideAmount.value ? (
                <span class='fw-bold gradido-global-color-accent'>{t('asterisks')}</span>
              ) : (
                <span class='fw-bold gradido-global-color-accent'>
                  {n(props.gdtBalance, 'decimal')} {t('GDT')}
                </span>
              )}
            </BCol>
            <BCol cols='3' class='border-start border-dark'>
              {/* ⛔ The button carries its own name and its own state. It is an icon and
                  nothing else -- no text, no title, no label -- so before this it announced as
                  a bare "button", and the balance it switches is a plain conditional pair
                  outside any live region. The success toast was the only thing a screen reader
                  ever heard here, and removing it laid that bare rather than causing it.
                  `aria-pressed` is what makes the result audible: the label names the action
                  and stays put, the state says whether it is on. (27.08.2026) */}
              <button
                class='transparent-button'
                aria-label={t('settings.hide-amount', { currency: t('GDT') })}
                aria-pressed={hideAmount.value ?? undefined}
                data-test='toggle-hide-amount-gdt'
                onClick={updateHideAmountGDT}
              >
                {hideAmount.value ? (
                  <IBiEyeSlash class='me-3 gradido-global-border-color-accent pointer hover-icon eye-icon' />
                ) : (
                  <IBiEye class='me-3 gradido-global-border-color-accent pointer hover-icon eye-icon' />
                )}
              </button>
            </BCol>
          </BRow>
        </div>
      </div>
    )
  },
})
