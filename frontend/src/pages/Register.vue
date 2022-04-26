<template>
  <div id="registerform">
    <!-- Header -->
    <div class="header p-4">
      <b-container class="container">
        <div class="header-body text-center mb-7">
          <b-row class="justify-content-center">
            <b-col xl="5" lg="6" md="8" class="px-2">
              <h1>{{ $t('site.signup.title') }}</h1>
              <p class="text-lead">{{ $t('site.signup.subtitle') }}</p>
            </b-col>
          </b-row>
        </div>
      </b-container>
    </div>

    <!-- Page content -->
    <b-container v-if="!showPageMessage" class="mt--8 p-1">
      <!-- Table -->

      <b-row class="justify-content-center">
        <b-col lg="6" md="8">
          <b-card no-body class="border-0 gradido-custom-background">
            <b-card-body class="p-4">
              <div class="text-center text-muted mb-4 test-communitydata">
                <b>{{ CONFIG.COMMUNITY_NAME }}</b>
                <p class="text-lead">
                  {{ CONFIG.COMMUNITY_DESCRIPTION }}
                </p>
                <div>{{ $t('signup') }}</div>
              </div>

              <validation-observer ref="observer" v-slot="{ handleSubmit }">
                <b-form role="form" @submit.prevent="handleSubmit(onSubmit)">
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

                  <input-email v-model="form.email"></input-email>

                  <hr />

                  <b-row>
                    <b-col cols="12">
                      {{ $t('language') }}
                      <language-switch-select @update-language="updateLanguage" />
                    </b-col>
                  </b-row>

                  <b-row class="my-4">
                    <b-col cols="12">
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
                  <!-- Wolle: remove this? or shall the alert or a toaster be shown? -->
                  <b-alert
                    v-if="showError"
                    show
                    dismissible
                    variant="danger"
                    @dismissed="closeAlert"
                  >
                    <span class="alert-icon"><i class="ni ni-point"></i></span>
                    <span class="alert-text">
                      <strong>{{ $t('error.error') }}</strong>
                      {{ messageError }}
                    </span>
                  </b-alert>

                  <b-row v-b-toggle:my-collapse class="text-muted shadow-sm p-3 publisherCollaps">
                    <b-col>{{ $t('publisher.publisherId') }} {{ $store.state.publisherId }}</b-col>
                    <b-col class="text-right">
                      <b-icon icon="chevron-down" aria-hidden="true"></b-icon>
                    </b-col>
                  </b-row>

                  <b-row>
                    <b-col>
                      <b-collapse id="my-collapse" class="">
                        <b-input-group class="shadow-sm p-2 bg-white rounded">
                          <b-input-group-prepend is-text>
                            <b-icon icon="person-fill"></b-icon>
                          </b-input-group-prepend>
                          <b-form-input
                            id="publisherid"
                            type="text"
                            placeholder="Publisher ID"
                            v-model="publisherId"
                            @input="commitStorePublisherId(publisherId)"
                          ></b-form-input>
                        </b-input-group>
                        <div
                          v-b-toggle:my-collapse
                          class="text-center mt-1 shadow-lg p-3 mb-5 rounded"
                        >
                          {{ $t('publisher.infoText') }}
                          <div class="text-center">
                            <b-icon icon="chevron-up" aria-hidden="true"></b-icon>
                          </div>
                        </div>
                      </b-collapse>
                    </b-col>
                  </b-row>

                  <div class="text-center mt-5">
                    <div class="text-center">
                      <router-link class="test-button-back" to="/login">
                        <b-button variant="outline-secondary" class="mr-4">
                          {{ $t('back') }}
                        </b-button>
                      </router-link>
                      <b-button
                        :disabled="disabled"
                        type="submit"
                        :variant="disabled ? 'outline-light' : 'primary'"
                      >
                        {{ $t('signup') }}
                      </b-button>
                    </div>
                  </div>
                </b-form>
              </validation-observer>
            </b-card-body>
          </b-card>
        </b-col>
      </b-row>
    </b-container>
    <b-container v-else class="mt--8 p-1">
      <!-- eslint-disable @intlify/vue-i18n/no-dynamic-keys-->
      <message
        v-if="success"
        :headline="$t('site.thx.title')"
        :subtitle="$t('site.thx.register')"
      />
      <message
        v-else
        :headline="$t('site.thx.errorTitle')"
        :subtitle="messageError"
        :buttonText="$t('site.register.message-button-text')"
        :callback="solveError"
      />
      <!-- eslint-enable @intlify/vue-i18n/no-dynamic-keys-->
    </b-container>
    <!--
    <div class="text-center pt-4">
      <router-link class="test-button-another-community" to="/select-community">
        <b-button variant="outline-secondary">
          {{ $t('community.choose-another-community') }}
        </b-button>
      </router-link>
    </div>
    -->
  </div>
</template>
<script>
import { createUser } from '@/graphql/mutations'
import CONFIG from '@/config'
import InputEmail from '@/components/Inputs/InputEmail.vue'
import LanguageSwitchSelect from '@/components/LanguageSwitchSelect.vue'
import Message from '@/components/Message/Message'

export default {
  components: {
    InputEmail,
    LanguageSwitchSelect,
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
      language: '',
      showPageMessage: false,
      submitted: false,
      showError: false,
      messageError: '',
      register: true,
      publisherId: this.$store.state.publisherId,
      redeemCode: this.$route.params.code,
      CONFIG,
    }
  },
  methods: {
    updateLanguage(e) {
      this.language = e
      this.$store.commit('language', this.language)
    },
    getValidationState({ dirty, validated, valid = null }) {
      return dirty || validated ? valid : null
    },
    commitStorePublisherId(val) {
      this.$store.commit('publisherId', val)
    },
    async onSubmit() {
      this.$apollo
        .mutate({
          mutation: createUser,
          variables: {
            email: this.form.email,
            firstName: this.form.firstname,
            lastName: this.form.lastname,
            language: this.language,
            publisherId: this.$store.state.publisherId,
            redeemCode: this.redeemCode,
          },
        })
        .then(() => {
          // Wolle: this.$router.push('/thx/register')
          this.showPageMessage = true
          this.success = true
        })
        .catch((error) => {
          this.showPageMessage = true
          this.success = false
          this.showError = true
          switch (error.message) {
            case 'GraphQL error: User already exists.':
              this.messageError = this.$t('error.user-already-exists')
              break
            default:
              this.messageError = this.$t('error.unknown-error') + error.message
              break
          }
          // Wolle: this.toastError(this.$t('error.email-already-sent'))
          // Wolle: shall the alert be replaced by a toaster or shall only the page message be shown?
        })
    },
    // Wolle: remove this?
    closeAlert() {
      this.showError = false
      this.messageError = ''
      this.form.email = ''
      this.form.firstname = ''
      this.form.lastname = ''
    },
    solveError() {
      this.showPageMessage = false
      this.showError = false
      this.messageError = ''
      this.form.email = ''
      this.form.firstname = ''
      this.form.lastname = ''
      this.form.agree = false
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
      return !(this.namesFilled && this.emailFilled && this.form.agree && !!this.language)
    },
  },
}
</script>
