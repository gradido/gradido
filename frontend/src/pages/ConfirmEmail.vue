<!-- AI-GENERATED — not an architecture reference -->
<template>
  <!-- Nothing happens on opening the page. A link that acts when it is merely opened is
       "clicked" by every mail scanner that prefetches links — hence the button. Same
       pattern as the e-mail change page. -->
  <div v-if="!finished" class="confirm-email">
    <div class="h3 pb-3">{{ $t('assistedRegistration.confirm.title') }}</div>
    <p class="pb-4">{{ $t('assistedRegistration.confirm.text') }}</p>
    <BButton block variant="gradido" :disabled="busy" data-test="confirm-email-action" @click="act">
      {{ $t('assistedRegistration.confirm.button') }}
    </BButton>
  </div>
  <message
    v-else
    :headline="headline"
    :subtitle="subtitle"
    :button-text="$t('login')"
    :link-to="{ name: 'Login' }"
  />
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useMutation } from '@vue/apollo-composable'
import { BButton } from 'bootstrap-vue-next'
import { confirmEmailMutation } from '@/graphql/mutations'
import Message from '@/components/Message/Message.vue'

const route = useRoute()
const { t } = useI18n()

const emit = defineEmits(['set-mobile-start'])

const { mutate: confirm } = useMutation(confirmEmailMutation)

const busy = ref(false)
const finished = ref(false)
const headline = ref('')
const subtitle = ref('')

const act = async () => {
  busy.value = true
  try {
    await confirm({ code: route.params.confirmationCode })
    headline.value = t('message.title')
    subtitle.value = t('assistedRegistration.confirm.done')
  } catch (error) {
    headline.value = t('message.errorTitle')
    subtitle.value = error.message.includes('Could not confirm with this code')
      ? t('assistedRegistration.confirm.invalid')
      : error.message
  } finally {
    busy.value = false
    finished.value = true
  }
}

emit('set-mobile-start', false)
</script>
