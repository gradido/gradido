<template>
  <b-card
    id="formusernewsletter"
    class="bg-transparent"
    style="background-color: #ebebeba3 !important"
  >
    <div>
      <b-row class="mb-4 text-right">
        <b-col class="text-right">
          <a @click="showNewsletter ? (showNewsletter = !showNewsletter) : cancelEdit()">
            <span class="pointer mr-3">{{ $t('form.changeNewsletter') }}</span>
            <b-icon v-if="showNewsletter" class="pointer ml-3" icon="pencil"></b-icon>
            <b-icon v-else icon="x-circle" class="pointer ml-3" variant="danger"></b-icon>
          </a>
        </b-col>
      </b-row>
    </div>

    <div v-if="showNewsletter">
      <b-row class="mb-3">
        <b-col class="col-lg-3 col-md-10 col-sm-10 text-md-left text-lg-right">
          <small>{{ $t('newsletter') }}</small>
        </b-col>
        <b-col class="h2 col-md-9 col-sm-10">Aktueller Newsletter Status</b-col>
      </b-row>
    </div>

    <div v-else>
      <div>
        <b-form @submit.stop.prevent="handleSubmit(onSubmit)">
          <b-row class="mb-2">
            <b-col class="col-lg-3 col-md-10 col-sm-10 text-md-left text-lg-right">
              <small>{{ $t('newsletter') }}</small>
            </b-col>
            <b-col class="col-md-9 col-sm-10">
              Form Newsletter status ändern
            </b-col>
          </b-row>

          <b-row class="text-right">
            <b-col>
              <div class="text-right">
                <b-button type="submit" variant="primary" class="mt-4">
                  {{ $t('form.save') }}
                </b-button>
              </div>
            </b-col>
          </b-row>
        </b-form>
      </div>
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
    cancelEdit() {
      this.showNewsletter = true
    },
    async onSubmit() {
      this.$apollo
        .query({
          query: updateUserInfos,
          variables: {
            newsletter: this.$store.state.newsletter, /* exestiert noch nicht im store*/
          },
        })
        .then(() => {
          this.cancelEdit()
        })
        .catch((error) => {
          this.$toasted.error(error.message)
        })
    },
  },
}
</script>
