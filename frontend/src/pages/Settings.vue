<template>
  <div class="card bg-white gradido-border-radius appBoxShadow p-4 mt--3">
    <b-form @submit="onSubmit('personalDetails')" @change="disabled = !disabled">
      <div class="h2">{{ $t('PersonalDetails') }}</div>
      <b-row>
        <b-col cols="12" md="6" lg="6">
          <div role="group">
            <label for="input-live0">{{ $t('form.username') }}</label>
            <b-form-input
              id="input-live0"
              v-model="username"
              placeholder="Enter your username"
              trim
              readonly
            ></b-form-input>
          </div>
        </b-col>
        <b-col cols="12" md="6" lg="6">
          <div role="group">
            <label for="input-live0">{{ $t('form.email') }}</label>
            <b-form-input id="input-live0" v-model="email" trim readonly></b-form-input>
          </div>
        </b-col>
      </b-row>
      <div class="text-small mt-3">
        Dein Nutzername und E-Mail können momentan nicht geändert werden.
      </div>
      <hr />
      <b-row class="mt-3">
        <b-col cols="12" md="6" lg="6">
          <div role="group">
            <label for="input-live1">{{ $t('form.firstname') }}</label>
            <b-form-input
              id="input-live1"
              v-model="firstName"
              placeholder="Enter your firstname"
              trim
            ></b-form-input>
          </div>
        </b-col>
        <b-col cols="12" md="6" lg="6">
          <div role="group">
            <label for="input-live2">{{ $t('form.lastname') }}</label>
            <b-form-input
              id="input-live2"
              v-model="lastName"
              placeholder="Enter your lastname"
              trim
            ></b-form-input>
          </div>
        </b-col>
      </b-row>

      <div v-if="!disabled" class="mt-4 pt-4 text-center">
        <b-button type="submit" variant="primary" :disabled="disabled">
          {{ $t('form.save') }}
        </b-button>
      </div>
      <hr />
      <b-row>
        <b-col cols="12" md="6" lg="6">{{ $t('language') }}</b-col>
        <b-col cols="12" md="6" lg="6" class="text-right">
          <user-language />
        </b-col>
      </b-row>

      <hr />
      <div class="h3 mt-5">{{ $t('form.password') }}</div>
      <user-password />
      <hr />
      <b-row class="mb-5">
        <b-col cols="12" md="6" lg="6">{{ $t('settings.newsletter.newsletter') }}</b-col>
        <b-col cols="12" md="6" lg="6" class="text-right">
          <b-form-checkbox
            v-model="newsletterState"
            name="check-button"
            switch
            @change="onSubmit('newsletters')"
          ></b-form-checkbox>
        </b-col>
      </b-row>
      <b-row>
        <b-col cols="12" md="6" lg="6">Dark - light mode</b-col>
        <b-col cols="12" md="6" lg="6" class="text-right">
          <b-form-checkbox v-model="darkMode" name="dark-mode" switch></b-form-checkbox>
        </b-col>
      </b-row>
    </b-form>
  </div>
</template>
<script>
import UserPassword from '@/components/UserSettings/UserPassword'
import UserLanguage from '@/components/LanguageSwitch2.vue'
import { updateUserInfos, subscribeNewsletter, unsubscribeNewsletter } from '@/graphql/mutations'

export default {
  name: 'Profile',
  components: {
    UserPassword,
    UserLanguage,
  },
  props: {
    balance: { type: Number, default: 0 },
    transactionCount: { type: Number, default: 0 },
  },
  data() {
    return {
      darkMode: this.$store.state.darkMode,
      username: '',
      firstName: this.$store.state.firstName,
      lastName: this.$store.state.lastName,
      email: this.$store.state.email,
      selected: this.$store.state.language,
      newsletterState: this.$store.state.newsletterState,
      mutation: '',
      variables: {},
      disabled: true,
    }
  },
  watch: {
    darkMode(val) {
      this.$store.commit('setDarkMode', this.darkMode)
    },
  },
  methods: {
    async onSubmit(key) {
      switch (key) {
        case 'personalDetails':
          this.mutation = updateUserInfos
          this.variables = {
            firstName: this.firstName,
            lastName: this.lastName,
          }
          break
        case 'newsletters':
          this.mutation = this.newsletterState ? subscribeNewsletter : unsubscribeNewsletter
          break
        default:
          break
      }
      this.$apollo
        .mutate({
          mutation: this.mutation,
          variables: this.variables,
        })
        .then(() => {
          switch (key) {
            case 'personalDetails':
              this.$store.commit('firstName', this.firstName)
              this.$store.commit('lastName', this.form.lastName)
              this.showUserData = true
              this.toastSuccess(this.$t('settings.name.change-success'))
              break
            case 'newsletters':
              this.$store.commit('newsletterState', this.newsletterState)
              this.toastSuccess(
                this.newsletterState
                  ? this.$t('settings.newsletter.newsletterTrue')
                  : this.$t('settings.newsletter.newsletterFalse'),
              )
              break
            default:
              break
          }
        })
        .catch((error) => {
          switch (key) {
            case 'newsletters':
              this.newsletterState = this.$store.state.newsletterState
              this.toastError(error.message)
              break
            default:
              break
          }
        })
    },
    updateTransactions(pagination) {
      this.$emit('update-transactions', pagination)
    },
  },
  created() {
    this.updateTransactions(0)
  },
}
</script>
<style>
.card-border-radius {
  border-radius: 0px 5px 5px 0px !important;
}
@media screen and (max-width: 1235px) {
  .card-border-radius {
    border-radius: 0px !important;
  }
}
.card-background-gray {
  background-color: #ebebeba3 !important;
}
</style>
