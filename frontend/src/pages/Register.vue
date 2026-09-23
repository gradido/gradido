<template>
  <div id="registerform">
    <BContainer v-if="enterData">
      <auth-triads />
      <!-- Somebody showed Gradido to this newcomer: the name from their address came along
           (/u/<name>, "create account"). Their own input read back, as text. -->
      <p v-if="referrerAlias" class="alert gradido-border-radius" data-test="register-shown-by">
        {{ $t('site.signup.shownBy', { name: referrerAlias }) }}
      </p>
      <!-- A table code that had run out when the page opened: the form is the classic one. -->
      <p
        v-if="presenceExpiredOnArrival"
        class="alert gradido-border-radius"
        data-test="register-presence-expired"
      >
        {{ $t('site.signup.presenceExpired') }}
      </p>
      <BForm role="form" @submit.prevent="onSubmit">
        <BRow>
          <BCol sm="12" md="6">
            <BFormGroup class="mb-3" :label="$t('form.firstname')" label-for="registerFirstname">
              <BFormInput
                id="registerFirstname"
                :model-value="firstname"
                name="firstname"
                :placeholder="$t('form.firstname')"
                :state="firstnameMeta.valid"
                aria-describedby="registerFirstnameLiveFeedback"
                @update:model-value="firstname = $event"
              />

              <BFormInvalidFeedback v-if="firstnameError" id="registerFirstnameLiveFeedback">
                {{ firstnameError }}
              </BFormInvalidFeedback>
            </BFormGroup>
          </BCol>
          <BCol sm="12" md="6">
            <BFormGroup class="mb-3" :label="$t('form.lastname')" label-for="registerLastname">
              <BFormInput
                id="registerLastname"
                :model-value="lastname"
                name="lastname"
                :placeholder="$t('form.lastname')"
                :state="lastnameMeta.valid"
                aria-describedby="registerLastnameLiveFeedback"
                @update:model-value="lastname = $event"
              />

              <BFormInvalidFeedback v-if="lastnameError" id="registerLastnameLiveFeedback">
                {{ lastnameError }}
              </BFormInvalidFeedback>
            </BFormGroup>
          </BCol>
        </BRow>
        <BRow>
          <BCol>
            <input-email name="email" :label="$t('form.email')" :placeholder="$t('form.email')" />
          </BCol>
        </BRow>
        <!-- E-017: with a valid table code the guest chooses the password right here. -->
        <template v-if="presenceActive">
          <input-password-confirmation register />
          <p class="text-muted" data-test="register-presence-hint">
            {{ $t('site.signup.presenceHint', { name: referrerAlias }) }}
          </p>
        </template>
        <BRow>
          <BCol cols="12" class="my-4">
            <BFormCheckbox
              id="registerCheckbox"
              name="agree"
              :model-value="agree"
              :state="(agreeMeta.valid && agreeMeta.dirty) || undefined"
              @update:model-value="agree = $event"
            >
              <!-- eslint-disable-next-line @intlify/vue-i18n/no-v-html -->
              <span class="text-muted" v-html="$t('site.signup.agree')"></span>
            </BFormCheckbox>
          </BCol>
        </BRow>
        <!-- Next to the button, where the guest is looking when the answer comes. -->
        <p
          v-if="presenceFailed"
          class="alert gradido-border-radius"
          role="alert"
          data-test="register-presence-failed"
        >
          {{ $t('site.signup.presenceFailed') }}
        </p>
        <!-- E-019: the member already vouches for as many unconfirmed guests as there may be. -->
        <p
          v-if="presenceLimited"
          class="alert gradido-border-radius"
          role="alert"
          data-test="register-presence-limit"
        >
          {{ $t('site.signup.presenceLimit', { name: referrerAlias }) }}
        </p>
        <BRow>
          <BCol cols="12" lg="6">
            <BButton
              block
              type="submit"
              :disabled="!formMeta.valid"
              :variant="!formMeta.valid ? 'gradido-disable' : 'gradido'"
            >
              {{ $t('signup') }}
            </BButton>
          </BCol>
        </BRow>
        <BRow>
          <BCol class="mt-3">
            {{ $t('existingGradidoAccount', { communityName: CONFIG.COMMUNITY_NAME }) }}
          </BCol>
        </BRow>
        <BRow>
          <BCol class="mt-1 auth-navbar">
            <BLink :to="routeWithParamsAndQuery('Login')">
              {{ $t('signin') }}
            </BLink>
          </BCol>
        </BRow>
      </BForm>
    </BContainer>
    <BContainer v-else>
      <message
        v-if="presenceActive"
        :headline="$t('message.title')"
        :subtitle="$t('message.registerPresence')"
        :button-text="$t('login')"
        :link-to="{ name: 'Login' }"
      />
      <message v-else :headline="$t('message.title')" :subtitle="$t('message.register')" />
    </BContainer>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useMutation } from '@vue/apollo-composable'
import AuthTriads from '@/components/Auth/AuthTriads'
import InputEmail from '@/components/Inputs/InputEmail'
import InputPasswordConfirmation from '@/components/Inputs/InputPasswordConfirmation'
import Message from '@/components/Message/Message'
import { useAppToast } from '@/composables/useToast'
import { useField, useForm } from 'vee-validate'
import { createUser } from '@/graphql/mutations'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
import { useRoute } from 'vue-router'
import { useAuthLinks } from '@/composables/useAuthLinks'
import CONFIG from '@/config'
import { USERNAME_REGEX } from '@/validationSchemas'

const { toastError } = useAppToast()
const { routeWithParamsAndQuery } = useAuthLinks()

const { mutate } = useMutation(createUser)

const { values: formValues, meta: formMeta, defineField, handleSubmit } = useForm()

const [firstname] = defineField('firstname')
const { meta: firstnameMeta, errorMessage: firstnameError } = useField('firstname', {
  required: true,
  min: 3,
})

const [lastname] = defineField('lastname')
const { meta: lastnameMeta, errorMessage: lastnameError } = useField('lastname', {
  required: true,
  min: 2,
})

const [agree] = defineField('agree')
const { meta: agreeMeta } = useField('agree', 'required')

const { t } = useI18n()
const store = useStore()
const { params, query } = useRoute()

const showPageMessage = ref(false)
const publisherId = ref(store.state.publisherId)
const redeemCode = ref(params.code)
// The user name from the Gradido address the registration started at: its owner becomes the
// referrer, and the strip above the form names them. Only a user name is taken - the page
// shows it, so anything else would put a stranger's text above the form, and the server
// ignores anything else anyway.
const referrerAlias = USERNAME_REGEX.test(String(query.referrer ?? ''))
  ? String(query.referrer)
  : null

// E-017, the table code: the card the guest scanned carried `?presence=<expiry>.<seal>`, and the
// public page handed it on. Only its expiry is read here, to decide whether the form offers a
// password; the server checks the seal when the form is sent. Decided once, when the page
// opens -- fields do not vanish while somebody is typing. It is the code of the member the
// guest came from, so without that name there is no code to speak of.
const presence = String(query.presence ?? '')
const hasPresence = !!referrerAlias && /^\d+\.[A-Za-z0-9_-]+$/.test(presence)
const presenceActive = hasPresence && Number(presence.split('.')[0]) * 1000 > Date.now()
const presenceExpiredOnArrival = hasPresence && !presenceActive
const presenceFailed = ref(false)
const presenceLimited = ref(false)

const enterData = computed(() => {
  return !showPageMessage.value
})

async function onSubmit() {
  presenceFailed.value = false
  presenceLimited.value = false
  try {
    await mutate({
      email: formValues.email,
      firstName: formValues.firstname,
      lastName: formValues.lastname,
      language: store.state.language,
      publisherId: publisherId.value,
      redeemCode: redeemCode.value,
      project: store.state.project,
      // Without an address to come from, the field stays out of the request.
      ...(referrerAlias ? { referrerAlias } : {}),
      // Without a table code, neither of the two: the classic registration sends what it sent.
      ...(presenceActive ? { presenceCode: presence, password: formValues.newPassword } : {}),
    })
    showPageMessage.value = true
  } catch (error) {
    // The code ran out while the form was being filled in. What was typed stays; a new scan
    // brings a new code, and the browser fills the fields in again.
    if (presenceActive && error.message.includes('Presence code invalid or expired')) {
      presenceFailed.value = true
    } else if (presenceActive && error.message.includes('Vouching limit reached')) {
      // The member vouches for as many unconfirmed guests as there may be (E-019): once one of
      // them confirms, the same form goes through. What was typed stays.
      presenceLimited.value = true
    } else {
      toastError(`${t('error.unknown-error')} ${error.message}`)
    }
  }
}
</script>

<style scoped>
:deep(.btn-gradido) {
  padding-right: 0;
  padding-left: 0;
}

:deep(.btn-gradido-disable) {
  padding-right: 0;
  padding-left: 0;
}
</style>
