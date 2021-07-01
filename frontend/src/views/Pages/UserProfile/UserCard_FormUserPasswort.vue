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
            <b-row class="mb-2">
              <b-col>
                <input-password
                  :rules="{
                    required: true,
                    containsLowercaseCharacter: true,
                    containsUppercaseCharacter: true,
                    containsNumericCharacter: true,
                    atLeastEightCharactera: true,
                  }"
                  :label="$t('form.password_new')"
                  :showAllErrors="true"
                  :immediate="true"
                  :name="$t('form.password_new')"
                  :placeholder="$t('form.password_new')"
                  v-model="form.passwordNew"
                ></input-password>
              </b-col>
            </b-row>
            <b-row class="mb-2">
              <b-col>
                <input-password
                  :rules="{ samePassword: form.passwordNew }"
                  :label="$t('form.password_new_repeat')"
                  :placeholder="$t('form.password_new_repeat')"
                  v-model="form.passwordNewRepeat"
                ></input-password>
              </b-col>
            </b-row>
            <b-row class="text-right" v-if="editPassword">
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

export default {
  name: 'FormUserPasswort',
  components: {
    InputPassword,
  },
  data() {
    return {
      editPassword: false,
      email: null,
      form: {
        password: '',
        passwordNew: '',
        passwordNewRepeat: '',
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
        this.form.passwordNew,
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
