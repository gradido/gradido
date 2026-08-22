<!-- AI-GENERATED — not an architecture reference -->
<template>
  <!-- ⚠️ Spelled out rather than resolved from a variable. The icons are auto-imported at
       compile time (unplugin-icons through the components resolver); `<component :is>` would
       look for a globally registered component at RUNTIME and find none, and importing them
       as `~icons/...` modules breaks every test, because vitest.config.js carries no icons
       plugin. Seven lines here keep the list itself readable and the tests running. -->
  <i-mdi-account v-if="name === 'account'" />
  <i-mdi-palette-outline v-else-if="name === 'appearance'" />
  <i-mdi-card-account-details-outline v-else-if="name === 'gradido-card'" />
  <i-mdi-credit-card-outline v-else-if="name === 'thank-you-card'" />
  <i-mdi-eye-outline v-else-if="name === 'visibility'" />
  <i-mdi-bell-outline v-else-if="name === 'notifications'" />
  <i-mdi-account-group v-else-if="name === 'communities'" />
</template>
<script setup>
defineProps({
  name: { type: String, required: true },
})
</script>
