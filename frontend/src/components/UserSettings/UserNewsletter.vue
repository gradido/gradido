<template>
  <div class="formusernewsletter">
    <b-form-checkbox
      v-model="newsletterState"
      test="BFormCheckbox"
      name="check-button"
      switch
      @change="onSubmit"
    ></b-form-checkbox>
  </div>
</template>
<script>
import { subscribeNewsletter, unsubscribeNewsletter } from '@/graphql/mutations'

export default {
  name: 'UserNewsletter',
  data() {
    return {
      newsletterState: this.$store.state.newsletterState,
    }
  },
  methods: {
    async onSubmit() {
      this.$apollo
        .mutate({
          mutation: this.newsletterState ? subscribeNewsletter : unsubscribeNewsletter,
        })
        .then(() => {
          this.$store.commit('newsletterState', this.newsletterState)
          this.toastSuccess(
            this.newsletterState
              ? this.$t('settings.newsletter.newsletterTrue')
              : this.$t('settings.newsletter.newsletterFalse'),
          )
        })
        .catch((error) => {
          this.newsletterState = this.$store.state.newsletterState
          this.toastError(error.message)
        })
    },
  },
}
</script>
