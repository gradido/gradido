// AI-GENERATED — not an architecture reference
import { useMutation } from '@vue/apollo-composable'
import { BFormRadioGroup, BModal } from 'bootstrap-vue-next'
import { computed, defineComponent, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ProjectAccountConfirm } from '@/components/UserSettings/ProjectAccountConfirm'
import { useAppToast } from '@/composables/useToast'
import { declareProjectAccount, requestCreationRight } from '@/graphql/user.graphql'
import { useWalletStore } from '@/store/useWalletStore'
import classes from './UserCreationAccount.module.scss'

const PERSON = 'person'
const PROJECT = 'project'

export const UserCreationAccount = defineComponent({
  name: 'UserCreationAccount',
  setup() {
    const { t } = useI18n()
    const store = useWalletStore()
    const { toastSuccess, toastError } = useAppToast()

    const { mutate: declare } = useMutation(declareProjectAccount)
    const { mutate: request } = useMutation(requestCreationRight)

    // null in the store is "not known", and not-known means what every account is by default:
    // a person. The store value is the one source; the radio only mirrors it.
    const fromStore = () => (store.creationAllowed === false ? PROJECT : PERSON)
    const selected = ref(fromStore())
    watch(
      () => store.creationAllowed,
      () => {
        selected.value = fromStore()
      },
    )

    const options = computed(() => [
      { value: PERSON, text: t('settings.creationAccount.person') },
      { value: PROJECT, text: t('settings.creationAccount.project') },
    ])

    const busy = ref(false)
    const hint = ref('')

    /** Which way the member wants to go -- the modal asks, `confirmed` then acts. */
    const confirming = ref(false)
    const confirmMode = ref(PERSON)

    const onChoice = (choice: string) => {
      if (busy.value) {
        return
      }
      // The radio shows the row, not the wish, until the modal has been answered.
      selected.value = fromStore()
      if (choice === fromStore()) {
        return
      }
      confirmMode.value = choice === PROJECT ? 'declare' : 'request'
      confirming.value = true
    }

    const confirmed = async () => {
      if (busy.value) {
        return
      }
      const choice = confirmMode.value === 'declare' ? PROJECT : PERSON
      busy.value = true
      hint.value = ''
      try {
        if (choice === PROJECT) {
          await declare()
          store.setCreationAllowed(false)
          toastSuccess(t('settings.creationAccount.declared'))
        } else {
          // The way back changes nothing here: a person checks it. The radio therefore goes
          // back to "project" below, and the hint says why.
          await request()
          hint.value = t('settings.creationAccount.requested')
        }
      } catch (error) {
        const message: string = (error as Error | null)?.message ?? ''
        if (message.includes('RATE_LIMITED')) {
          hint.value = t('settings.creationAccount.rateLimited')
        } else if (message.includes('MAIL_FAILED')) {
          toastError(t('settings.creationAccount.mailFailed'))
        } else if (message.includes('OPEN_CONTRIBUTIONS')) {
          toastError(t('settings.creationAccount.openContributions'))
        } else {
          toastError(message)
        }
      } finally {
        // Whatever happened, the radio shows the row, not the wish.
        selected.value = fromStore()
        busy.value = false
        confirming.value = false
      }
    }

    return () => (
      <div id='creation-account' class={classes['creation-account']} data-test='creation-account'>
        <div class='mb-2'>{t('settings.creationAccount.title')}</div>
        {/* ES-021: "person, creates" or "project account, receives thanks". The two directions
            are not alike, and the control says so by what it does: switching OFF is the holder's
            own decision and takes effect at once; switching back ON is a request to the support,
            and the radio stays where it is until an administrator moves the switch. */}
        <BFormRadioGroup
          modelValue={selected.value}
          name='creation-account'
          stacked
          options={options.value}
          disabled={busy.value}
          data-test='creation-account-choice'
          onUpdate:modelValue={(choice) => {
            selected.value = choice as string
            onChoice(choice as string)
          }}
        />
        {hint.value ? (
          <div
            class='mt-3 p-3 gradido-border-radius creation-account-hint'
            data-test='creation-account-hint'
          >
            {hint.value}
          </div>
        ) : null}

        {/* ABN-L3-01: neither direction moves on the click alone. The radio snaps back at once
            and the modal carries the decision -- off is irreversible for the member (only the
            support switches it back on), so it takes the question AND the word typed by hand;
            on is a request to a person, said before the mail goes out. */}
        <BModal
          id='modal-project-account'
          modelValue={confirming.value}
          noHeader
          noFooter
          centered
          noCloseOnBackdrop
          data-test='creation-account-modal'
          onUpdate:modelValue={(open: boolean) => {
            confirming.value = open
          }}
        >
          {confirming.value ? (
            <ProjectAccountConfirm
              mode={confirmMode.value}
              busy={busy.value}
              onConfirm={confirmed}
              onCancel={() => {
                confirming.value = false
              }}
            />
          ) : null}
        </BModal>
      </div>
    )
  },
})
