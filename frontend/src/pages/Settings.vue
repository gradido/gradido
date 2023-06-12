<template>
  <div class="card bg-white gradido-border-radius appBoxShadow p-4 mt--3">
    <div class="h2">{{ $t('PersonalDetails') }}</div>
    <div class="m-4 text-small">
      {{ $t('settings.info') }}
    </div>

    <b-row>
      <b-col cols="12" md="6" lg="6">
        <user-name />
      </b-col>
      <b-col cols="12" md="6" lg="6">
        <b-form-group :label="$t('form.email')" :description="$t('settings.emailInfo')">
          <b-form-input v-model="email" readonly></b-form-input>
        </b-form-group>
      </b-col>
    </b-row>

    <hr />
    <b-form>
      <b-row class="mt-3">
        <b-col cols="12" md="6" lg="6">
          <label>{{ $t('form.firstname') }}</label>
          <b-form-input
            v-model="firstName"
            :placeholder="$t('settings.name.enterFirstname')"
            data-test="test-firstname"
            trim
          ></b-form-input>
        </b-col>
        <b-col cols="12" md="6" lg="6">
          <label>{{ $t('form.lastname') }}</label>
          <b-form-input
            v-model="lastName"
            :placeholder="$t('settings.name.enterLastname')"
            data-test="test-lastname"
            trim
          ></b-form-input>
        </b-col>
      </b-row>
      <div v-if="!isDisabled" class="mt-4 pt-4 text-center">
        <b-button
          data-test="submit-userdata"
          type="submit"
          variant="primary"
          @click.prevent="onSubmit"
        >
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
      <b-col cols="12" md="6" lg="6">
        {{ $t('settings.newsletter.newsletter') }}
        <div class="text-small">
          {{
            newsletterState
              ? $t('settings.newsletter.newsletterTrue')
              : $t('settings.newsletter.newsletterFalse')
          }}
        </div>
      </b-col>
      <b-col cols="12" md="6" lg="6" class="text-right">
        <user-newsletter />
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
import UserName from '@/components/UserSettings/UserName.vue'
import UserPassword from '@/components/UserSettings/UserPassword'
import UserLanguage from '@/components/LanguageSwitch2.vue'
import UserNewsletter from '@/components/UserSettings/UserNewsletter.vue'
import { updateUserInfos } from '@/graphql/mutations'

export default {
  name: 'Profile',
  components: {
    UserName,
    UserPassword,
    UserLanguage,
    UserNewsletter,
  },
  props: {
    balance: { type: Number, default: 0 },
    transactionCount: { type: Number, default: 0 },
  },

  data() {
    const { state } = this.$store
    const { darkMode, firstName, lastName, email, newsletterState } = state

    return {
      darkMode,
      username: '',
      firstName,
      lastName,
      email,
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
      this.$store.commit('setDarkMode', this.darkMode)
      this.toastSuccess(
        this.darkMode ? this.$t('settings.modeDark') : this.$t('settings.modeLight'),
      )
    },
  },
  methods: {
    async onSubmit(key) {
      try {
        await this.$apollo.mutate({
          mutation: updateUserInfos,
          variables: {
            firstName: this.firstName,
            lastName: this.lastName,
          },
        })
        this.$store.commit('firstName', this.firstName)
        this.$store.commit('lastName', this.lastName)
        this.showUserData = true
        this.toastSuccess(this.$t('settings.name.change-success'))
      } catch (error) {}
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
