<template>
  <div class="clipboard-copy">
    <b-input-group size="lg" class="mb-3" prepend="Link">
      <b-form-input v-model="url" type="text" readonly></b-form-input>
      <b-input-group-append>
        <b-button size="sm" text="Button" variant="success" @click="CopyLink">
          {{ $t('gdd_per_link.copy') }}
        </b-button>
      </b-input-group-append>
    </b-input-group>
  </div>
</template>
<script>
export default {
  name: 'ClipboardCopy',
  props: {
    code: { type: String, required: true },
  },
  data() {
    return {
      url: `http://localhost/redeem/${this.code}`,
    }
  },
  methods: {
    CopyLink() {
      navigator.clipboard
        .writeText(this.url)
        .then(() => {
          this.toastSuccess(this.$t('gdd_per_link.link-copied'))
        })
        .catch((err) => {
          this.toastError(this.$t('gdd_per_link.not-copied', { err }))
        })
    },
  },
}
</script>
