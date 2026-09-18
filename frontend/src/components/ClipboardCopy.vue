<template>
  <div class="clipboard-copy">
    <!-- Handing the link on is what this page is for, so it leads: one button for the
         device's own share sheet (it copies where the device has none), and under it the one
         sentence meant for the sender, not for the person the link goes to. The two copy rows
         below stay for whoever wants to paste it somewhere themselves. -->
    <div class="mb-4">
      <BButton variant="gradido" class="w-100" data-test="shareButton" @click="share">
        <IBiShare class="me-2" />
        {{ $t('gdd_per_link.share') }}
      </BButton>
      <div class="share-hint small mt-2" data-test="linkHint">
        <IBiLock class="share-hint-icon" />
        <span>{{ $t('gdd_per_link.link-hint') }}</span>
      </div>
    </div>
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
          class="copy-link-card copy-link-text pointer text-center gradido-border-radius p-3"
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

const { copyLink, copyLinkWithText, linkText, canCopyLink, share } = useCopyLinks({ ...props })
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

<style scoped lang="scss">
/* A link is one unbreakable run, and the cards hide what overflows: on a phone the last
   72 points of a redeem link were cut off (measured at 390). */
.copy-link-card {
  overflow-wrap: anywhere;
}

/* The text goes out as lines, so it is shown as lines: what the member reads here is what
   arrives. */
.copy-link-text {
  white-space: pre-line;
}

.share-hint {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
  color: var(--bs-secondary-color, #6c757d);
}

.share-hint-icon {
  flex-shrink: 0;
  margin-top: 0.15rem;
}
</style>
