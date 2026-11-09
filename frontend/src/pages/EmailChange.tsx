// AI-GENERATED — not an architecture reference
import { useMutation } from '@vue/apollo-composable'
import { BButton, type ButtonVariant } from 'bootstrap-vue-next'
import { computed, defineComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { Message } from '@/components/Message/Message'
import { confirmEmailChange, revokeEmailChange } from '@/graphql/mutations'

export const EmailChange = defineComponent({
  name: 'EmailChange',
  emits: ['set-mobile-start'],
  setup(_props, { emit }) {
    const route = useRoute()
    const { t } = useI18n()

    // One page for the two links of a change: the one in the mail to the new address confirms,
    // the one in the notice to the old address revokes.
    const revoking = computed(() => route.name === 'EmailChangeRevoke')

    // Literal keys on purpose: the i18n lint only counts a key as used when it sees it spelled
    // out in a t() call.
    const texts = computed(() =>
      revoking.value
        ? {
            title: t('emailChange.revoke.title'),
            text: t('emailChange.revoke.text'),
            button: t('emailChange.revoke.button'),
            done: t('emailChange.revoke.done'),
            // The shared text's advice sentence ("request a new confirmation e-mail in your
            // settings") is written for the member confirming - the veto reader may be
            // somebody else entirely, so their dead link gets the first sentence alone.
            invalid: t('emailChange.revoke.invalid'),
          }
        : {
            title: t('emailChange.confirm.title'),
            text: t('emailChange.confirm.text'),
            button: t('emailChange.confirm.button'),
            done: t('emailChange.confirm.done'),
            invalid: t('emailChange.invalid'),
          },
    )

    const { mutate: confirm } = useMutation(confirmEmailChange)
    const { mutate: revoke } = useMutation(revokeEmailChange)

    const busy = ref(false)
    const finished = ref(false)
    const headline = ref('')
    const subtitle = ref('')

    const act = async () => {
      busy.value = true
      try {
        // Nothing is written into a session that may be open on this device: the code is
        // public, and the wallet signed in here need not be the account it belongs to.
        if (revoking.value) {
          await revoke({ vetoCode: route.params.changeCode })
        } else {
          await confirm({ code: route.params.changeCode })
        }
        headline.value = t('message.title')
        subtitle.value = texts.value.done
      } catch (error) {
        const { message } = error as Error
        headline.value = t('message.errorTitle')
        subtitle.value = message.includes('Invalid or expired code') ? texts.value.invalid : message
      } finally {
        busy.value = false
        finished.value = true
      }
    }

    emit('set-mobile-start', false)

    // Nothing happens on opening the page. A link that acts when it is merely opened is
    // "clicked" by every mail scanner that prefetches links - and a prefetched confirmation
    // would move an account without anybody having decided to. Hence the button.
    return () =>
      !finished.value ? (
        <div class='email-change'>
          <div class='h3 pb-3'>{texts.value.title}</div>
          <p class='pb-4'>{texts.value.text}</p>
          <BButton
            // no prop of BButton: it lands on the element as the empty attribute it was
            {...({ block: '' } as object)}
            variant={'gradido' as ButtonVariant}
            disabled={busy.value}
            data-test='email-change-action'
            onClick={act}
          >
            {texts.value.button}
          </BButton>
        </div>
      ) : (
        <Message
          headline={headline.value}
          subtitle={subtitle.value}
          buttonText={t('login')}
          linkTo={{ name: 'Login' }}
        />
      )
  },
})
