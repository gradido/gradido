<template>
  <b-container>
    <b-row>
      <b-col>
        <b-card class="p-0 gradido-custom-background">
          <div class="p-4">
            <div class="h3 mb-5">{{ $t('gdd_per_link.created') }}</div>
            <clipboard-copy :link="link" />
          </div>
          <p class="text-center mt-3">
            <b-button variant="success" @click="$emit('on-reset')">{{ $t('form.close') }}</b-button>
          </p>
        </b-card>
      </b-col>
    </b-row>
  </b-container>
</template>
<script>
import ClipboardCopy from '../ClipboardCopy.vue'

export default {
  name: 'TransactionResultLink',
  components: {
    ClipboardCopy,
  },
  props: {
    link: {
      type: String,
      required: true,
    },
  },
}
</script>
