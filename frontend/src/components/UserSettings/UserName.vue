<template>
  <div id="username-form">
    <!-- div v-if="store.state.username">
      <label>{{ $t('form.username') }}</label>
      <BFormGroup
        class="mb-3"
        data-test="username-input-group"
        :description="$t('settings.emailInfo')"
      >
        <BFormInput
          :model-value="username"
          readonly
          data-test="username-input-readonly"
          @update:modelValue="username = $event"
        />
      </BFormGroup>
    </div>
    <div v-else -->

    <div>
      <BForm @submit.prevent="onSubmit">
        <BRow class="mb-3">
          <BCol class="col-12">
            <input-username
              name="username"
              :placeholder="$t('form.username-placeholder')"
              show-all-errors
              :unique="true"
              :rules="rules"
              data-test="component-input-username"
              :initial-username-value="username"
            />
          </BCol>
          <!-- BCol class="col-12">
            <div
              v-if="!store.state.username"
              class="alert gradido-border-radius"
              data-test="username-alert"
            >
              {{ $t('settings.username.no-username') }}
            </div>
          </BCol -->
        </BRow>
        <BRow class="mb-2">
          <BCol class="col-12">
            <small v-if="quotaExhausted" class="text-danger" data-test="username-quota-blocked">
              {{ $t('settings.username.quota-blocked', { date: nextChangeDate }) }}
            </small>
            <small v-else class="text-muted" data-test="username-quota-left">
              {{ quotaLeftText }}
            </small>
          </BCol>
        </BRow>
        <BRow v-if="newUsername" class="text-end">
          <BCol>
            <div ref="submitButton" class="text-end">
              <BButton
                :variant="disabled(errors) ? 'light' : 'success'"
                type="submit"
                :disabled="disabled(errors)"
                data-test="submit-username-button"
              >
                {{ $t('form.save') }}
              </BButton>
            </div>
          </BCol>
        </BRow>
      </BForm>
    </div>
    <!-- /div -->
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'
import { useMutation, useQuery } from '@vue/apollo-composable'
import { useI18n } from 'vue-i18n'
import { BRow, BCol, BFormInput, BFormGroup, BForm, BButton } from 'bootstrap-vue-next'
import InputUsername from '@/components/Inputs/InputUsername'
import { updateUserInfos } from '@/graphql/mutations'
import { aliasQuota } from '@/graphql/user.graphql'
import { useAppToast } from '@/composables/useToast'
import { useForm } from 'vee-validate'

const store = useStore()
const { toastError, toastSuccess } = useAppToast()
const { t, locale } = useI18n()

const rules = {
  required: true,
  min: 3,
  max: 20,
  usernameAllowedChars: true,
  usernameHyphens: true,
  usernameUnique: true,
}

const { handleSubmit, errors, values } = useForm()
const { mutate: updateUserInfo } = useMutation(updateUserInfos)
// Asked before anything is typed, so the button can name a date instead of letting
// somebody choose a name and then refusing it.
const { result: quotaResult, refetch: refetchQuota } = useQuery(aliasQuota)

const changesLeft = computed(() => quotaResult.value?.aliasQuota?.changesLeft ?? null)
const quotaExhausted = computed(() => changesLeft.value === 0)
// vue-i18n picks the branch from the count and hands the message its `n`, so the
// number is passed once and nothing here has to know about plural forms.
const quotaLeftText = computed(() => t('settings.username.quota-left', changesLeft.value ?? 0))

const nextChangeDate = computed(() => {
  const at = quotaResult.value?.aliasQuota?.nextChangeAt
  return at ? new Date(at).toLocaleDateString(locale.value) : ''
})

const onSubmit = handleSubmit(async () => {
  // The old name next to the new one is what makes somebody read it; a dialog showing
  // only what they just typed gets clicked away.
  const confirmed = window.confirm(
    t('settings.username.confirm-change', { from: username.value, to: values.username }),
  )
  if (!confirmed) {
    return
  }
  try {
    await updateUserInfo({ alias: values.username })
    store.commit('username', values.username)
    toastSuccess(t('settings.username.change-success'))
    await refetchQuota()
  } catch (error) {
    // The button is disabled once the quota is gone, so this is a backstop - reachable
    // by a race or a direct call. It still must not put a bare error code on screen.
    if (error.message?.includes('ALIAS_QUOTA_EXHAUSTED')) {
      await refetchQuota()
      toastError(t('settings.username.quota-blocked', { date: nextChangeDate.value }))
    } else {
      toastError(error.message)
    }
  }
})

const username = computed(() => store.state.username || '')

const newUsername = computed(() => values.username && values.username !== store.state.username)

const disabled = (err) => {
  return !newUsername.value || quotaExhausted.value || !!Object.keys(err).length
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
