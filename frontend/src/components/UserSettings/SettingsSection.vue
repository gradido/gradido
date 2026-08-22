<!-- AI-GENERATED — not an architecture reference -->
<template>
  <div class="card bg-white gradido-border-radius appBoxShadow p-4 mt--3">
    <!-- Only on the phone. On a wide screen the settings menu stands in the layout column
         to the left and carries its own way back to the account; here the list at /settings
         is the menu, so this is the way back to it. -->
    <router-link
      to="/settings"
      class="settings-section-back d-lg-none"
      data-test="back-to-settings"
    >
      <i-mdi-arrow-left class="svg-icon" />
      <span class="ms-2">{{ $t('navigation.back-to-settings') }}</span>
    </router-link>
    <div class="h2">{{ title }}</div>
    <div class="mt-4">
      <slot />
    </div>
  </div>
</template>
<script setup>
defineProps({
  title: { type: String, required: true },
})
</script>
<style scoped>
.settings-section-back {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  font-weight: bold;
}
</style>
