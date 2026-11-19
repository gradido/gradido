// AI-GENERATED — not an architecture reference
import { useMutation } from '@vue/apollo-composable'
import { BFormCheckbox } from 'bootstrap-vue-next'
import { defineComponent, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppToast } from '@/composables/useToast'
import { subscribeNewsletter, unsubscribeNewsletter } from '@/graphql/mutations'
import { useWalletStore } from '@/store/useWalletStore'

export const UserNewsletter = defineComponent({
  name: 'UserNewsletter',
  setup() {
    const { toastSuccess, toastError } = useAppToast()
    const store = useWalletStore()
    const { t } = useI18n()

    const localNewsletterState = ref<boolean | null | undefined>(store.newsletterState)

    const { mutate: newsletterSubscribe } = useMutation(subscribeNewsletter)
    const { mutate: newsletterUnsubscribe } = useMutation(unsubscribeNewsletter)

    const onSubmit = async () => {
      try {
        localNewsletterState.value ? await newsletterSubscribe() : await newsletterUnsubscribe()

        store.setNewsletterState(localNewsletterState.value)

        toastSuccess(
          localNewsletterState.value
            ? t('settings.newsletter.newsletterTrue')
            : t('settings.newsletter.newsletterFalse'),
        )
      } catch (error) {
        localNewsletterState.value = store.newsletterState
        toastError((error as Error).message)
      }
    }

    watch(localNewsletterState, async (newValue, oldValue) => {
      if (newValue !== undefined && newValue !== null && newValue !== oldValue) {
        await onSubmit()
      }
    })

    watch(
      () => store.newsletterState,
      (newState) => {
        localNewsletterState.value = newState
      },
    )

    return () => (
      <div class='formusernewsletter'>
        <BFormCheckbox
          modelValue={localNewsletterState.value}
          {...{ test: 'BFormCheckbox' }}
          name='check-button'
          switch
          onUpdate:modelValue={(next) => {
            localNewsletterState.value = next as boolean
          }}
        />
      </div>
    )
  },
})
