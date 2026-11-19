// AI-GENERATED — not an architecture reference
import { BButton, BForm, BFormInput, type ButtonVariant } from 'bootstrap-vue-next'
import { computed, defineComponent, ref, withModifiers } from 'vue'
import { useI18n } from 'vue-i18n'

export const ProjectAccountConfirm = defineComponent({
  name: 'ProjectAccountConfirm',
  props: {
    /** 'declare' = switch creation off (two steps), 'request' = ask for it back (one step). */
    mode: { type: String, required: true },
    busy: { type: Boolean, default: false },
  },
  emits: ['confirm', 'cancel'],
  setup(props, { emit }) {
    const { t } = useI18n()

    const step = ref(1)
    const typed = ref('')

    /**
     * The word is a locale value, so a member types it in their own language. Compared without
     * case, without surrounding blanks and without accents: the point is that the member READ
     * it, not that they hit the shift key or the accent key.
     *
     * ⚠️ The accents are Greek's reason. Greek capitals carry none, so the word is "ΕΡΓΟ" — but
     * the member types "έργο", a phone turns that into "Έργο", and upper case makes "ΈΡΓΟ" of
     * it, which is not "ΕΡΓΟ". Decomposed (NFD), the accent is a mark of its own and drops out.
     */
    const comparable = (word: string) =>
      word.trim().normalize('NFD').replace(/\p{M}/gu, '').toUpperCase()
    const expectedWord = computed(() => t('settings.creationAccount.confirm.word'))
    const wordMatches = computed(() => comparable(typed.value) === comparable(expectedWord.value))

    const confirmIfMatching = () => {
      if (wordMatches.value && !props.busy) {
        emit('confirm')
      }
    }

    const cancel = () => {
      step.value = 1
      typed.value = ''
      emit('cancel')
    }

    const cancelButton = () => (
      <BButton variant='secondary' data-test='project-account-confirm-cancel' onClick={cancel}>
        {t('form.cancel')}
      </BButton>
    )

    return () => (
      <div class='project-account-confirm px-2 pt-3' data-test='project-account-confirm'>
        {/* ── switching OFF: two steps, because the member cannot undo it (ABN-L3-01) ──
            Creation is one of the most important things in Gradido, and only the support can
            switch it back on. So: the question with the consequence spelled out, then the word
            typed by hand -- a click that landed by accident gets past neither. */}
        {props.mode === 'declare' ? (
          step.value === 1 ? (
            <>
              <p class='h5 mb-2'>{t('settings.creationAccount.confirm.declareTitle')}</p>
              <p data-test='project-account-confirm-text'>
                {t('settings.creationAccount.confirm.declareText')}
              </p>
              <div class='d-flex justify-content-end gap-2 mt-4'>
                {cancelButton()}
                <BButton
                  variant={'gradido' as ButtonVariant}
                  data-test='project-account-confirm-next'
                  onClick={() => {
                    step.value = 2
                  }}
                >
                  {t('settings.creationAccount.confirm.next')}
                </BButton>
              </div>
            </>
          ) : (
            // A form, so that Enter in the field is the same as the button (Account.tsx does it
            // this way): the handler is one, and a native submit can never slip past it.
            <BForm onSubmit={withModifiers(confirmIfMatching, ['prevent'])}>
              <p data-test='project-account-confirm-type'>
                {t('settings.creationAccount.confirm.typeWord', { word: expectedWord.value })}
              </p>
              <BFormInput
                modelValue={typed.value}
                placeholder={expectedWord.value}
                autocomplete='off'
                data-test='project-account-confirm-word'
                onUpdate:modelValue={(entered) => {
                  typed.value = String(entered ?? '')
                }}
              />
              <div class='d-flex justify-content-end gap-2 mt-4'>
                {cancelButton()}
                <BButton
                  type='submit'
                  variant='danger'
                  disabled={!wordMatches.value || props.busy}
                  data-test='project-account-confirm-declare'
                >
                  {t('settings.creationAccount.confirm.declare')}
                </BButton>
              </div>
            </BForm>
          )
        ) : (
          /* ── switching back ON: a request, not a switch -- said before it is sent ──────── */
          <>
            <p class='h5 mb-2'>{t('settings.creationAccount.confirm.requestTitle')}</p>
            <p data-test='project-account-confirm-text'>
              {t('settings.creationAccount.confirm.requestText')}
            </p>
            <div class='d-flex justify-content-end gap-2 mt-4'>
              {cancelButton()}
              <BButton
                variant={'gradido' as ButtonVariant}
                disabled={props.busy}
                data-test='project-account-confirm-request'
                onClick={() => emit('confirm')}
              >
                {t('settings.creationAccount.confirm.send')}
              </BButton>
            </div>
          </>
        )}
      </div>
    )
  },
})
