<template>
  <div class="card bg-white gradido-border-radius appBoxShadow p-4 mt--3">
    <div class="h2">{{ $t('PersonalDetails') }}</div>
    <b-row>
      <b-col cols="12" md="6" lg="6">
        <b-form-group :label="$t('form.username')" description="kann nicht geändert werden">
          <b-form-input v-model="username" readonly></b-form-input>
        </b-form-group>
      </b-col>
      <b-col cols="12" md="6" lg="6">
        <b-form-group :label="$t('form.email')" description="kann nicht geändert werden">
          <b-form-input v-model="email" readonly></b-form-input>
        </b-form-group>
      </b-col>
    </b-row>
    <hr />
    <b-form @submit="onSubmit('personalDetails')">
      <b-row class="mt-3">
        <b-col cols="12" md="6" lg="6">
          <label>{{ $t('form.firstname') }}</label>
          <b-form-input v-model="firstName" placeholder="Enter your firstname" trim></b-form-input>
        </b-col>
        <b-col cols="12" md="6" lg="6">
          <label>{{ $t('form.lastname') }}</label>
          <b-form-input v-model="lastName" placeholder="Enter your lastname" trim></b-form-input>
        </b-col>
      </b-row>
      {{ isDisabled }}
      <div v-if="!isDisabled" class="mt-4 pt-4 text-center">
        <b-button type="submit" variant="primary">
          {{ $t('form.save') }}
        </b-button>
      </div>
    </b-form>
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
      <b-col cols="12" md="6" lg="6">{{ $t('settings.darkMode') }}</b-col>
      <b-col cols="12" md="6" lg="6" class="text-right">
        <b-form-checkbox v-model="darkMode" name="dark-mode" switch aligne></b-form-checkbox>
      </b-col>
    </b-row>
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
    const { state } = this.$store
    const { darkMode, firstName, lastName, email, language, newsletterState } = state

    return {
      darkMode,
      username: '',
      firstName,
      lastName,
      email,
      selected: language,
      newsletterState,
      mutation: '',
      variables: {},
    }
  },

  computed: {
    isDisabled() {
      const { firstName, lastName } = this.$store.state
      return firstName === this.firstName && lastName === this.lastName
    },
  },
  watch: {
    darkMode(val) {
      const text = this.darkMode ? this.$t('settings.modeDark') : this.$t('settings.modeLight')
      this.$store.commit('setDarkMode', this.darkMode)
      this.toastSuccess(text)
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
          this.$store.commit('firstName', this.firstName)
          this.$store.commit('lastName', this.form.lastName)
          this.showUserData = true
          this.toastSuccess(this.$t('settings.name.change-success'))
          break
        case 'newsletters':
          this.mutation = this.newsletterState ? subscribeNewsletter : unsubscribeNewsletter
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
      try {
        await this.$apollo.mutate({
          mutation: this.mutation,
          variables: this.variables,
        })
      } catch (error) {
        switch (key) {
          case 'newsletters':
            this.newsletterState = this.$store.state.newsletterState
            this.toastError(error.message)
            break
          default:
            break
        }
      }
    },
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
