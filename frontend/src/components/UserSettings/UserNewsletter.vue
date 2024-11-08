<template>
  <div class="formusernewsletter">
    <BFormCheckbox
      :model-value="localNewsletterState"
      test="BFormCheckbox"
      name="check-button"
      switch
      @update:modelValue="localNewsletterState = $event"
    />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useStore } from 'vuex'
import { subscribeNewsletter, unsubscribeNewsletter } from '@/graphql/mutations'
import { useMutation } from '@vue/apollo-composable'
import { BFormCheckbox } from 'bootstrap-vue-next'
import { useAppToast } from '@/composables/useToast'
import { useI18n } from 'vue-i18n'

const { toastSuccess, toastError } = useAppToast()
const store = useStore()
const { t } = useI18n()

const localNewsletterState = ref(store.state.newsletterState)

const { mutate: newsletterSubscribe } = useMutation(subscribeNewsletter)
const { mutate: newsletterUnsubscribe } = useMutation(unsubscribeNewsletter)

watch(localNewsletterState, async (newValue, oldValue) => {
  if (newValue !== oldValue) {
    await onSubmit()
  }
})

const onSubmit = async () => {
  try {
    localNewsletterState.value ? await newsletterSubscribe() : await newsletterUnsubscribe()

    store.commit('newsletterState', localNewsletterState.value)

    toastSuccess(
      localNewsletterState.value
        ? t('settings.newsletter.newsletterTrue')
        : t('settings.newsletter.newsletterFalse'),
    )
  } catch (error) {
    localNewsletterState.value = store.state.newsletterState
    toastError(error.message)
  }
}

watch(
  () => store.state.newsletterState,
  (newState) => {
    localNewsletterState.value = newState
  },
)
</script>
