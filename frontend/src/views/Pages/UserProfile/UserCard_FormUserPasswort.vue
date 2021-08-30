<template>
  <div
    id="change_pwd"
    class="bg-transparent pt-3 pb-3"
    style="background-color: #ebebeba3 !important"
  >
    <b-container>
      <div>
        <b-row class="mb-4 text-right">
          <b-col class="text-right">
            <a @click="!editPassword ? (editPassword = !editPassword) : cancelEdit()">
              <span class="pointer mr-3">{{ $t('form.change-password') }}</span>
              <b-icon v-if="!editPassword" class="pointer ml-3" icon="pencil" />
              <b-icon v-else icon="x-circle" class="pointer ml-3" variant="danger"></b-icon>
            </a>
          </b-col>
        </b-row>
      </div>
      <div v-if="editPassword">
        <validation-observer ref="observer" v-slot="{ handleSubmit }">
          <b-form @submit.stop.prevent="handleSubmit(onSubmit)">
            <b-row class="mb-2">
              <b-col>
                <input-password
                  :label="$t('form.password_old')"
                  :placeholder="$t('form.password_old')"
                  v-model="form.password"
                ></input-password>
              </b-col>
            </b-row>
            <input-password-confirmation v-model="form.newPassword" :register="register" />
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
        </validation-observer>
      </div>
    </b-container>
  </div>
</template>
<script>
import InputPassword from '../../../components/Inputs/InputPassword'
import InputPasswordConfirmation from '../../../components/Inputs/InputPasswordConfirmation'
import { updateUserInfos } from '../../../graphql/queries'

export default {
  name: 'FormUserPasswort',
  components: {
    InputPassword,
    InputPasswordConfirmation,
  },
  data() {
    return {
      editPassword: false,
      email: null,
      form: {
        password: '',
        newPassword: {
          password: '',
          passwordRepeat: '',
        },
      },
      register: false,
    }
  },
  methods: {
    cancelEdit() {
      this.editPassword = false
      this.form.password = ''
      this.form.passwordNew = ''
      this.form.passwordNewRepeat = ''
    },
    async onSubmit() {
      this.$apollo
        .query({
          query: updateUserInfos,
          variables: {
            email: this.$store.state.email,
            password: this.form.password,
            passwordNew: this.form.newPassword.password,
          },
        })
        .then(() => {
          this.$toasted.success(this.$t('site.thx.reset'))
          this.cancelEdit()
        })
        .catch((error) => {
          this.$toasted.error(error.message)
        })
    },
  },
}
</script>
