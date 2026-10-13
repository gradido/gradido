<template>
  <div id="registerform">
    <BContainer v-if="enterData">
      <auth-triads />
      <!-- Somebody showed Gradido to this newcomer: the name from their address came along
           (/u/<name>, "create account"). Their own input read back, as text. -->
      <p v-if="referrerAlias" class="alert gradido-border-radius" data-test="register-shown-by">
        {{ $t('site.signup.shownBy', { name: referrerAlias }) }}
      </p>
      <!-- An event link offered an entry in this browser within the last hour (`/event?…`,
           Event-Matching): said here once more, because it goes along with the registration
           and becomes the newcomer's first entry once they have confirmed their address. The
           words are the link's -- text, never markup, and never handed to a message as one. -->
      <p v-if="eventEntry" class="alert gradido-border-radius" data-test="register-event-entry">
        {{ $t('eventMatching.register.firstEntry') }}
        <span class="register-event-sentence">
          {{ $t('matching.type.interesse.prefix') }} {{ eventEntry.summary }}
        </span>
      </p>
      <!-- A guarantor code that had run out when the page opened: the form is the classic one. -->
      <p
        v-if="guarantorExpiredOnArrival"
        class="alert gradido-border-radius"
        data-test="register-guarantor-expired"
      >
        {{ $t('site.signup.guarantorExpired') }}
      </p>
      <BForm role="form" @submit.prevent="onSubmit">
        <!-- The fields are shared with the page a thank-you arrives on (AccountFields).
             E-017: with a valid guarantor code the guest chooses the password right here. -->
        <account-fields :with-password="guarantorActive" :guarantor-name="referrerAlias" />
        <!-- Next to the button, where the guest is looking when the answer comes. -->
        <p
          v-if="guarantorFailed"
          class="alert gradido-border-radius"
          role="alert"
          data-test="register-guarantor-failed"
        >
          {{ $t('site.signup.guarantorFailed') }}
        </p>
        <!-- E-019: the member already vouches for as many unconfirmed guests as there may be. -->
        <p
          v-if="guarantorLimited"
          class="alert gradido-border-radius"
          role="alert"
          data-test="register-guarantor-limit"
        >
          {{
            referrerAlias
              ? $t('site.signup.guarantorLimit', { name: referrerAlias })
              : $t('site.signup.guarantorLimitAnonymous')
          }}
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
        v-if="guarantorActive"
        :headline="$t('message.title')"
        :subtitle="$t('message.registerGuarantor')"
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
import AccountFields from '@/components/Auth/AccountFields'
import AuthTriads from '@/components/Auth/AuthTriads'
import Message from '@/components/Message/Message'
import { useAppToast } from '@/composables/useToast'
import { useForm } from 'vee-validate'
import { createUser } from '@/graphql/mutations'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
import { useRoute } from 'vue-router'
import { useAuthLinks } from '@/composables/useAuthLinks'
import CONFIG from '@/config'
import { keptEventMatchingEntry } from '@/utils/eventMatchingLink'
import { isValidUsername } from '@/validationSchemas'

const { toastError } = useAppToast()
const { routeWithParamsAndQuery } = useAuthLinks()

const { mutate } = useMutation(createUser)

// The fields register themselves with this form (AccountFields).
const { values: formValues, meta: formMeta } = useForm()

const { t } = useI18n()
const store = useStore()
const { params, query } = useRoute()

const showPageMessage = ref(false)
const publisherId = ref(store.state.publisherId)
// vue-router hands the absent optional parameter over as '' when the page is reached by its
// path (/register?referrer=…&guarantor=…, the way a QR code or a link arrives), and as nothing
// when it is reached by its name: both mean "no code", and neither goes out as one.
const redeemCode = ref(params.code || undefined)
// The user name from the Gradido address the registration started at: its owner becomes the
// referrer, and the strip above the form names them. Only a user name is taken - the page
// shows it, so anything else would put a stranger's text above the form, and the server
// refuses the registration over anything else, a reserved word included.
const referrerAlias = isValidUsername(String(query.referrer ?? '')) ? String(query.referrer) : null

// E-017, the guarantor code: the card the guest scanned carried `?guarantor=<expiry>.<block>`, and the
// public page handed it on. Only its expiry is read here, to decide whether the form offers a
// password; the server opens the block when the form is sent, and takes from it who showed the
// code. Decided once, when the page opens -- fields do not vanish while somebody is typing. The
// name in `referrer` only names that member: in the strip above the form, and in the hint and
// limit texts. Every link the wallet builds carries it; a code that comes without it still
// counts, and those two texts speak of "the member who showed you the code" instead.
const guarantor = String(query.guarantor ?? '')
const hasGuarantorCode = /^\d+\.[A-Za-z0-9_-]+$/.test(guarantor)
const guarantorActive = hasGuarantorCode && Number(guarantor.split('.')[0]) * 1000 > Date.now()
const guarantorExpiredOnArrival = hasGuarantorCode && !guarantorActive
const guarantorFailed = ref(false)
const guarantorLimited = ref(false)

// What an event link offered in this browser before anybody was signed in (`/event?…`,
// routes/guards.js): the entry "I love ‹summary›", kept in the store for an hour
// (keptEventMatchingEntry). The registration takes it along, and the server notes it at the
// account it opens -- it becomes an entry when the address is confirmed, also where the mail
// is opened on another device. Decided once, when the page opens, like the guarantor code:
// what stands above the form is what is sent.
const eventEntry = keptEventMatchingEntry(store.state.eventMatchingEntry)

const enterData = computed(() => {
  return !showPageMessage.value
})

async function onSubmit() {
  guarantorFailed.value = false
  guarantorLimited.value = false
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
      // Without a guarantor code, neither of the two: the classic registration sends what it sent.
      ...(guarantorActive ? { guarantorCode: guarantor, password: formValues.newPassword } : {}),
      // Without an event link, the field stays out of the request.
      ...(eventEntry ? { eventMatchingEntry: eventEntry } : {}),
    })
    // The store keeps the entry after the registration as well, for its hour. The answer is
    // the same whether an account was opened or the address was taken, and a member who
    // registered again by mistake then signs in and still finds the form. Where the server
    // has made the entry by the time of that sign-in, the member's entries say "you have this
    // one already" instead (Matching.vue), and the server makes no second one where the member
    // saves it before the confirmation (makeEventMatchingEntry).
    showPageMessage.value = true
  } catch (error) {
    // The code ran out while the form was being filled in. What was typed stays; a new scan
    // brings a new code, and the browser fills the fields in again.
    if (guarantorActive && error.message.includes('Guarantor code invalid or expired')) {
      guarantorFailed.value = true
    } else if (guarantorActive && error.message.includes('Vouching limit reached')) {
      // The member vouches for as many unconfirmed guests as there may be (E-019): once one of
      // them confirms, the same form goes through. What was typed stays.
      guarantorLimited.value = true
    } else {
      toastError(`${t('error.unknown-error')} ${error.message}`)
    }
  }
}
</script>

<style scoped>
/* The link's words: a title without a single blank breaks rather than widen the strip. */
.register-event-sentence {
  font-weight: 700;
  overflow-wrap: anywhere;
}

:deep(.btn-gradido) {
  padding-right: 0;
  padding-left: 0;
}

:deep(.btn-gradido-disable) {
  padding-right: 0;
  padding-left: 0;
}
</style>
