<template>
  <b-card id="formusername" class="bg-transparent" style="background-color: #ebebeba3 !important">
    <b-container>
      <b-row class="text-right">
        <b-col class="mb-3">
          <b-icon
            v-if="editUsername"
            @click="editUsername = !editUsername"
            class="pointer"
            icon="gear-fill"
          >
            {{ $t('form.change') }}
          </b-icon>

          <b-icon
            v-else
            @click="editUsername = !editUsername"
            class="pointer"
            icon="x-circle"
            variant="danger"
          ></b-icon>
        </b-col>
      </b-row>
    </b-container>
    <b-container v-if="editUsername">
      <b-row class="mb-3">
        <b-col class="col-lg-3 col-md-10 col-sm-10 text-md-left text-lg-right">
          <small>{{ $t('form.username') }}</small>
        </b-col>
        <b-col class="col-md-9 col-sm-10">@{{ username }}</b-col>
      </b-row>
    </b-container>
    <b-container v-else>
      <b-row class="mb-3">
        <b-col class="col-md-9 col-sm-10">
          <validation-observer ref="formValidator">
            <b-form role="form">
              <b-form-input v-model="form.username" :placeholder="username"></b-form-input>
              <div>
                {{ $t('form.change_username_info') }}
              </div>
            </b-form>
          </validation-observer>
        </b-col>
      </b-row>

      <b-row class="text-right">
        <b-col>
          <div class="text-right" ref="submitButton">
            <b-button variant="info" @click="onSubmit" class="mt-4">
              {{ $t('form.save') }}
            </b-button>
          </div>
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
      const result = await loginAPI.changeUsernameProfile(
        this.$store.state.sessionId,
        this.$store.state.email,
        this.form.username,
      )
      if (result.success) {
        this.$store.commit('username', this.form.username)
        this.editUserdata = this.editUsername = !this.editUsername
        alert('Dein Username wurde geändert.')
      } else {
        alert(result.result.message)
      }
    },
  },
}
</script>
<style></style>
