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
            <!-- Only once the answer is here. While the query runs `changesLeft` is
                 null, `quotaExhausted` is false, and this branch would state "0 more
                 times" on every single load of the settings page. -->
            <small
              v-else-if="changesLeft !== null"
              class="text-muted"
              data-test="username-quota-left"
            >
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

    <BModal
      id="modal-confirm-username"
      v-model="showConfirm"
      hide-header
      centered
      data-test="confirm-username-modal"
    >
      <div class="text-center px-2 pt-3">
        <p class="mb-0">{{ $t('settings.username.confirm-title') }}</p>
        <div class="username-change d-flex align-items-center justify-content-center my-3">
          <span class="username-old" data-test="confirm-old">{{ username }}</span>
          <span class="username-arrow">&rarr;</span>
          <span class="username-new" data-test="confirm-new">{{ values.username }}</span>
        </div>
        <p v-if="reclaiming" class="small mb-0 text-success" data-test="confirm-free">
          {{ $t('settings.username.confirm-free') }}
        </p>
        <p v-else class="small text-muted mb-0">
          {{ $t('settings.username.confirm-reserved', { name: username }) }}
          <br />
          <span v-if="lastChange" class="confirm-last" data-test="confirm-last">
            {{ $t('settings.username.confirm-last') }}
          </span>
          <span v-else data-test="confirm-left">{{ confirmLeftText }}</span>
        </p>
      </div>
      <template #footer>
        <BButton variant="secondary" data-test="confirm-cancel" @click="showConfirm = false">
          {{ $t('form.cancel') }}
        </BButton>
        <BButton variant="gradido" data-test="confirm-change" @click="applyChange">
          {{ $t('form.change') }}
        </BButton>
      </template>
    </BModal>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useStore } from 'vuex'
import { useMutation, useQuery } from '@vue/apollo-composable'
import { useI18n } from 'vue-i18n'
import { BRow, BCol, BFormInput, BFormGroup, BForm, BButton, BModal } from 'bootstrap-vue-next'
import InputUsername from '@/components/Inputs/InputUsername'
import { updateUserInfos } from '@/graphql/mutations'
import { aliasStatus } from '@/graphql/user.graphql'
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
// `cache-and-network`, because this query takes no variables and therefore lives under
// a single cache key for everybody. The cache is emptied on logout now, which is the
// real fix; this is the second lock, for every way a member can change without that
// action running - and it keeps the quota honest when it was spent in another tab.
const { result: statusResult, refetch: refetchStatus } = useQuery(aliasStatus, null, {
  fetchPolicy: 'cache-and-network',
})

const changesLeft = computed(() => statusResult.value?.aliasStatus?.changesLeft ?? null)
const quotaExhausted = computed(() => changesLeft.value === 0)
// vue-i18n picks the branch from the count and hands the message its `n`, so the
// number is passed once and nothing here has to know about plural forms.
const quotaLeftText = computed(() => t('settings.username.quota-left', changesLeft.value ?? 0))

const nextChangeDate = computed(() => {
  const at = statusResult.value?.aliasStatus?.nextChangeAt
  return at ? new Date(at).toLocaleDateString(locale.value) : ''
})

const showConfirm = ref(false)

// Coming back to a name one already owns takes no name into possession, so it costs
// nothing - and the member should be told that before they decide, not discover it
// afterwards.
// Compared without regard to case, like the column itself (utf8mb4_unicode_ci) and
// like every lookup on the server. `Bernd` and `BERND` are the same row, so a
// case-sensitive `includes` would tell somebody a free return costs one of their four.
const reclaiming = computed(() => {
  const typed = values.username?.toLowerCase()
  return (statusResult.value?.aliasStatus?.ownAliases ?? []).some(
    (owned) => owned.toLowerCase() === typed,
  )
})
const lastChange = computed(() => !reclaiming.value && changesLeft.value === 1)
const confirmLeftText = computed(() =>
  t('settings.username.confirm-left', Math.max(0, (changesLeft.value ?? 1) - 1)),
)

// The form only opens the question. Saving happens when it has been answered - the old
// name beside the new one is what makes somebody read before they agree.
const onSubmit = handleSubmit(() => {
  showConfirm.value = true
})

const applyChange = async () => {
  showConfirm.value = false
  try {
    await updateUserInfo({ alias: values.username })
    store.commit('username', values.username)
    toastSuccess(t('settings.username.change-success'))
    await refetchStatus()
  } catch (error) {
    // The button is disabled once the quota is gone, so this is a backstop - reachable
    // by a race or a direct call. It still must not put a bare error code on screen.
    if (error.message?.includes('ALIAS_QUOTA_EXHAUSTED')) {
      await refetchStatus()
      toastError(t('settings.username.quota-blocked', { date: nextChangeDate.value }))
    } else {
      toastError(error.message)
    }
  }
}

const username = computed(() => store.state.username || '')

const newUsername = computed(() => values.username && values.username !== store.state.username)

const disabled = (err) => {
  // The quota only blocks TAKING a name. Coming back to one the member already owns
  // writes no row and costs nothing - the server does not even look at the quota in
  // that case - so blocking it here made the form stricter than the rule it enforces,
  // and made the "this one is free" line in the confirmation unreachable.
  const blockedByQuota = quotaExhausted.value && !reclaiming.value
  return !newUsername.value || blockedByQuota || !!Object.keys(err).length
}
</script>

<style>
.username-change {
  gap: 14px;
  flex-wrap: wrap;
}

.username-old,
.username-new {
  font-size: 1.05rem;
  font-weight: 600;
  padding: 9px 16px;
  border-radius: 17px;
  background-color: var(--surface-muted);
  border: 1px solid var(--border);
  word-break: break-all;
}

.username-old {
  color: var(--text-muted);
  text-decoration: line-through;
}

.username-new {
  color: var(--gold, #c58d38);
}

.username-arrow {
  color: var(--text-muted);
}

.confirm-last {
  color: var(--warning, #f5b539);
}

.cursor-pointer {
  cursor: pointer;
}

div.alert {
  color: red;
}
</style>
