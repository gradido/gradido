<template>
  <div class="login-form">
    <div class="pb-5">Melde dich mit deinen Zugangsdaten an. Bewahre sie stet's sicher auf!</div>
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
          <b-col sm="12" md="6"><input-email v-model="form.email"></input-email></b-col>
          <b-col sm="12" md="6">
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
            <router-link to="/forgot-password" class="mt-3">
              {{ $t('settings.password.forgot_pwd') }}
            </router-link>
          </b-col>
        </b-row>
        <div class="mt-4">
          <b-button type="submit" variant="gradido">{{ $t('login') }}</b-button>
        </div>
      </b-form>
    </validation-observer>
  </div>
</template>
<script>
import InputPassword from '@/components/Inputs/InputPassword'
import InputEmail from '@/components/Inputs/InputEmail'
import { login } from '@/graphql/queries'
import { getCommunityInfoMixin } from '@/mixins/getCommunityInfo'

export default {
  name: 'Login',
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
      status: false,
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
