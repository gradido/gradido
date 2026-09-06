<!-- AI-GENERATED — not an architecture reference -->
<template>
  <div class="project-account-confirm px-2 pt-3" data-test="project-account-confirm">
    <!-- ── switching OFF: two steps, because the member cannot undo it (ABN-L3-01) ──
         Creation is one of the most important things in Gradido, and only the support can
         switch it back on. So: the question with the consequence spelled out, then the word
         typed by hand -- a click that landed by accident gets past neither. -->
    <template v-if="mode === 'declare'">
      <template v-if="step === 1">
        <p class="h5 mb-2">{{ $t('settings.creationAccount.confirm.declareTitle') }}</p>
        <p data-test="project-account-confirm-text">
          {{ $t('settings.creationAccount.confirm.declareText') }}
        </p>
        <div class="d-flex justify-content-end gap-2 mt-4">
          <BButton variant="secondary" data-test="project-account-confirm-cancel" @click="cancel">
            {{ $t('form.cancel') }}
          </BButton>
          <BButton variant="gradido" data-test="project-account-confirm-next" @click="step = 2">
            {{ $t('settings.creationAccount.confirm.next') }}
          </BButton>
        </div>
      </template>
      <!-- A form, so that Enter in the field is the same as the button (Account.vue does it
           this way): the handler is one, and a native submit can never slip past it. -->
      <BForm v-else @submit.prevent="confirmIfMatching">
        <p data-test="project-account-confirm-type">
          {{ $t('settings.creationAccount.confirm.typeWord', { word: expectedWord }) }}
        </p>
        <BFormInput
          v-model="typed"
          :placeholder="expectedWord"
          autocomplete="off"
          data-test="project-account-confirm-word"
        />
        <div class="d-flex justify-content-end gap-2 mt-4">
          <BButton variant="secondary" data-test="project-account-confirm-cancel" @click="cancel">
            {{ $t('form.cancel') }}
          </BButton>
          <BButton
            type="submit"
            variant="danger"
            :disabled="!wordMatches || busy"
            data-test="project-account-confirm-declare"
          >
            {{ $t('settings.creationAccount.confirm.declare') }}
          </BButton>
        </div>
      </BForm>
    </template>

    <!-- ── switching back ON: a request, not a switch -- said before it is sent ──────── -->
    <template v-else>
      <p class="h5 mb-2">{{ $t('settings.creationAccount.confirm.requestTitle') }}</p>
      <p data-test="project-account-confirm-text">
        {{ $t('settings.creationAccount.confirm.requestText') }}
      </p>
      <div class="d-flex justify-content-end gap-2 mt-4">
        <BButton variant="secondary" data-test="project-account-confirm-cancel" @click="cancel">
          {{ $t('form.cancel') }}
        </BButton>
        <BButton
          variant="gradido"
          :disabled="busy"
          data-test="project-account-confirm-request"
          @click="emit('confirm')"
        >
          {{ $t('settings.creationAccount.confirm.send') }}
        </BButton>
      </div>
    </template>
  </div>
</template>
<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { BButton, BForm, BFormInput } from 'bootstrap-vue-next'

const props = defineProps({
  /** 'declare' = switch creation off (two steps), 'request' = ask for it back (one step). */
  mode: { type: String, required: true },
  busy: { type: Boolean, default: false },
})
const emit = defineEmits(['confirm', 'cancel'])
const { t } = useI18n()

const step = ref(1)
const typed = ref('')

/**
 * The word is a locale value, so a member types it in their own language. Compared without
 * case and without surrounding blanks: the point is that the member READ it, not that they
 * hit the shift key.
 */
const expectedWord = computed(() => t('settings.creationAccount.confirm.word'))
const wordMatches = computed(
  () => typed.value.trim().toUpperCase() === expectedWord.value.trim().toUpperCase(),
)

const confirmIfMatching = () => {
  if (wordMatches.value && !props.busy) {
    emit('confirm')
  }
}

const cancel = () => {
  step.value = 1
  typed.value = ''
  emit('cancel')
}
</script>
