// AI-GENERATED — not an architecture reference
import { useMutation, useQuery } from '@vue/apollo-composable'
import { BButton, BCol, BForm, BModal, BRow, type ButtonVariant } from 'bootstrap-vue-next'
import { useForm } from 'vee-validate'
import { computed, defineComponent, ref, withModifiers } from 'vue'
import { useI18n } from 'vue-i18n'
import { InputUsername } from '@/components/Inputs/InputUsername'
import { useAppToast } from '@/composables/useToast'
import { updateUserInfos } from '@/graphql/mutations'
import { aliasStatus } from '@/graphql/user.graphql'
import { useWalletStore } from '@/store/useWalletStore'
import './UserName.css'

export const UserName = defineComponent({
  name: 'UserName',
  setup(_props, { expose }) {
    const store = useWalletStore()
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

    const { handleSubmit, errors, values } = useForm<{ username?: string }>()
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

    const changesLeft = computed<number | null>(
      () => statusResult.value?.aliasStatus?.changesLeft ?? null,
    )
    const quotaExhausted = computed(() => changesLeft.value === 0)
    // vue-i18n picks the branch from the count and hands the message its `n`, so the
    // number is passed once and nothing here has to know about plural forms.
    const quotaLeftText = computed(() => t('settings.username.quota-left', changesLeft.value ?? 0))

    const nextChangeDate = computed(() => {
      const at: string | null | undefined = statusResult.value?.aliasStatus?.nextChangeAt
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
      const ownAliases: string[] = statusResult.value?.aliasStatus?.ownAliases ?? []
      return ownAliases.some((owned) => owned.toLowerCase() === typed)
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
        store.setUsername(values.username)
        toastSuccess(t('settings.username.change-success'))
        await refetchStatus()
      } catch (error) {
        const message = (error as Error).message
        // The button is disabled once the quota is gone, so this is a backstop - reachable
        // by a race or a direct call. It still must not put a bare error code on screen.
        if (message?.includes('ALIAS_QUOTA_EXHAUSTED')) {
          await refetchStatus()
          toastError(t('settings.username.quota-blocked', { date: nextChangeDate.value }))
        } else {
          toastError(message)
        }
      }
    }

    const username = computed<string>(() => store.username || '')

    const newUsername = computed(() => values.username && values.username !== store.username)

    const disabled = (err: Record<string, unknown>) => {
      // The quota only blocks TAKING a name. Coming back to one the member already owns
      // writes no row and costs nothing - the server does not even look at the quota in
      // that case - so blocking it here made the form stricter than the rule it enforces,
      // and made the "this one is free" line in the confirmation unreachable.
      const blockedByQuota = quotaExhausted.value && !reclaiming.value
      return !newUsername.value || blockedByQuota || !!Object.keys(err).length
    }

    // What the spec reads of the form.
    expose({ store })

    return () => (
      <div id='username-form'>
        {/* div v-if="store.username">
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
        <div v-else */}

        <div>
          <BForm onSubmit={withModifiers(onSubmit, ['prevent'])}>
            <BRow class='mb-3'>
              <BCol class='col-12'>
                {/* Written in kebab case, as the template had them: where the field is a stub
                    they are the attributes the spec reads. */}
                <InputUsername
                  name='username'
                  placeholder={t('form.username-placeholder')}
                  show-all-errors
                  unique={true}
                  rules={rules}
                  data-test='component-input-username'
                  initial-username-value={username.value}
                />
              </BCol>
              {/* BCol class="col-12">
                <div
                  v-if="!store.username"
                  class="alert gradido-border-radius"
                  data-test="username-alert"
                >
                  {{ $t('settings.username.no-username') }}
                </div>
              </BCol */}
            </BRow>
            <BRow class='mb-2'>
              <BCol class='col-12'>
                {quotaExhausted.value ? (
                  <small class='text-danger' data-test='username-quota-blocked'>
                    {t('settings.username.quota-blocked', { date: nextChangeDate.value })}
                  </small>
                ) : changesLeft.value !== null ? (
                  /* Only once the answer is here. While the query runs `changesLeft` is
                     null, `quotaExhausted` is false, and this branch would state "0 more
                     times" on every single load of the settings page. */
                  <small class='text-muted' data-test='username-quota-left'>
                    {quotaLeftText.value}
                  </small>
                ) : null}
              </BCol>
            </BRow>
            {newUsername.value ? (
              <BRow class='text-end'>
                <BCol>
                  <div class='text-end'>
                    <BButton
                      variant={disabled(errors.value) ? 'light' : 'success'}
                      type='submit'
                      disabled={disabled(errors.value)}
                      data-test='submit-username-button'
                    >
                      {t('form.save')}
                    </BButton>
                  </div>
                </BCol>
              </BRow>
            ) : null}
          </BForm>
        </div>
        {/* /div */}

        <BModal
          id='modal-confirm-username'
          modelValue={showConfirm.value}
          noHeader
          centered
          data-test='confirm-username-modal'
          onUpdate:modelValue={(open: boolean) => {
            showConfirm.value = open
          }}
          v-slots={{
            footer: () => (
              <>
                <BButton
                  variant='secondary'
                  data-test='confirm-cancel'
                  onClick={() => {
                    showConfirm.value = false
                  }}
                >
                  {t('form.cancel')}
                </BButton>
                <BButton
                  variant={'gradido' as ButtonVariant}
                  data-test='confirm-change'
                  onClick={applyChange}
                >
                  {t('form.change')}
                </BButton>
              </>
            ),
          }}
        >
          <div class='text-center px-2 pt-3'>
            <p class='mb-0'>{t('settings.username.confirm-title')}</p>
            <div class='username-change d-flex align-items-center justify-content-center my-3'>
              <span class='username-old' data-test='confirm-old'>
                {username.value}
              </span>
              <span class='username-arrow'>&rarr;</span>
              <span class='username-new' data-test='confirm-new'>
                {values.username}
              </span>
            </div>
            {reclaiming.value ? (
              <p class='small mb-0 text-success' data-test='confirm-free'>
                {t('settings.username.confirm-free')}
              </p>
            ) : (
              <p class='small text-muted mb-0'>
                {t('settings.username.confirm-reserved', { name: username.value })}
                <br />
                {lastChange.value ? (
                  <span class='confirm-last' data-test='confirm-last'>
                    {t('settings.username.confirm-last')}
                  </span>
                ) : (
                  <span data-test='confirm-left'>{confirmLeftText.value}</span>
                )}
              </p>
            )}
          </div>
        </BModal>
      </div>
    )
  },
})
