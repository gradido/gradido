<template>
  <div class="userdata_form" fluid="sm">
    <div
      id="userdata_form"
      class="bg-transparent pt-3 pb-3"
      style="background-color: #ebebeba3 !important"
    >
      <b-container>
        <b-row class="text-right">
          <b-col class="mb-3">
            <a @click="showUserData ? (showUserData = !showUserData) : cancelEdit()">
              <span class="pointer mr-3">{{ $t('form.change-name') }}</span>

              <b-icon v-if="showUserData" class="pointer" icon="pencil">
                {{ $t('form.change') }}
              </b-icon>

              <b-icon v-else class="pointer" icon="x-circle" variant="danger"></b-icon>
            </a>
          </b-col>
        </b-row>
      </b-container>

      <b-container>
        <b-form @keyup.prevent="loadSubmitButton">
          <b-row class="mb-3">
            <b-col class="col-12 col-lg-3 col-md-12 col-sm-12 text-md-left text-lg-right">
              <small>{{ $t('form.firstname') }}</small>
            </b-col>
            <b-col v-if="showUserData" class="col-sm-10 col-md-9">
              {{ form.firstName }}
            </b-col>
            <b-col v-else class="col-md-9 col-sm-10">
              <b-input type="text" v-model="form.firstName"></b-input>
            </b-col>
          </b-row>
          <b-row class="mb-3">
            <b-col class="col-12 col-lg-3 col-md-12 col-sm-12 text-md-left text-lg-right">
              <small>{{ $t('form.lastname') }}</small>
            </b-col>
            <b-col v-if="showUserData" class="col-sm-10 col-md-9">
              {{ form.lastName }}
            </b-col>
            <b-col v-else class="col-md-9 col-sm-10">
              <b-input type="text" v-model="form.lastName"></b-input>
            </b-col>
          </b-row>
          <b-row class="mb-3" v-show="false">
            <b-col class="col-12 col-lg-3 col-md-10 col-sm-10 text-md-left text-lg-right">
              <small>{{ $t('form.description') }}</small>
            </b-col>
            <b-col v-if="showUserData" class="col-sm-10 col-md-9">
              {{ form.description }}
            </b-col>
            <b-col v-else class="col-sm-10 col-md-9">
              <b-textarea rows="3" max-rows="6" v-model="form.description"></b-textarea>
            </b-col>
          </b-row>

          <b-row class="text-right" v-if="!showUserData">
            <b-col>
              <div class="text-right" ref="submitButton">
                <b-button
                  :variant="loading ? 'default' : 'success'"
                  @click="onSubmit"
                  type="submit"
                  class="mt-4"
                  :disabled="loading"
                >
                  {{ $t('form.save') }}
                </b-button>
              </div>
            </b-col>
          </b-row>
        </b-form>
      </b-container>
    </div>
  </div>
</template>
<script>
import { updateUserInfos } from '../../../graphql/queries'

export default {
  name: 'FormUserData',
  data() {
    return {
      showUserData: true,
      sessionId: this.$store.state.sessionId,
      form: {
        firstName: this.$store.state.firstName,
        lastName: this.$store.state.lastName,
        description: this.$store.state.description,
      },
      loading: true,
    }
  },
  methods: {
    cancelEdit() {
      this.form.firstName = this.$store.state.firstName
      this.form.lastName = this.$store.state.lastName
      this.form.description = this.$store.state.description
      this.showUserData = true
    },
    loadSubmitButton() {
      if (
        this.form.firstName !== this.$store.state.firstName ||
        this.form.lastName !== this.$store.state.lastName ||
        this.form.description !== this.$store.state.description
      ) {
        this.loading = false
      } else {
        this.loading = true
      }
    },
    async onSubmit(event) {
      event.preventDefault()
      this.$apollo
        .query({
          query: updateUserInfos,
          variables: {
            sessionId: this.$store.state.sessionId,
            email: this.$store.state.email,
            firstName: this.form.firstName,
            lastName: this.form.lastName,
            description: this.form.description,
          },
        })
        .then(() => {
          this.$store.commit('firstName', this.form.firstName)
          this.$store.commit('lastName', this.form.lastName)
          this.$store.commit('description', this.form.description)
          this.showUserData = true
          this.$toasted.success(this.$t('site.profil.user-data.change-success'))
        })
        .catch((error) => {
          this.$toasted.error(error.message)
        })
    },
  },
}
</script>
<style></style>
