<template>
  <b-card
    id="formusernewsletter"
    class="bg-transparent"
    style="background-color: #ebebeba3 !important"
  >
    <div>
      <b-row class="mb-3">
        <b-col class="mb-2 col-12">
          <small>
            <b>{{ $t('setting.newsletter') }}</b>
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
            {{ newsletterState ? $t('setting.newsletterTrue') : $t('setting.newsletterFalse') }}
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
            language: this.$store.state.language,
          },
        })
        .then(() => {
          this.$store.commit('newsletterState', this.newsletterState)
          this.$toasted.success(
            this.newsletterState
              ? this.$t('setting.newsletterTrue')
              : this.$t('setting.newsletterFalse'),
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
