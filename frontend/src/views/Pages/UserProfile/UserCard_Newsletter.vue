<template>
  <b-card
    id="formusernewsletter"
    class="bg-transparent"
    style="background-color: #ebebeba3 !important"
  >
    <div>
      <b-row class="mb-4 text-right">
        <b-col class="text-right">
          <div>
            <b-form-checkbox
              class="text-right Test-BFormCheckbox"
              v-model="NewsletterStatus"
              name="check-button"
              switch
            >
              {{ $t('setting.changeNewsletter') }}
            </b-form-checkbox>
          </div>
        </b-col>
      </b-row>
    </div>

    <div v-if="showNewsletter">
      <b-row class="mb-3">
        <b-col class="col-lg-3 col-md-10 col-sm-10 text-md-left text-lg-right">
          <small>{{ $t('setting.newsletter') }}</small>
        </b-col>
        <b-col class="h2 col-md-9 col-sm-10">
          {{ NewsletterStatus ? $t('setting.newsletterTrue') : $t('setting.newsletterFalse') }}
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
  methods: {
    async onSubmit() {
      this.$apollo
        .query({
          query: updateUserInfos,
          variables: {
            newsletter: this.$store.state.newsletter /* exestiert noch nicht im store */,
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
