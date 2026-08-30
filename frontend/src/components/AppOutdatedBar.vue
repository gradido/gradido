<template>
  <div v-if="appOutdated" class="app-outdated-bar" role="alert" data-test="app-outdated-bar">
    <span class="app-outdated-text">{{ $t('appOutdated.text') }}</span>
    <BButton size="sm" variant="light" data-test="app-outdated-reload" @click="reloadApp">
      {{ $t('appOutdated.reload') }}
    </BButton>
  </div>
</template>

<script setup>
// Shown when this bundle is no longer the one the server is working with. Two things raise
// it: apolloProvider, when an operation is rejected because the schema moved under an open
// tab -- and newVersionCheck, which asks for index.html now and then and finds a newer build
// being served. The second is the common one and it means nothing is broken yet, so the text
// stays an offer rather than an error.
//
// The reload is a button, never automatic: whoever is mid-contribution must get the chance to
// copy their text out first.
import { useAppOutdated } from '@/composables/useAppOutdated'

const { appOutdated, reloadApp } = useAppOutdated()
</script>

<style scoped>
/**
 * ⛔ `--warning`, the house token, NOT Bootstrap's `--bs-warning`. They are not the same
 * colour here: gradido.css defines `--bs-warning: #8c0505`, a dark red, in the only place it
 * is set -- so the amber fallback next to it never applied and this bar was black text on
 * dark red at 2.14:1, well under the 4.5:1 that is readable. `--warning` is #f5b539 in
 * _design-tokens.scss AND the same value in gradido-template-dark.scss, so one pair of
 * colours serves both modes: #383838 on it measures 6.45:1.
 */
.app-outdated-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding: 0.6rem 1rem;
  background-color: var(--warning, #f5b539);
  color: #383838;
  text-align: center;
}

.app-outdated-text {
  font-weight: 500;
}
</style>
