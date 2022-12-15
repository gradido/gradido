<template>
  <div class="clipboard-copy">
    <div v-if="canCopyLink" size="lg" class="mb-5">
      <div class="d-flex">
        <div>
          <label>{{ $t('gdd_per_link.copy-link') }}</label>
          <div class="pointer text-center bg-secondary gradido-border-radius p-4" @click="copyLink">
            {{ link }}
            <!-- <b-icon icon="clipboard-plus" class="ml-5"></b-icon> -->
          </div>
        </div>
        <div class="ml-5">
          <label>{{ $t('gdd_per_link.copy-link-with-text') }}</label>
          <div>
            <b-button @click="copyLinkWithText" class="p-4">
              <b-icon icon="link45deg"></b-icon>
            </b-button>
          </div>
        </div>
      </div>

      <!-- <div class="text-center mt-5">
          <b-button size="sm" text="Button" variant="gradido" @click="copyLink">
          {{ $t('gdd_per_link.copy-link') }}
        </b-button>
        <hr />  
        <b-button size="sm" text="Button" variant="gradido" @click="copyLinkWithText">
          {{ $t('gdd_per_link.copy-link-with-text') }}
        </b-button>
        <hr />
      </div> -->
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
