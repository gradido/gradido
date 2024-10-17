<template>
  <div class="decayinformation-startblock">
    <div class="my-4">
      <div class="fw-bold pb-2">{{ $t('form.memo') }}</div>
      <div v-html="displayData" />
    </div>
    <div class="mt-3 mb-3 text-center">
      <b>{{ $t('decay.before_startblock_transaction') }}</b>
    </div>
  </div>
</template>
<script setup>
import { computed } from 'vue'

const props = defineProps({
  memo: String,
})

const formatLinks = (text) => {
  // URL regex pattern
  const urlPattern = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim
  // Email regex pattern
  const emailPattern = /(\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b)/g

  // Replace URLs with clickable links
  text = text.replace(urlPattern, '<a href="$1" target="_blank">$1</a>')

  // Replace email addresses with mailto links
  text = text.replace(emailPattern, '<a href="mailto:$1">$1</a>')

  return text
}

const displayData = computed(() => formatLinks(props.memo))
</script>
