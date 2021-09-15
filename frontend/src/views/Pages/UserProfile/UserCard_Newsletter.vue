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
            v-model="NewsletterStatus"
            name="check-button"
            switch
          >
            {{ NewsletterStatus ? $t('setting.newsletterTrue') : $t('setting.newsletterFalse') }}
          </b-form-checkbox>
        </b-col>
      </b-row>
    </div>
  </b-card>
</template>
<script>
import { updateUserInfos } from '../../../graphql/queries'

export default {
  name: 'FormUserNewsletter',
  data() {
    return {
      showNewsletter: true,
      NewsletterStatus: true,
    }
  },
  created() {
    this.NewsletterStatus = this.$store.state.newsletter /* exestiert noch nicht im store */
  },
  methods: {
    async onSubmit() {
      this.$apollo
        .query({
          query: updateUserInfos,
          variables: {
            newsletter: this.$store.state.language /* exestiert noch nicht im store */,
          },
        })
        .then(() => {
          this.$toasted.success(
            this.NewsletterStatus
              ? this.$t('setting.newsletterTrue')
              : this.$t('setting.newsletterFalse'),
          )
        })
        .catch((error) => {
          this.$toasted.error(error.message)
        })
    },
  },
}
</script>
