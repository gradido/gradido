<template>
  <b-card id="formusername" class="bg-transparent" style="background-color: #ebebeba3 !important">
    <b-container>
      <b-row class="mb-4 text-right">
        <b-col class="text-right">
          <a href="#formusername" v-if="editUsername" @click="editUsername = !editUsername">
            <span>{{ $t('form.username') }} {{ $t('form.change') }}</span>
          </a>
          <div v-else>
            <a href="#formusername" @click="editUsername = !editUsername">
              <span>
                <b>{{ $t('form.cancel') }}</b>
              </span>
            </a>
          </div>
        </b-col>
      </b-row>

      <b-row class="mb-3">
        <b-col class="col-lg-3 col-md-10 col-sm-10 text-md-left text-lg-right">
          <small>{{ $t('form.username') }}</small>
        </b-col>
        <b-col v-if="editUsername" class="col-md-9 col-sm-10">@{{ username }}</b-col>
        <b-col v-else class="col-md-9 col-sm-10">
          <validation-observer ref="formValidator">
            <b-form role="form">
              <b-form-input v-model="form.username" :placeholder="username"></b-form-input>
              <div>
                {{ $t('form.change_username_info') }}
              </div>
              <div class="text-center" ref="submitButton">
                <b-button type="button" @click="onSubmit" class="mt-4">
                  {{ $t('form.save') }}
                </b-button>
              </div>
            </b-form>
          </validation-observer>
        </b-col>
      </b-row>
    </b-container>
  </b-card>
</template>
<script>
import loginAPI from '../../../apis/loginAPI'

export default {
  name: 'FormUsername',
  data() {
    return {
      editUsername: true,
      username: this.$store.state.username,
      form: {
        username: this.$store.state.username,
      },
    }
  },
  props: {
    UserProfileTestData: { type: Object },
  },
  methods: {
    async onSubmit() {
      console.log('onSubmit', this.form.username)
      const result = await loginAPI.changeUsernameProfile(
        this.$store.state.sessionId,
        this.$store.state.email,      
        this.form.username,
      )
      if (result.success) {
        this.$store.commit('username', this.form.username)
        this.editUserdata = true
      } else {
        alert(result.result.message)
      }
    },
  },
}
</script>
<style></style>
