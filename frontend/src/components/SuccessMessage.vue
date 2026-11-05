<template>
  <div class="bg-white app-box-shadow gradido-border-radius p-3">
    <div class="p-4" data-test="success-message">
      {{ $t('form.thx') }}
      <hr />
      {{ message }}
    </div>
    <div class="text-center mt-5">
      <BButton variant="gradido" data-test="success-message-button" @click="$emit('on-back')">
        {{ buttonText || $t('form.close') }}
      </BButton>
    </div>
  </div>
</template>
<script setup>
import { defineProps, defineEmits } from 'vue'

defineProps({
  message: {
    type: String,
    default: '',
  },
  /**
   * The words on the button, where they are not "Schließen": the send page's "Zurück", which
   * leads out of the page (E-043). A contribution that was handed in keeps "Schließen".
   */
  buttonText: {
    type: String,
    default: null,
  },
})

defineEmits(['on-back'])
</script>
