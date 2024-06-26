<template>
  <div id="registerform">
    <b-container v-if="enterData">
      <div class="pb-5" align="center">{{ $t('gdd_per_link.isFree') }}</div>
      <validation-observer ref="observer" v-slot="{ handleSubmit }">
        <b-form role="form" @submit.prevent="handleSubmit(onSubmit)">
          <b-row>
            <b-col sm="12" md="6">
              <validation-provider
                :name="$t('form.firstname')"
                :rules="{ required: true, min: 3 }"
                v-slot="validationContext"
              >
                <b-form-group
                  class="mb-3"
                  :label="$t('form.firstname')"
                  label-for="registerFirstname"
                >
                  <b-form-input
                    id="registerFirstname"
                    :name="$t('form.firstname')"
                    v-model="form.firstname"
                    :placeholder="$t('form.firstname')"
                    :state="getValidationState(validationContext)"
                    aria-describedby="registerFirstnameLiveFeedback"
                  ></b-form-input>

                  <b-form-invalid-feedback id="registerFirstnameLiveFeedback">
                    {{ validationContext.errors[0] }}
                  </b-form-invalid-feedback>
                </b-form-group>
              </validation-provider>
            </b-col>
            <b-col sm="12" md="6">
              <validation-provider
                :name="$t('form.lastname')"
                :rules="{ required: true, min: 2 }"
                v-slot="validationContext"
              >
                <b-form-group
                  class="mb-3"
                  :label="$t('form.lastname')"
                  label-for="registerLastname"
                >
                  <b-form-input
                    id="registerLastname"
                    :name="$t('form.lastname')"
                    v-model="form.lastname"
                    :placeholder="$t('form.lastname')"
                    :state="getValidationState(validationContext)"
                    aria-describedby="registerLastnameLiveFeedback"
                  ></b-form-input>

                  <b-form-invalid-feedback id="registerLastnameLiveFeedback">
                    {{ validationContext.errors[0] }}
                  </b-form-invalid-feedback>
                </b-form-group>
              </validation-provider>
            </b-col>
          </b-row>
          <b-row>
            <b-col>
              <input-email
                v-model="form.email"
                :name="$t('form.email')"
                :label="$t('form.email')"
                :placeholder="$t('form.email')"
              ></input-email>
            </b-col>
          </b-row>
          <b-row>
            <b-col cols="12" class="my-4">
              <b-form-checkbox
                id="registerCheckbox"
                v-model="form.agree"
                :name="$t('site.signup.agree')"
              >
                <!-- eslint-disable-next-line @intlify/vue-i18n/no-v-html -->
                <span class="text-muted" v-html="$t('site.signup.agree')"></span>
              </b-form-checkbox>
            </b-col>
          </b-row>
          <b-row>
            <b-col cols="12" lg="6">
              <b-button
                block
                type="submit"
                :disabled="disabled"
                :variant="disabled ? 'gradido-disable' : 'gradido'"
              >
                {{ $t('signup') }}
              </b-button>
            </b-col>
          </b-row>
        </b-form>
      </validation-observer>
    </b-container>
    <b-container v-else>
      <message :headline="$t('message.title')" :subtitle="$t('message.register')" />
    </b-container>
  </div>
</template>

<script>
import { createUser } from '@/graphql/mutations'
import CONFIG from '@/config'
import InputEmail from '@/components/Inputs/InputEmail'
import Message from '@/components/Message/Message'

export default {
  components: {
    InputEmail,
    Message,
  },
  name: 'Register',
  data() {
    return {
      form: {
        firstname: '',
        lastname: '',
        email: '',
        agree: false,
      },
      showPageMessage: false,
      submitted: false,
      publisherId: this.$store.state.publisherId,
      redeemCode: this.$route.params.code,
      CONFIG,
    }
  },
  methods: {
    getValidationState({ dirty, validated, valid = null }) {
      return dirty || validated ? valid : null
    },
    async onSubmit() {
      this.$apollo
        .mutate({
          mutation: createUser,
          variables: {
            email: this.form.email,
            firstName: this.form.firstname,
            lastName: this.form.lastname,
            language: this.$store.state.language,
            publisherId: this.$store.state.publisherId,
            redeemCode: this.redeemCode,
          },
        })
        .then(() => {
          this.showPageMessage = true
        })
        .catch((error) => {
          this.toastError(this.$t('error.unknown-error') + error.message)
        })
    },
  },
  computed: {
    namesFilled() {
      return (
        this.form.firstname !== '' &&
        this.form.firstname.length > 2 &&
        this.form.lastname !== '' &&
        this.form.lastname.length > 1
      )
    },
    emailFilled() {
      return this.form.email !== ''
    },
    disabled() {
      return !(this.namesFilled && this.emailFilled && this.form.agree)
    },
    enterData() {
      return !this.showPageMessage
    },
  },
}
</script>
<style scoped>
.btn-gradido {
  padding-right: 0px;
  padding-left: 0px;
}
.btn-gradido-disable {
  padding-right: 0px;
  padding-left: 0px;
}
</style>
