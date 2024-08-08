<template>
  <b-card id="userdata_form" class="card-border-radius card-background-gray">
    <div>
      <BRow class="mb-4 text-right">
        <BCol class="text-right">
          <a
            class="cursor-pointer"
            @click="showUserData ? (showUserData = !showUserData) : cancelEdit()"
          >
            <span class="pointer mr-3">{{ $t('settings.name.change-name') }}</span>
            <b-icon v-if="showUserData" class="pointer ml-3" icon="pencil"></b-icon>
            <b-icon v-else icon="x-circle" class="pointer ml-3" variant="danger"></b-icon>
          </a>
        </BCol>
      </BRow>
    </div>

    <div>
      <b-form @keyup.prevent="loadSubmitButton">
        <BRow class="mb-3">
          <BCol class="col-12">
            <small>
              <b>{{ $t('form.firstname') }}</b>
            </small>
          </BCol>
          <BCol v-if="showUserData" class="col-12">
            {{ form.firstName }}
          </BCol>
          <BCol v-else class="col-12">
            <b-input v-model="form.firstName" type="text"></b-input>
          </BCol>
        </BRow>
        <BRow class="mb-3">
          <BCol class="col-12">
            <small>
              <b>{{ $t('form.lastname') }}</b>
            </small>
          </BCol>
          <BCol v-if="showUserData" class="col-12">
            {{ form.lastName }}
          </BCol>
          <BCol v-else class="col-12">
            <b-input v-model="form.lastName" type="text"></b-input>
          </BCol>
        </BRow>

        <BRow v-if="!showUserData" class="text-right">
          <BCol>
            <div ref="submitButton" class="text-right">
              <b-button
                :variant="loading ? 'light' : 'success'"
                type="submit"
                class="mt-4"
                :disabled="loading"
                @click="onSubmit"
              >
                {{ $t('form.save') }}
              </b-button>
            </div>
          </BCol>
        </BRow>
      </b-form>
    </div>
  </b-card>
</template>
<script>
import { updateUserInfos } from '@/graphql/mutations'

export default {
  name: 'UserData',
  data() {
    return {
      showUserData: true,
      form: {
        firstName: this.$store.state.firstName,
        lastName: this.$store.state.lastName,
      },
      loading: true,
    }
  },
  methods: {
    cancelEdit() {
      this.form.firstName = this.$store.state.firstName
      this.form.lastName = this.$store.state.lastName
      this.showUserData = true
    },
    loadSubmitButton() {
      if (
        this.form.firstName !== this.$store.state.firstName ||
        this.form.lastName !== this.$store.state.lastName
      ) {
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
            firstName: this.form.firstName,
            lastName: this.form.lastName,
          },
        })
        .then(() => {
          this.$store.commit('firstName', this.form.firstName)
          this.$store.commit('lastName', this.form.lastName)
          this.showUserData = true
          this.toastSuccess(this.$t('settings.name.change-success'))
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
