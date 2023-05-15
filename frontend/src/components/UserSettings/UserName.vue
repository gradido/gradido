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
      <validation-observer ref="usernameObserver" v-slot="{ handleSubmit, invalid }">
        <b-form @submit.stop.prevent="handleSubmit(onSubmit)">
          <b-row class="mb-3">
            <b-col class="col-12">
              <small>
                <b>{{ $t('form.username') }}</b>
              </small>
            </b-col>
            <b-col v-if="showUserData" class="col-12">
              <span v-if="username">
                {{ username }}
              </span>
              <div v-else class="alert">
                {{ $t('settings.username.no-username') }}
              </div>
            </b-col>
            <b-col v-else class="col-12">
              <input-username
                v-model="username"
                :name="$t('form.username')"
                :placeholder="$t('form.username-placeholder')"
                :showAllErrors="true"
                :unique="true"
                :rules="rules"
              />
            </b-col>
          </b-row>
          <b-row class="text-right" v-if="!showUserData">
            <b-col>
              <div class="text-right" ref="submitButton">
                <b-button
                  :variant="disabled(invalid) ? 'light' : 'success'"
                  @click="onSubmit"
                  type="submit"
                  :disabled="disabled(invalid)"
                >
                  {{ $t('form.save') }}
                </b-button>
              </div>
            </b-col>
          </b-row>
        </b-form>
      </validation-observer>
    </div>
  </b-card>
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
      showUserData: true,
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
    cancelEdit() {
      this.username = this.$store.state.username || ''
      this.showUserData = true
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
    disabled(invalid) {
      return !this.newUsername || invalid
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
