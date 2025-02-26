<template>
  <div id="registerform">
    <BContainer v-if="enterData">
      <div class="pb-5" align="center">{{ $t('gdd_per_link.isFree') }}</div>
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
          <BCol class="col-lg-6 col-12 mt-3">
            {{ $t('existingGradidoAccount', { communityName: CONFIG.COMMUNITY_NAME }) }}
          </BCol>
        </BRow>
        <BRow>
          <BCol class="col-lg-6 col-12 mt-1">
            <BLink :to="login()" class="login-nav-item">
              {{ $t('signin') }}
            </BLink>
          </BCol>
        </BRow>
      </BForm>
    </BContainer>
    <BContainer v-else>
      <message :headline="$t('message.title')" :subtitle="$t('message.register')" />
    </BContainer>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useMutation } from '@vue/apollo-composable'
import InputEmail from '@/components/Inputs/InputEmail'
import Message from '@/components/Message/Message'
import { useAppToast } from '@/composables/useToast'
import { useField, useForm } from 'vee-validate'
import { createUser } from '@/graphql/mutations'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
import { useRoute } from 'vue-router'
import { useAuthLinks } from '@/composables/useAuthLinks'
import CONFIG from '@/config'

const { toastError } = useAppToast()
const { login } = useAuthLinks()

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
const { params } = useRoute()

const showPageMessage = ref(false)
const publisherId = ref(store.state.publisherId)
const redeemCode = ref(params.code)

const enterData = computed(() => {
  return !showPageMessage.value
})

async function onSubmit() {
  try {
    await mutate({
      email: formValues.email,
      firstName: formValues.firstname,
      lastName: formValues.lastname,
      language: store.state.language,
      publisherId: publisherId.value,
      redeemCode: redeemCode.value,
      project: store.state.project,
    })
    showPageMessage.value = true
  } catch (error) {
    toastError(`${t('error.unknown-error')} ${error.message}`)
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
a.login-nav-item {
  color: #0e79bc !important;
}
</style>
