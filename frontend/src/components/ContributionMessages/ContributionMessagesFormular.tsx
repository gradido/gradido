// AI-GENERATED — not an architecture reference
import { useMutation } from '@vue/apollo-composable'
import { BButton, BCol, BForm, BFormTextarea, BRow, type ButtonVariant } from 'bootstrap-vue-next'
import { computed, defineComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppToast } from '@/composables/useToast'
import { createContributionMessage } from '@/graphql/mutations.js'

/** The reply field under a contribution's thread. */
export const ContributionMessagesFormular = defineComponent({
  name: 'ContributionMessagesFormular',
  props: {
    contributionId: { type: Number, required: true },
  },
  emits: ['add-contribution-message'],
  setup(props, { emit, expose }) {
    const { t } = useI18n()
    const { toastSuccess, toastError } = useAppToast()

    const { mutate: createContributionMessageMutation } = useMutation(createContributionMessage)

    const formText = ref('')

    const isSubmitting = ref(false)

    const disabled = computed(() => formText.value === '' || isSubmitting.value)

    const onSubmit = async (event: Event) => {
      event.preventDefault()
      isSubmitting.value = true
      try {
        const result = await createContributionMessageMutation({
          contributionId: props.contributionId,
          message: formText.value,
        })

        formText.value = ''
        emit('add-contribution-message', result?.data.createContributionMessage)
        toastSuccess(t('message.reply'))
      } catch (error) {
        toastError((error as Error).message)
      } finally {
        isSubmitting.value = false
      }
    }

    const onReset = () => {
      formText.value = ''
    }

    expose({ formText })

    return () => (
      <div class='contribution-messages-formular'>
        <small class='ps-2 pt-3'>{t('form.reply')}</small>
        <div>
          <BForm onSubmit={onSubmit} onReset={onReset}>
            {/* The template's `.form-control { height: 50px }` overrides `rows` on a
                textarea. Releasing the height lets `rows` size the field again, so the
                reply box invites more than the two lines that 50px allowed. */}
            <BFormTextarea
              id='textarea'
              modelValue={formText.value}
              placeholder={t('form.memo')}
              rows={8}
              style={{ height: 'auto' }}
              onUpdate:modelValue={(value) => {
                formText.value = String(value)
              }}
            />
            <BRow class='mt-4 mb-4'>
              <BCol>
                <BButton type='reset' variant='secondary'>
                  {t('form.cancel')}
                </BButton>
              </BCol>
              <BCol class='text-end'>
                <BButton
                  type='submit'
                  variant={'gradido' as ButtonVariant}
                  disabled={disabled.value}
                >
                  {t('form.reply')}
                </BButton>
              </BCol>
            </BRow>
          </BForm>
        </div>
      </div>
    )
  },
})
