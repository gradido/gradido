<template>
  <div class="clipboard-copy">
    <div v-if="canCopyLink" class="mb-5">
      <div>
        <label>{{ $t('gdd_per_link.copy-link') }}</label>
        <div class="pointer text-center bg-secondary gradido-border-radius p-3" @click="copyLink">
          {{ link }}
          <div>
            <b-button class="p-4">
              <b-icon icon="link45deg"></b-icon>
            </b-button>
          </div>
        </div>
      </div>
      <div class="mt-5">
        <label>{{ $t('gdd_per_link.copy-link-with-text') }}</label>
        <div
          class="pointer text-center bg-secondary gradido-border-radius p-3"
          @click="copyLinkWithText"
        >
          {{ text }}
          <div>
            <b-button class="p-4">
              <b-icon icon="link45deg"></b-icon>
            </b-button>
          </div>
        </div>
        <div></div>
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
