<template>
  <div id="username_form">
    <div v-if="$store.state.username">
      <label>{{ $t('form.username') }}</label>
      <b-form-group
        class="mb-3"
        data-test="username-input-group"
        :description="$t('settings.emailInfo')"
      >
        <b-form-input
          v-model="username"
          readonly
          data-test="username-input-readonly"
        ></b-form-input>
      </b-form-group>
    </div>
    <div v-else>
      <validation-observer ref="usernameObserver" v-slot="{ handleSubmit, invalid }">
        <b-form @submit.stop.prevent="handleSubmit(onSubmit)">
          <b-row class="mb-3">
            <b-col class="col-12">
              <input-username
                v-model="username"
                :name="$t('form.username')"
                :placeholder="$t('form.username-placeholder')"
                :showAllErrors="true"
                :unique="true"
                :rules="rules"
                :isEdit="isEdit"
                @set-is-edit="setIsEdit"
                data-test="component-input-username"
              />
            </b-col>
            <b-col class="col-12">
              <div v-if="!username" class="alert" data-test="username-alert">
                {{ $t('settings.username.no-username') }}
              </div>
            </b-col>
          </b-row>
          <b-row class="text-right" v-if="newUsername">
            <b-col>
              <div class="text-right" ref="submitButton">
                <b-button
                  :variant="disabled(invalid) ? 'light' : 'success'"
                  @click="onSubmit"
                  type="submit"
                  :disabled="disabled(invalid)"
                  data-test="submit-username-button"
                >
                  {{ $t('form.save') }}
                </b-button>
              </div>
            </b-col>
          </b-row>
        </b-form>
      </validation-observer>
    </div>
  </div>
</template>
<script>
import { updateUserInfos } from '@/graphql/mutations'
import InputUsername from '@/components/Inputs/InputUsername'

export default {
  name: 'UserName',
  components: {
    InputUsername,
  },
  data() {
    return {
      isEdit: false,
      username: this.$store.state.username || '',
      usernameUnique: false,
      rules: {
        required: true,
        min: 3,
        max: 20,
        usernameAllowedChars: true,
        usernameHyphens: true,
        usernameUnique: true,
      },
    }
  },
  methods: {
    async onSubmit(event) {
      event.preventDefault()
      this.$apollo
        .mutate({
          mutation: updateUserInfos,
          variables: {
            alias: this.username,
          },
        })
        .then(() => {
          this.$store.commit('username', this.username)
          this.toastSuccess(this.$t('settings.username.change-success'))
        })
        .catch((error) => {
          this.toastError(error.message)
        })
    },
    disabled(invalid) {
      return !this.newUsername || invalid
    },
    setIsEdit(bool) {
      this.username = this.$store.state.username
      this.isEdit = bool
    },
  },
  computed: {
    newUsername() {
      return this.username !== this.$store.state.username
    },
  },
}
</script>
<style>
.cursor-pointer {
  cursor: pointer;
}
div.alert {
  color: red;
}
</style>
