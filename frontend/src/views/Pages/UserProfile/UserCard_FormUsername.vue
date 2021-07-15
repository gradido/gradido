<template>
  <b-card id="formusername" class="bg-transparent" style="background-color: #ebebeba3 !important">
    <b-container v-if="username === ''">
      <b-row class="text-right">
        <b-col class="mb-3">
          <b-icon
            v-if="showUsername"
            @click="showUsername = !showUsername"
            class="pointer"
            icon="pencil"
          >
            {{ $t('form.change') }}
          </b-icon>
          <b-icon
            v-else
            @click="cancelEdit"
            class="pointer"
            icon="x-circle"
            variant="danger"
          ></b-icon>
        </b-col>
      </b-row>
    </b-container>
    <b-container v-if="showUsername">
      <b-row class="mb-3">
        <b-col class="col-lg-3 col-md-10 col-sm-10 text-md-left text-lg-right">
          <small>{{ $t('form.username') }}</small>
        </b-col>
        <b-col class="col-md-9 col-sm-10 display-username">@{{ username }}</b-col>
      </b-row>
    </b-container>
    <b-container v-else>
      <validation-observer ref="formValidator" v-slot="{ handleSubmit, valid }">
        <b-form role="form" @submit.stop.prevent="handleSubmit(onSubmit)">
          <b-row class="mb-3">
            <b-col class="col-lg-3 col-md-10 col-sm-10 text-md-left text-lg-right">
              <small>{{ $t('form.username') }}</small>
            </b-col>
            <b-col class="col-md-9 col-sm-10">
              <validation-provider
                name="Username"
                :rules="{ gddUsernameRgex: true, gddUsernameUnique: true }"
                v-slot="{ errors }"
              >
                <div v-if="errors" class="text-right p-3 p-sm-1">
                  <span v-for="error in errors" :key="error" class="errors">{{ error }}</span>
                </div>
                <b-form-input v-model="form.username" placeholder="Username"></b-form-input>
                <div>
                  {{ $t('form.change_username_info') }}
                </div>
              </validation-provider>
            </b-col>
          </b-row>
          <b-row class="text-right">
            <b-col>
              <div class="text-right" ref="submitButton">
                <b-button variant="info" type="submit" class="mt-4" :disabled="!valid">
                  {{ $t('form.save') }}
                </b-button>
              </div>
            </b-col>
          </b-row>
        </b-form>
      </validation-observer>
    </b-container>
  </b-card>
</template>
<script>
import loginAPI from '../../../apis/loginAPI'

export default {
  name: 'FormUsername',
  data() {
    return {
      showUsername: true,
      username: this.$store.state.username,
      form: {
        username: this.$store.state.username,
      },
    }
  },
  methods: {
    cancelEdit() {
      this.username = this.$store.state.username
      this.showUsername = true
    },
    async onSubmit() {
      const result = await loginAPI.changeUsernameProfile(
        this.$store.state.sessionId,
        this.$store.state.email,
        this.form.username,
      )
      if (result.success) {
        this.$store.commit('username', this.form.username)
        this.username = this.form.username
        this.showUsername = true
        this.$toasted.success(this.$t('site.profil.user-data.change-success'))
      } else {
        this.$toasted.error(result.result.message)
        this.showUsername = true
        this.username = this.$store.state.username
        this.form.username = this.$store.state.username
      }
    },
  },
}
</script>
<style>
span.errors {
  color: red;
}
</style>
