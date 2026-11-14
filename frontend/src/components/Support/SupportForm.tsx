// AI-GENERATED — not an architecture reference
import { useMutation } from '@vue/apollo-composable'
import {
  BButton,
  BCol,
  BForm,
  BFormGroup,
  BLink,
  BRow,
  type ButtonVariant,
} from 'bootstrap-vue-next'
import { computed, defineComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { I18nText } from '@/components/I18nText'
import ValidatedInput from '@/components/Inputs/ValidatedInput.vue'
import ThemedSelect from '@/components/ThemedSelect.vue'
import { pollChatNow } from '@/composables/useChatUpdates'
import { useCreationGroupChoice } from '@/composables/useCreationGroupChoice'
import { useAppToast } from '@/composables/useToast'
import CONFIG from '@/config'
import { createSupportTicket } from '@/graphql/supportTickets.graphql'
import { useWalletStore } from '@/store/useWalletStore'
import { supportTicketRefusal } from '@/utils/supportTicketRefusal'
import { MESSAGE_MAX_CHARS, supportTicketText } from '@/validationSchemas'

/**
 * "Schreiben": a request to the support (SUA-005, SUA-011). The member's creation group is
 * pre-filled as on a contribution, and the sentence under it says who reads the request.
 *
 * While the community has new requests switched off (K5, SUA-024 1 b), a sentence with the
 * support's address stands in the form's place; a request the server refuses for the switch --
 * a form that was open before -- says the same, and the chat's beat is asked at once, which
 * brings the switch and puts the sentence there.
 */
export const SupportForm = defineComponent({
  name: 'SupportForm',
  emits: ['sent'],
  setup(_, { emit, expose }) {
    const { t } = useI18n()
    const { toastSuccess, toastError } = useAppToast()
    const store = useWalletStore()
    const { selected, options, selectedLabel } = useCreationGroupChoice()
    const { mutate: createSupportTicketMutation } = useMutation(createSupportTicket)

    const text = ref('')
    const sending = ref(false)
    // A new field after "Abbrechen": the field shows whether its words are valid only once the
    // member has typed in it.
    const field = ref(0)

    const disabled = computed(() => sending.value || !supportTicketText.isValidSync(text.value))
    const readBy = computed(() =>
      selectedLabel.value
        ? t('support.readBy.group', { group: selectedLabel.value })
        : t('support.readBy.none'),
    )

    const submit = async (event: Event) => {
      event.preventDefault()
      if (sending.value) {
        return
      }
      sending.value = true
      try {
        await createSupportTicketMutation({
          text: text.value,
          creationGroupTag: selected.value || null,
        })
        toastSuccess(t('support.sent'))
        text.value = ''
        emit('sent')
      } catch (error) {
        toastError(supportTicketRefusal(t, error))
      } finally {
        sending.value = false
        // the mark and the menu as the request leaves them -- or the switch that refused it
        pollChatNow()
      }
    }

    const reset = () => {
      text.value = ''
      field.value += 1
    }

    expose({ text, selected, submit })

    return () =>
      store.supportTicketsActive === false ? (
        <div class='support-form'>
          <I18nText
            keypath='support.off'
            tag='p'
            class='p-3 bg-white app-box-shadow gradido-border-radius'
            data-test='support-off'
          >
            {{
              mail: () => (
                <BLink href={`mailto:${CONFIG.COMMUNITY_SUPPORT_MAIL}`}>
                  {CONFIG.COMMUNITY_SUPPORT_MAIL}
                </BLink>
              ),
            }}
          </I18nText>
        </div>
      ) : (
        <div class='support-form'>
          <BForm
            class='form-style p-3 bg-white app-box-shadow gradido-border-radius'
            onSubmit={submit}
            onReset={reset}
          >
            <BFormGroup
              id='support-creation-group-group'
              class='mb-4'
              label={t('contribution.creationGroup.label')}
              description={readBy.value}
            >
              <ThemedSelect
                modelValue={selected.value}
                options={options.value}
                data-test='support-creation-group'
                onUpdate:modelValue={(value: string) => {
                  selected.value = value
                }}
              />
            </BFormGroup>
            <ValidatedInput
              key={field.value}
              id='support-text'
              modelValue={text.value}
              name='text'
              label={t('support.question')}
              placeholder={t('support.placeholder')}
              rules={supportTicketText}
              textarea='true'
              maxlength={MESSAGE_MAX_CHARS}
              // what is typed while the request is on its way would be lost with the reset after it
              disabled={sending.value}
              onUpdate:modelValue={(value: string) => {
                text.value = value
              }}
            />
            <BRow class='mt-4'>
              <BCol>
                <BButton type='reset' variant='secondary' disabled={sending.value}>
                  {t('form.cancel')}
                </BButton>
              </BCol>
              <BCol class='text-end'>
                <BButton
                  type='submit'
                  variant={'gradido' as ButtonVariant}
                  disabled={disabled.value}
                  data-test='support-send'
                >
                  {t('support.send')}
                </BButton>
              </BCol>
            </BRow>
          </BForm>
        </div>
      )
  },
})
