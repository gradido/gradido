<template>
  <div class="clipboard-copy">
    <b-input-group v-if="canCopyLink" size="lg" class="mb-3" prepend="Link">
      <b-form-input :value="link" type="text" readonly></b-form-input>
      <b-input-group-append>
        <b-button size="sm" text="Button" variant="primary" @click="copyLinkWithText">
          {{ $t('gdd_per_link.copy-with-text') }}
        </b-button>
        <b-button size="sm" text="Button" variant="primary" @click="CopyLink">
          {{ $t('gdd_per_link.copy') }}
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
export default {
  name: 'ClipboardCopy',
  props: {
    link: { type: String, required: true },
    amount: { type: Number, required: true },
    memo: { type: String, required: true },
  },
  data() {
    return {
      canCopyLink: true,
    }
  },
  methods: {
    CopyLink() {
      navigator.clipboard
        .writeText(this.link)
        .then(() => {
          this.toastSuccess(this.$t('gdd_per_link.link-copied'))
        })
        .catch(() => {
          this.canCopyLink = false
          this.toastError(this.$t('gdd_per_link.not-copied'))
        })
    },
    copyLinkWithText() {
      navigator.clipboard
        .writeText(
          `${this.link}
${this.$store.state.firstName} ${this.$t('transaction-link.send_you')} ${this.amount} Gradido.
"${this.memo}"`,
        )
        .then(() => {
          this.toastSuccess(this.$t('gdd_per_link.link-and-text-copied'))
        })
        .catch(() => {
          this.canCopyLink = false
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
