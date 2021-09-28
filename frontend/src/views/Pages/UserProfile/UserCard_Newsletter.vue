<template>
  <b-card id="formusernewsletter" class="card-border-radius card-background-gray">
    <div>
      <b-row class="mb-3">
        <b-col class="mb-2 col-12">
          <small>
            <b>{{ $t('settings.newsletter.newsletter') }}</b>
          </small>
        </b-col>
        <b-col class="col-12">
          <b-form-checkbox
            class="Test-BFormCheckbox"
            v-model="newsletterState"
            name="check-button"
            switch
            @change="onSubmit"
          >
            {{
              newsletterState
                ? $t('settings.newsletter.newsletterTrue')
                : $t('settings.newsletter.newsletterFalse')
            }}
          </b-form-checkbox>
        </b-col>
      </b-row>
    </div>
  </b-card>
</template>
<script>
import { subscribeNewsletter, unsubscribeNewsletter } from '../../../graphql/mutations'

export default {
  name: 'FormUserNewsletter',
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
          variables: {
            email: this.$store.state.email,
            language: this.newsletterState ? this.$store.state.language : undefined,
          },
        })
        .then(() => {
          this.$store.commit('newsletterState', this.newsletterState)
          this.$toasted.success(
            this.newsletterState
              ? this.$t('settings.newsletter.newsletterTrue')
              : this.$t('settings.newsletter.newsletterFalse'),
          )
        })
        .catch((error) => {
          this.newsletterState = this.$store.state.newsletterState
          this.$toasted.error(error.message)
        })
    },
  },
}
</script>
