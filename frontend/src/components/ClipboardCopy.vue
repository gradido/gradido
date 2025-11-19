<template>
  <div class="clipboard-copy">
    <div v-if="canCopyLink" class="mb-5">
      <div>
        <label>{{ $t('gdd_per_link.copy-link-with-text') }}</label>
        <div
          class="copy-link-card pointer text-center gradido-border-radius p-3"
          data-test="copyLinkWithText"
          @click="copyLinkWithText"
        >
          {{ linkText }}
          <div>
            <BButton class="mt-1 p-4 gradido-border-radius">
              <IBiCopy />
            </BButton>
          </div>
        </div>
      </div>
      <div class="mt-5">
        <label>{{ $t('gdd_per_link.copy-link') }}</label>
        <div
          class="copy-link-card pointer text-center gradido-border-radius p-3"
          data-test="copyLink"
          @click="copyLink"
        >
          {{ link }}
          <div>
            <BButton class="mt-1 p-4 gradido-border-radius">
              <IBiCopy />
            </BButton>
          </div>
        </div>
      </div>
    </div>
    <div v-else>
      <div class="alert-danger p-3">{{ $t('gdd_per_link.not-copied') }}</div>
      <div class="alert-muted h3 p-3">{{ link }}</div>
    </div>
  </div>
</template>
<script setup>
import { useCopyLinks } from '@/composables/useCopyLinks'

const props = defineProps({
  link: { type: String, required: true },
  amount: { type: String, required: true },
  memo: { type: String, required: true },
  validUntil: { type: String, required: true },
})

const { copyLink, copyLinkWithText, linkText, canCopyLink } = useCopyLinks({ ...props })
</script>

<style lang="scss">
.svg {
  filter: brightness(0) invert(1);
}

.copy-link-card {
  background-color: $secondary !important;
}
</style>
