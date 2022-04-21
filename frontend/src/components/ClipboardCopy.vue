<template>
  <div class="clipboard-copy">
    <b-input-group size="lg" class="mb-3" prepend="Link">
      <b-form-input :value="text" type="text" readonly></b-form-input>
      <b-input-group-append>
        <b-button size="sm" text="Button" variant="success" @click="CopyLink">
          {{ $t('gdd_per_link.copy') }}
        </b-button>
        <b-button variant="info" @click="$emit('show-qr-code-button')">
          {{ $t('qrCode') }}
        </b-button>
      </b-input-group-append>
    </b-input-group>
  </div>
</template>
<script>
export default {
  name: 'ClipboardCopy',
  props: {
    text: { type: String, required: true },
  },
  methods: {
    CopyLink() {
      navigator.clipboard
        .writeText(this.url)
        .then(() => {
          this.toastSuccess(this.$t('gdd_per_link.link-copied'))
        })
        .catch(() => {
          this.toastError(this.$t('gdd_per_link.not-copied'))
        })
    },
  },
}
</script>
