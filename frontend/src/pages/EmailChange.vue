<!-- AI-GENERATED — not an architecture reference -->
<template>
  <!-- Nothing happens on opening the page. A link that acts when it is merely opened is
       "clicked" by every mail scanner that prefetches links - and a prefetched confirmation
       would move an account without anybody having decided to. Hence the button. -->
  <div v-if="!finished" class="email-change">
    <div class="h3 pb-3">{{ texts.title }}</div>
    <p class="pb-4">{{ texts.text }}</p>
    <BButton block variant="gradido" :disabled="busy" data-test="email-change-action" @click="act">
      {{ texts.button }}
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
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useMutation } from '@vue/apollo-composable'
import { BButton } from 'bootstrap-vue-next'
import { confirmEmailChange, revokeEmailChange } from '@/graphql/mutations'
import Message from '@/components/Message/Message.vue'

const route = useRoute()
const { t } = useI18n()

const emit = defineEmits(['set-mobile-start'])

// One page for the two links of a change: the one in the mail to the new address confirms,
// the one in the notice to the old address revokes.
const revoking = computed(() => route.name === 'EmailChangeRevoke')

// Literal keys on purpose: the i18n lint only counts a key as used when it sees it spelled
// out in a t() call.
const texts = computed(() =>
  revoking.value
    ? {
        title: t('emailChange.revoke.title'),
        text: t('emailChange.revoke.text'),
        button: t('emailChange.revoke.button'),
        done: t('emailChange.revoke.done'),
      }
    : {
        title: t('emailChange.confirm.title'),
        text: t('emailChange.confirm.text'),
        button: t('emailChange.confirm.button'),
        done: t('emailChange.confirm.done'),
      },
)

const { mutate: confirm } = useMutation(confirmEmailChange)
const { mutate: revoke } = useMutation(revokeEmailChange)

const busy = ref(false)
const finished = ref(false)
const headline = ref('')
const subtitle = ref('')

const act = async () => {
  busy.value = true
  try {
    // Nothing is written into a session that may be open on this device: the code is
    // public, and the wallet signed in here need not be the account it belongs to.
    if (revoking.value) {
      await revoke({ vetoCode: route.params.changeCode })
    } else {
      await confirm({ code: route.params.changeCode })
    }
    headline.value = t('message.title')
    subtitle.value = texts.value.done
  } catch (error) {
    headline.value = t('message.errorTitle')
    subtitle.value = error.message.includes('Invalid or expired code')
      ? t('emailChange.invalid')
      : error.message
  } finally {
    busy.value = false
    finished.value = true
  }
}

emit('set-mobile-start', false)
</script>
