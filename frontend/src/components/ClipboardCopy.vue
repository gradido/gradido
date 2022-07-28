<template>
  <div class="clipboard-copy">
    <b-input-group v-if="canCopyLink" size="lg" class="mb-3" prepend="Link">
      <b-form-input :value="link" type="text" readonly></b-form-input>
      <b-input-group-append>
        <b-button size="sm" text="Button" variant="primary" @click="copyLinkWithText">
          {{ $t('gdd_per_link.copy-link-with-text') }}
        </b-button>
        <b-button size="sm" text="Button" variant="primary" @click="copyLink">
          {{ $t('gdd_per_link.copy-link') }}
        </b-button>
        <b-button variant="primary" class="text-light" @click="$emit('show-qr-code-button')">
          <b-img src="img/svg/qr-code.svg" width="19" class="svg"></b-img>
        </b-button>
      </b-input-group-append>
    </b-input-group>
    <div v-else>
      <div class="alert-danger p-3">{{ $t('gdd_per_link.not-copied') }}</div>
      <div class="alert-muted h3 p-3">{{ link }}</div>
    </div>
  </div>
</template>
<script>
import { copyLinks } from '@/mixins/copyLinks'
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
