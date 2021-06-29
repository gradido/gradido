<template>
  <b-card id="change_pwd" class="bg-transparent" style="background-color: #ebebeba3 !important">
    <b-container>
      <b-form @keyup.prevent="loadSubmitButton">
        <b-row class="mb-4 text-right">
          <b-col class="text-right">
            <a href="#change_pwd" v-if="!editPassword" @click="editPassword = !editPassword">
              <span>{{ $t('form.change-password') }}</span>
              <b-icon class="pointer ml-3" icon="pencil" />
            </a>

            <b-icon
              v-else
              @click="cancelEdit()"
              class="pointer"
              icon="x-circle"
              variant="danger"
            ></b-icon>
          </b-col>
        </b-row>

        <div v-if="editPassword">
          <b-row class="mb-5">
            <b-col class="col-12 col-lg-3 col-md-10 col-sm-10 text-md-left text-lg-right">
              <small>{{ $t('form.password_old') }}</small>
            </b-col>
            <b-col class="col-md-9 col-sm-10">
              <b-input-group>
                <b-form-input
                  class="mb-0"
                  v-model="password"
                  name="Password"
                  :type="passwordVisibleOldPwd ? 'text' : 'password'"
                  prepend-icon="ni ni-lock-circle-open"
                  :placeholder="$t('form.password_old')"
                ></b-form-input>

                <b-input-group-append>
                  <b-button variant="outline-primary" @click="togglePasswordVisibilityOldPwd">
                    <b-icon :icon="passwordVisibleOldPwd ? 'eye' : 'eye-slash'" />
                  </b-button>
                </b-input-group-append>
              </b-input-group>
            </b-col>
          </b-row>

          <b-row class="mb-3">
            <b-col class="col-12 col-lg-3 col-md-10 col-sm-10 text-md-left text-lg-right">
              <small>{{ $t('form.password_new') }}</small>
            </b-col>
            <b-col class="col-md-9 col-sm-10">
              <b-input-group>
                <b-form-input
                  class="mb-0"
                  v-model="passwordNew"
                  name="Password"
                  :type="passwordVisibleNewPwd ? 'text' : 'password'"
                  prepend-icon="ni ni-lock-circle-open"
                  :placeholder="$t('form.password_new')"
                ></b-form-input>

                <b-input-group-append>
                  <b-button variant="outline-primary" @click="togglePasswordVisibilityNewPwd">
                    <b-icon :icon="passwordVisibleNewPwd ? 'eye' : 'eye-slash'" />
                  </b-button>
                </b-input-group-append>
              </b-input-group>
            </b-col>
          </b-row>
          <b-row class="mb-3">
            <b-col class="col-12 col-lg-3 col-md-10 col-sm-10 text-md-left text-lg-right">
              <small>{{ $t('form.password_new_repeat') }}</small>
            </b-col>
            <b-col class="col-md-9 col-sm-10">
              <b-input-group>
                <b-form-input
                  class="mb-0"
                  v-model="passwordNewRepeat"
                  name="Password"
                  :type="passwordVisibleNewPwdRepeat ? 'text' : 'password'"
                  prepend-icon="ni ni-lock-circle-open"
                  :placeholder="$t('form.password_new_repeat')"
                ></b-form-input>

                <b-input-group-append>
                  <b-button variant="outline-primary" @click="togglePasswordVisibilityNewPwdRepeat">
                    <b-icon :icon="passwordVisibleNewPwdRepeat ? 'eye' : 'eye-slash'" />
                  </b-button>
                </b-input-group-append>
              </b-input-group>
            </b-col>
          </b-row>
          <b-row>
            <b-col></b-col>
            <b-col class="col-12">
              <transition name="hint" appear>
                <div v-if="passwordValidation.errors.length > 0" class="hints">
                  <ul>
                    <li v-for="error in passwordValidation.errors" :key="error">
                      <small>{{ error }}</small>
                    </li>
                  </ul>
                </div>
              </transition>
            </b-col>
          </b-row>

          <b-row class="text-right" v-if="editPassword">
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
        </div>
      </b-form>
    </b-container>
  </b-card>
</template>
<script>
import loginAPI from '../../../apis/loginAPI'

export default {
  name: 'FormUserPasswort',
  data() {
    return {
      editPassword: false,
      email: null,
      password: '',
      passwordNew: '',
      passwordNewRepeat: '',
      passwordVisibleOldPwd: false,
      passwordVisibleNewPwd: false,
      passwordVisibleNewPwdRepeat: false,
      loading: true,
    }
  },
  methods: {
    cancelEdit() {
      this.editPassword = false
      this.password = ''
      this.passwordNew = ''
      this.passwordNewRepeat = ''
    },
    togglePasswordVisibilityNewPwd() {
      this.passwordVisibleNewPwd = !this.passwordVisibleNewPwd
    },
    togglePasswordVisibilityNewPwdRepeat() {
      this.passwordVisibleNewPwdRepeat = !this.passwordVisibleNewPwdRepeat
    },
    togglePasswordVisibilityOldPwd() {
      this.passwordVisibleOldPwd = !this.passwordVisibleOldPwd
    },
    loadSubmitButton() {
      if (
        this.password !== '' &&
        this.passwordNew !== '' &&
        this.passwordNewRepeat !== '' &&
        this.passwordNew === this.passwordNewRepeat
      ) {
        this.loading = false
      } else {
        this.loading = true
      }
    },
    async onSubmit(event) {
      event.preventDefault()
      const result = await loginAPI.changePasswordProfile(
        this.$store.state.sessionId,
        this.$store.state.email,
        this.password,
        this.passwordNew,
      )
      if (result.success) {
        this.$toast.success(this.$t('site.thx.reset'))
        this.cancelEdit()
      } else {
        this.$toast.error(result.result.message)
      }
    },
  },
  computed: {
    samePasswords() {
      return this.password === this.passwordNew
    },
    rules() {
      return [
        { message: this.$t('site.signup.lowercase'), regex: /[a-z]+/ },
        { message: this.$t('site.signup.uppercase'), regex: /[A-Z]+/ },
        { message: this.$t('site.signup.minimum'), regex: /.{8,}/ },
        { message: this.$t('site.signup.one_number'), regex: /[0-9]+/ },
      ]
    },
    passwordValidation() {
      const errors = []
      for (const condition of this.rules) {
        if (!condition.regex.test(this.passwordNew)) {
          errors.push(condition.message)
        }
      }
      if (errors.length === 0) {
        return { valid: true, errors }
      }
      return { valid: false, errors }
    },
  },
}
</script>
<style></style>
