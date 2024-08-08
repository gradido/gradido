<template>
  <div class="formusernewsletter">
    <BFormCheckbox
      :model-value="newsletterState"
      test="BFormCheckbox"
      name="check-button"
      switch
      @change="onSubmit"
      @update:modelValue="newsletterState = $event"
    />
  </div>
</template>
<script setup>
import { ref } from 'vue'
import { useStore } from 'vuex'
import { subscribeNewsletter, unsubscribeNewsletter } from '@/graphql/mutations'
import { useMutation } from '@vue/apollo-composable'
import { BFormCheckbox } from 'bootstrap-vue-next'
import { useAppToast } from '@/composables/useToast'
import { useI18n } from 'vue-i18n'

const { toastSuccess, toastError } = useAppToast()
const store = useStore()
const state = store.state

const { t } = useI18n()

const newsletterState = ref(state.newsletterState)

const { mutate: newsletterSubscribe } = useMutation(subscribeNewsletter)
const { mutate: newsletterUnsubscribe } = useMutation(unsubscribeNewsletter)

const onSubmit = async () => {
  try {
    newsletterState.value ? newsletterSubscribe() : newsletterUnsubscribe()

    store.commit('newsletterState', newsletterState.value)
    toastSuccess(
      newsletterState.value
        ? t('settings.newsletter.newsletterTrue')
        : t('settings.newsletter.newsletterFalse'),
    )
  } catch (error) {
    newsletterState.value = state.newsletterState
    toastError(error.message)
  }
}
</script>
