<template>
  <div class="clipboard-copy">
    <b-input-group size="lg" class="mb-3" prepend="Link">
      <b-form-input :value="link" type="text" readonly></b-form-input>
      <b-input-group-append>
        <b-button size="sm" text="Button" variant="primary" @click="CopyLink">
          {{ $t('gdd_per_link.copy') }}
        </b-button>
        <b-button variant="primary" class="text-light" @click="$emit('show-qr-code-button')">
          <b-img src="img/svg/qr-code.svg" width="19" class="svg"></b-img>
        </b-button>
      </b-input-group-append>
    </b-input-group>
  </div>
</template>
<script>
export default {
  name: 'ClipboardCopy',
  props: {
    link: { type: String, required: true },
  },
  methods: {
    CopyLink() {
      navigator.clipboard
        .writeText(this.link)
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
<style>
.svg {
  filter: brightness(0) invert(1);
}
</style>
