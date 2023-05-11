<template>
  <b-card id="username_form" class="card-border-radius card-background-gray">
    <div>
      <b-row class="mb-4 text-right">
        <b-col class="text-right">
          <a
            class="cursor-pointer"
            @click="showUserData ? (showUserData = !showUserData) : cancelEdit()"
          >
            <span class="pointer mr-3">{{ $t('settings.username.change-username') }}</span>
            <b-icon v-if="showUserData" class="pointer ml-3" icon="pencil"></b-icon>
            <b-icon v-else icon="x-circle" class="pointer ml-3" variant="danger"></b-icon>
          </a>
        </b-col>
      </b-row>
    </div>

    <div>
      <b-form @keyup.prevent="loadSubmitButton">
        <b-row class="mb-3">
          <b-col class="col-12">
            <small>
              <b>{{ $t('form.username') }}</b>
            </small>
          </b-col>
          <b-col v-if="showUserData" class="col-12">
            {{ username }}
          </b-col>
          <b-col v-else class="col-12">
            <b-input type="text" v-model="username"></b-input>
          </b-col>
        </b-row>
        <b-row class="text-right" v-if="!showUserData">
          <b-col>
            <div class="text-right" ref="submitButton">
              <b-button
                :variant="loading ? 'light' : 'success'"
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
      </b-form>
    </div>
  </b-card>
</template>
<script>
import { updateUserInfos } from '@/graphql/mutations'

export default {
  name: 'UserName',
  data() {
    return {
      showUserData: true,
      username: this.$store.state.username,
      loading: true,
    }
  },
  methods: {
    cancelEdit() {
      this.username = this.$store.state.username
      this.showUserData = true
    },
    loadSubmitButton() {
      if (this.username !== this.$store.state.username) {
        this.loading = false
      } else {
        this.loading = true
      }
    },
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
          this.showUserData = true
          this.toastSuccess(this.$t('settings.username.change-success'))
        })
        .catch((error) => {
          this.toastError(error.message)
        })
    },
  },
}
</script>
<style>
.cursor-pointer {
  cursor: pointer;
}
</style>
