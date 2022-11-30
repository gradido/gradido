<template>
  <div class="clipboard-copy">
    <div v-if="canCopyLink" size="lg" class="mb-3">
      <div class="text-center h2">
        {{ link }}
      </div>

      <div class="text-center mt-5">
        <b-button size="sm" text="Button" variant="gradido" @click="copyLink">
          {{ $t('gdd_per_link.copy-link') }}
        </b-button>
        <hr />
        <b-button size="sm" text="Button" variant="gradido" @click="copyLinkWithText">
          {{ $t('gdd_per_link.copy-link-with-text') }}
        </b-button>
        <hr />
      </div>
    </div>
    <div v-else>
      <div class="alert-danger p-3">{{ $t('gdd_per_link.not-copied') }}</div>
      <div class="alert-muted h3 p-3">{{ link }}</div>
    </div>
  </div>
</template>
<script>
import { copyLinks } from '../mixins/copyLinks'
export default {
  name: 'ClipboardCopy',
  mixins: [copyLinks],
}
</script>
<style>
.svg {
  filter: brightness(0) invert(1);
}
</style>
