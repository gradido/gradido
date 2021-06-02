<template>
  <b-card id="change_pwd" class="bg-transparent" style="background-color: #ebebeba3 !important">
    <b-container>
      <b-row class="mb-4 text-right">
        <b-col class="text-right">
          <a href="#change_pwd" v-if="edit_pwd" @click="edit_pwd = !edit_pwd">
            <span>{{ $t('form.password') }} {{ $t('form.change') }}</span>
          </a>
          <div v-else>
            <a href="#change_pwd" @click="onSubmit">
              <span class="mr-4 text-success display-4">{{ $t('form.save') }}</span>
            </a>
            <a href="#change_pwd" @click="edit_pwd = !edit_pwd">
              <span>
                <b>{{ $t('form.cancel') }}</b>
              </span>
            </a>
          </div>
        </b-col>
      </b-row>

      <div v-if="!edit_pwd">
        <b-row class="mb-3">
          <b-col class="col-lg-3 col-md-10 col-sm-10 text-md-left text-lg-right">
            <small>{{ $t('form.password_old') }}</small>
          </b-col>
          <b-col class="col-md-9 col-sm-10">
            <b-input
              type="text"
              :placeholder="$t('form.password_old')"
              v-model="password"
            ></b-input>
          </b-col>
        </b-row>
        <b-row class="mb-3">
          <b-col class="col-lg-3 col-md-10 col-sm-10 text-md-left text-lg-right">
            <small>{{ $t('form.password_new') }}</small>
          </b-col>
          <b-col class="col-md-9 col-sm-10">
            <b-input
              type="text"
              :placeholder="$t('form.password_new')"
              v-model="passwordNew"
            ></b-input>
          </b-col>
        </b-row>
        <b-row class="mb-3">
          <b-col class="col-lg-3 col-md-10 col-sm-10 text-md-left text-lg-right">
            <small>{{ $t('form.password_new_repeat') }}</small>
          </b-col>
          <b-col class="col-md-9 col-sm-10">
            <b-input
              type="text"
              :placeholder="$t('form.password_new_repeat')"
              v-model="passwordNew2"
            ></b-input>
          </b-col>
        </b-row>
      </div>
    </b-container>
  </b-card>
</template>
<script>
import loginAPI from '../../../apis/loginAPI'

export default {
  name: 'FormUserPasswort',
  data() {
    return {
      edit_pwd: true,
      email: null,
      password: '',
      passwordNew: '',
      passwordNew2: '',
    }
  },
  methods: {
    async onSubmit() {
      // console.log(this.data)
      const result = await loginAPI.changePasswordProfile(
        this.$store.state.sessionId,
        this.email,
        this.password,
        this.passwordNew,
      )
      if (result.success) {
        alert('changePassword success')
      } else {
        alert(result.result.message)
      }
    },
  },
}
</script>
<style></style>
