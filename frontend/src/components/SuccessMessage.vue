<template>
  <div class="bg-white app-box-shadow gradido-border-radius p-3">
    <div class="p-4" data-test="success-message">
      {{ $t('form.thx') }}
      <hr />
      {{ message }}
    </div>
    <div class="text-center mt-5">
      <BButton variant="primary" @click="$emit('on-back')">
        {{ $t('form.close') }}
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
})

defineEmits(['on-back'])
</script>
