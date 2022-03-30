<template>
  <div class="auth-login">
    <div class="h1 mt-7">Willkommen</div>
    <div class="h1">Communities World Wide</div>
    <div>1000 Dank, weil du bei uns bist!</div>
    <b-card no-body class="border-0 mt-4 gradido-custom-background">
      <b-row class="p-4">
        <b-col>
          <div>
            <span>{{ $t('settings.language.de') }}</span>
            |
            <span>{{ $t('settings.language.en') }}</span>
          </div>
        </b-col>
        <b-col class="text-right">
          A
          <span class="h1">A</span>
        </b-col>
      </b-row>
      <div class="p-4">Melde dich mit deinen Zugangsdaten an. Bewahre sie stet's sicher auf!</div>
      <b-card-body class="p-4">
        <!-- <div class="text-center mb-4 test-communitydata">
          <b>{{ $store.state.community.name }}</b>
          <p class="text-lead">
            {{ $store.state.community.description }}
          </p>
          {{ $t('login') }}
        </div> -->
        <label>Wähle deine Community</label>
        <b-form-select
          v-model="selected"
          :options="options"
          class="selectedLanguage mb-3"
        ></b-form-select>

        <validation-observer ref="observer" v-slot="{ handleSubmit }">
          <b-form @submit.stop.prevent="handleSubmit(onSubmit)">
            <b-row>
              <b-col><input-email v-model="form.email"></input-email></b-col>
              <b-col>
                <input-password
                  :label="$t('form.password')"
                  :placeholder="$t('form.password')"
                  :name="$t('form.password')"
                  v-model="form.password"
                ></input-password>
              </b-col>
            </b-row>
            <b-row>
              <b-col>
                <b-form-checkbox
                  v-model="status"
                  name="checkbox-1"
                  value="saved"
                  unchecked-value="not_saved"
                >
                  Anmeldung speichern
                </b-form-checkbox>
              </b-col>
              <b-col>
                <b-link
                  href="#!"
                  class="mt-3"
                  @click="$emit('setAuthItem', 'AUTH_FORGOT_PASSWORD')"
                >
                  {{ $t('settings.password.forgot_pwd') }}
                </b-link>
              </b-col>
            </b-row>
            <div class="mt-4">
              <b-button type="submit" variant="gradido">{{ $t('login') }}</b-button>
            </div>
          </b-form>
        </validation-observer>
      </b-card-body>
    </b-card>
  </div>
</template>
<script>
import InputPassword from '@/components/Inputs/InputPassword'
import InputEmail from '@/components/Inputs/InputEmail'
import { login } from '@/graphql/queries'
import { getCommunityInfoMixin } from '@/mixins/getCommunityInfo'

export default {
  name: 'AuthLogin',
  components: {
    InputPassword,
    InputEmail,
  },
  mixins: [getCommunityInfoMixin],
  data() {
    return {
      form: {
        email: '',
        password: '',
      },
      passwordVisible: false,
      selected: '01',
      options: [{ value: '01', text: this.$store.state.community.name }],
    }
  },
  methods: {
    async onSubmit() {
      const loader = this.$loading.show({
        container: this.$refs.submitButton,
      })
      this.$apollo
        .query({
          query: login,
          variables: {
            email: this.form.email,
            password: this.form.password,
            publisherId: this.$store.state.publisherId,
          },
          fetchPolicy: 'network-only',
        })
        .then(async (result) => {
          const {
            data: { login },
          } = result
          this.$store.dispatch('login', login)
          await loader.hide()
          if (this.$route.params.code) {
            this.$router.push(`/redeem/${this.$route.params.code}`)
          } else {
            this.$router.push('/overview')
          }
        })
        .catch((error) => {
          this.toastError(this.$t('error.no-account'))
          if (error.message.includes('User email not validated')) {
            this.$router.push('/thx/login')
          } else if (error.message.includes('User has no password set yet')) {
            this.$router.push('/reset-password/login')
          }
          loader.hide()
        })
    },
  },
}
</script>
