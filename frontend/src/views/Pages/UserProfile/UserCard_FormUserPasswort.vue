<template>
  <b-card id="change_pwd" class="bg-transparent" style="background-color: #ebebeba3 !important">
    <b-container>
      <div v-if="!editPassword">
        <b-row class="mb-4 text-right">
          <b-col class="text-right">
            <a href="#change_pwd" @click="editPassword = !editPassword">
              <span>{{ $t('form.change-password') }}</span>
              <b-icon class="pointer ml-3" icon="pencil" />
            </a>
          </b-col>
        </b-row>
      </div>
      <div v-if="editPassword">
        <b-row class="mb-4 text-right">
          <b-col class="text-right">
            <b-icon @click="cancelEdit()" class="pointer" icon="x-circle" variant="danger"></b-icon>
          </b-col>
        </b-row>
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
            <input-password-confirmation v-model="form.newPassword" />
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
  </b-card>
</template>
<script>
import loginAPI from '../../../apis/loginAPI'
import InputPassword from '../../../components/Inputs/InputPassword'
import InputPasswordConfirmation from '../../../components/Inputs/InputPasswordConfirmation'

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
      const result = await loginAPI.changePasswordProfile(
        this.$store.state.sessionId,
        this.$store.state.email,
        this.form.password,
        this.form.newPassword.password,
      )
      if (result.success) {
        this.$toast.success(this.$t('site.thx.reset'))
        this.cancelEdit()
      } else {
        this.$toast.error(result.result.message)
      }
    },
  },
}
</script>
