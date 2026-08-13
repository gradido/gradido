<template>
  <div class="clipboard-copy">
    <div v-if="canCopyLink">
      <div class="mb-4">
        <label class="copy-label">
          {{ $t('gdd_per_link.copy-link') }}
          <BButton size="sm" class="copy-icon" data-test="copyLinkButton" @click="copyLink">
            <IBiCopy />
          </BButton>
        </label>
        <div
          class="copy-link-card pointer text-center gradido-border-radius p-3"
          data-test="copyLink"
          @click="copyLink"
        >
          {{ link }}
        </div>
      </div>
      <div class="mb-4">
        <label class="copy-label">
          {{ $t('gdd_per_link.copy-link-with-text') }}
          <BButton
            size="sm"
            class="copy-icon"
            data-test="copyLinkWithTextButton"
            @click="copyLinkWithText"
          >
            <IBiCopy />
          </BButton>
        </label>
        <div
          class="copy-link-card pointer text-center gradido-border-radius p-3"
          data-test="copyLinkWithText"
          @click="copyLinkWithText"
        >
          {{ linkText }}
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

/* The icon sits next to the heading instead of below the box: on a page that offers four
   things in a row, a button the size of the ones before took more room than it earned. */
.copy-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.copy-icon {
  padding: 0.15rem 0.45rem;
  line-height: 1;
}
</style>
