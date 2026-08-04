<template>
  <div v-if="appOutdated" class="app-outdated-bar" role="alert" data-test="app-outdated-bar">
    <span class="app-outdated-text">{{ $t('appOutdated.text') }}</span>
    <BButton size="sm" variant="light" data-test="app-outdated-reload" @click="reloadApp">
      {{ $t('appOutdated.reload') }}
    </BButton>
  </div>
</template>

<script setup>
// Shown when the server rejected an operation this bundle sent, which means the tab has been
// open across a deploy. The reload is a button, never automatic: whoever is mid-contribution
// must get the chance to copy their text out first.
import { useAppOutdated } from '@/composables/useAppOutdated'

const { appOutdated, reloadApp } = useAppOutdated()
</script>

<style scoped>
.app-outdated-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding: 0.6rem 1rem;
  background-color: var(--bs-warning, #f3cd7c);
  color: #000;
  text-align: center;
}

.app-outdated-text {
  font-weight: 500;
}
</style>
