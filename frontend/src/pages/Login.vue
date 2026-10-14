<template>
  <div class="login-form">
    <BContainer v-if="enterData">
      <auth-triads />
      <form @submit.prevent="onSubmit">
        <BRow>
          <BCol sm="12" md="12" lg="6">
            <input-email />
          </BCol>
          <BCol sm="12" md="12" lg="6">
            <input-password />
          </BCol>
        </BRow>
        <BRow>
          <BCol class="d-flex justify-content-end mb-4 mb-lg-0">
            <router-link :to="{ name: 'ForgotPassword' }" data-test="forgot-password-link">
              {{ $t('settings.password.forgot_pwd') }}
            </router-link>
          </BCol>
        </BRow>
        <BRow>
          <BCol class="col-lg-6 col-12">
            <BButton
              ref="submitBtn"
              type="submit"
              class="w-100 fs-7"
              :variant="meta.valid ? 'gradido' : 'gradido-disable'"
              block
              :disabled="!meta.valid"
            >
              {{ $t('login') }}
            </BButton>
          </BCol>
        </BRow>
        <BRow>
          <BCol class="mt-3">
            {{ $t('missingGradidoAccount', { communityName: CONFIG.COMMUNITY_NAME }) }}
          </BCol>
        </BRow>
        <BRow>
          <BCol class="mt-1 auth-navbar">
            <BLink :to="routeWithParamsAndQuery('Register')">
              {{ $t('signup') }}
            </BLink>
          </BCol>
        </BRow>
      </form>
    </BContainer>
    <BContainer v-else>
      <message
        :headline="$t('message.errorTitle')"
        :subtitle="errorSubtitle"
        :button-text="$t('settings.password.reset')"
        :link-to="errorLinkTo"
      />
    </BContainer>
  </div>
</template>

<script setup>
import AuthTriads from '@/components/Auth/AuthTriads'
import InputPassword from '@/components/Inputs/InputPassword'
import InputEmail from '@/components/Inputs/InputEmail'
import Message from '@/components/Message/Message'
import { authenticateHumhubAutoLoginProject } from '@/graphql/mutations'
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { useForm } from 'vee-validate'
import { useMutation } from '@vue/apollo-composable'
import { useAppToast } from '@/composables/useToast'
import { useAuthLinks } from '@/composables/useAuthLinks'
import { useEntryDraft } from '@/composables/useEntryDraft'
import { useSignIn } from '@/composables/useSignIn'
import CONFIG from '@/config'
import { eventMatchingEntryDraft, keptEventMatchingEntry } from '@/utils/eventMatchingLink'

// import { useLoading } from 'vue-loading-overlay'

const router = useRouter()
const route = useRoute()
const store = useStore()
const { t } = useI18n()
// The steps of signing in are shared with the page where a thank-you is accepted.
const { signIn } = useSignIn()
const entryDraft = useEntryDraft()
const { mutate: mutateHumhubAutoLogin } = useMutation(authenticateHumhubAutoLoginProject)
// const $loading = useLoading() // TODO needs to be updated but there is some sort of an issue that breaks the app.
const { toastError } = useAppToast()
const { routeWithParamsAndQuery } = useAuthLinks()

const form = ref({
  email: '',
  password: '',
})

const { handleSubmit, meta } = useForm({
  initialValues: form.value,
})

const showPageMessage = ref(false)
const errorSubtitle = ref('')
const errorLinkTo = ref('')
const submitBtn = ref(null)

const onSubmit = handleSubmit(async (values) => {
  // const loader = $loading.show({
  //   container: submitBtn,
  // })
  // this.$root.$bvToast.hide()
  try {
    await signIn({ email: values.email, password: values.password })
    // The way back is taken ONCE. The guard writes it for somebody who arrives signed out
    // (routes/guards.js), and it used to stay after it had served: only a sign-out put it
    // back. A wallet that later starts on this page with its session run out signs nobody
    // out, so the next sign-in led to that same address again -- into the conversation a
    // mail had linked to weeks before, instead of the overview (measured in the built
    // wallet, 11.10.2026). Taken here, after the sign-in has succeeded: a failed attempt
    // keeps it for the next one.
    const back = store.state.redirectPath
    store.commit('redirectPath', '/overview')
    // What an event link offered in this browser before anybody was signed in (`/event?…`,
    // routes/guards.js) is taken ONCE as well, by the sign-in that follows the link: used
    // below, or let go. Nobody was signed in when it was kept, so nothing says whose it is --
    // left in the store, it would open the form for whoever signs in here next. And only if
    // it was kept within the hour (keptEventMatchingEntry).
    const offered = keptEventMatchingEntry(store.state.eventMatchingEntry)
    store.commit('eventMatchingEntry', null)
    // await loader.hide()
    if (store.state.project) {
      const result = await mutateHumhubAutoLogin({
        project: store.state.project,
      })
      window.location.href = result.data.authenticateHumhubAutoLogin
      return
    }

    if (route.params.code) {
      await router.push(routeWithParamsAndQuery('Redeem'))
      return
    }
    // The event link's entry now has a member to offer it to: on to their entries, where the
    // form for a new entry opens with the link's words in it.
    //
    // ⛔ Only where no page is waiting. Of the two wishes kept for after a sign-in the
    // younger one counts: opening an event link puts the way back to the overview
    // (guards.js), so a way back that leads anywhere else was written AFTER the link -- the
    // reply button of a mail pressed since leads into its conversation, and the entry is let
    // go. A project and a redeem code went first, above, for the same reason: they have a
    // place of their own to lead to.
    //
    // The overview by its record, not by the letters of the address: `/overview/` typed with
    // a slash is the overview all the same.
    //
    // `replace`: the sign-in form is done with, and the back button should not offer it to
    // somebody who has just signed in.
    if (offered && router.resolve(back).matched.at(-1)?.path === '/overview') {
      entryDraft.put(eventMatchingEntryDraft(offered))
      await router.replace('/matching/entries')
      return
    }
    await router.push(back)
  } catch (error) {
    // ⛔ These two literals are one half of a contract with the backend, and the backend
    // cannot be imported here. Both were wrong - a word order apart from what `login`
    // actually throws - so neither branch had ever fired. A member without a password saw
    // the raw English sentence in an "unknown error" toast instead of the page that tells
    // them what to do. Pinned on this side by `Login.spec.js`, on the other by
    // `UserResolver.test.ts`; move one and the pair has to move together.
    if (error.message.includes('The Users email is not validate yet')) {
      showPageMessage.value = true
      errorSubtitle.value = t('message.activateEmail')
      errorLinkTo.value = { name: 'ForgotPassword' }
      toastError(t('error.no-account'))
    } else if (error.message.includes('The User has not set a password yet')) {
      showPageMessage.value = true
      errorSubtitle.value = t('message.unsetPassword')
      // Not `ResetPassword`: that route needs an `:optin` code, and a login page has none -
      // `router.push` threw `Missing required param "optin"` straight out of the click
      // handler. The road to a password is the one the branch above already takes.
      errorLinkTo.value = { name: 'ForgotPassword' }
      toastError(t('error.no-account'))
    } else if (error.message.includes('No user with this credentials')) {
      toastError(t('error.no-user'))
    } else {
      toastError(t('error.unknown-error') + error.message)
    }
  } finally {
    // loader.hide()
  }
})

const enterData = computed(() => !showPageMessage.value)
</script>
<style scoped>
.btn-gradido {
  padding-right: 0;
  padding-left: 0;
}

.btn-gradido-disable {
  padding-right: 0;
  padding-left: 0;
}
</style>
