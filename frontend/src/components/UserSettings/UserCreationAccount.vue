<!-- AI-GENERATED — not an architecture reference -->
<template>
  <div id="creation-account" data-test="creation-account">
    <div class="mb-2">{{ $t('settings.creationAccount.title') }}</div>
    <!-- ES-021: "person, creates" or "project account, receives thanks". The two directions
         are not alike, and the control says so by what it does: switching OFF is the holder's
         own decision and takes effect at once; switching back ON is a request to the support,
         and the radio stays where it is until an administrator moves the switch. -->
    <BFormRadioGroup
      v-model="selected"
      name="creation-account"
      stacked
      :options="options"
      :disabled="busy"
      data-test="creation-account-choice"
      @update:model-value="onChoice"
    />
    <div
      v-if="hint"
      class="mt-3 p-3 gradido-border-radius creation-account-hint"
      data-test="creation-account-hint"
    >
      {{ hint }}
    </div>

    <!-- ABN-L3-01: neither direction moves on the click alone. The radio snaps back at once
         and the modal carries the decision -- off is irreversible for the member (only the
         support switches it back on), so it takes the question AND the word typed by hand;
         on is a request to a person, said before the mail goes out. -->
    <BModal
      id="modal-project-account"
      v-model="confirming"
      hide-header
      hide-footer
      centered
      no-close-on-backdrop
      data-test="creation-account-modal"
    >
      <project-account-confirm
        v-if="confirming"
        :mode="confirmMode"
        :busy="busy"
        @confirm="confirmed"
        @cancel="confirming = false"
      />
    </BModal>
  </div>
</template>
<script setup>
import { computed, ref, watch } from 'vue'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import { useMutation } from '@vue/apollo-composable'
import { BFormRadioGroup, BModal } from 'bootstrap-vue-next'
import ProjectAccountConfirm from '@/components/UserSettings/ProjectAccountConfirm.vue'
import { declareProjectAccount, requestCreationRight } from '@/graphql/user.graphql'
import { useAppToast } from '@/composables/useToast'

const PERSON = 'person'
const PROJECT = 'project'

const { t } = useI18n()
const store = useStore()
const { toastSuccess, toastError } = useAppToast()

const { mutate: declare } = useMutation(declareProjectAccount)
const { mutate: request } = useMutation(requestCreationRight)

// null in the store is "not known", and not-known means what every account is by default:
// a person. The store value is the one source; the radio only mirrors it.
const fromStore = () => (store.state.creationAllowed === false ? PROJECT : PERSON)
const selected = ref(fromStore())
watch(
  () => store.state.creationAllowed,
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

const onChoice = (choice) => {
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
      store.commit('creationAllowed', false)
      toastSuccess(t('settings.creationAccount.declared'))
    } else {
      // The way back changes nothing here: a person checks it. The radio therefore goes
      // back to "project" below, and the hint says why.
      await request()
      hint.value = t('settings.creationAccount.requested')
    }
  } catch (error) {
    const message = error?.message ?? ''
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
</script>
<style scoped>
.creation-account-hint {
  background: var(--gradido-goldsoft, rgb(197 141 56 / 8%));
  border-left: 3px solid var(--gold, #c58d38);
}
</style>
