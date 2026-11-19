// AI-GENERATED — not an architecture reference
import { BButton, type ButtonVariant } from 'bootstrap-vue-next'
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCopyLinks } from '@/composables/useCopyLinks'
import { useSendByEmail } from '@/composables/useSendByEmail'
import IBiCopy from '~icons/bi/copy'
import IBiEnvelope from '~icons/bi/envelope'
import IBiLock from '~icons/bi/lock'
import IBiShare from '~icons/bi/share'
import './ClipboardCopy.scss'
import classes from './ClipboardCopy.module.scss'

export const ClipboardCopy = defineComponent({
  name: 'ClipboardCopy',
  props: {
    link: { type: String, required: true },
    amount: { type: String, required: true },
    memo: { type: String, required: true },
    validUntil: { type: String, required: true },
  },
  setup(props) {
    const { t } = useI18n()

    const { copyLink, copyLinkWithText, linkText, shortLinkText, canCopyLink, share } =
      useCopyLinks({
        ...props,
      })
    // A plain link has no picture: this only opens the mail program.
    const { href: emailHref, hint: emailHint } = useSendByEmail({
      text: linkText,
      shortText: shortLinkText,
    })

    return () => (
      <div class={['clipboard-copy', classes['clipboard-copy']]}>
        {/* Handing the link on is what this page is for, so it leads: one button for the
            device's own share sheet (it copies where the device has none), and under it the one
            sentence meant for the sender, not for the person the link goes to. The two copy rows
            below stay for whoever wants to paste it somewhere themselves. */}
        <div class='mb-4'>
          <BButton
            variant={'gradido' as ButtonVariant}
            class='w-100'
            data-test='shareButton'
            onClick={share}
          >
            <IBiShare class='me-2' /> {t('gdd_per_link.share')}
          </BButton>
          <BButton
            variant='outline-secondary'
            class='w-100 mt-2'
            href={emailHref.value}
            role='link'
            aria-describedby='clipboard-copy-email-hint'
            data-test='emailButton'
          >
            <IBiEnvelope class='me-2' /> {t('gdd_per_link.by-email')}
          </BButton>
          <div id='clipboard-copy-email-hint' class='share-hint small mt-2' data-test='emailHint'>
            <span>{emailHint.value}</span>
          </div>
          <div class='share-hint small mt-2' data-test='linkHint'>
            <IBiLock class='share-hint-icon' />
            <span>{t('gdd_per_link.link-hint')}</span>
          </div>
        </div>
        {canCopyLink.value ? (
          <div>
            <div class='mb-4'>
              <label class='copy-label'>
                {t('gdd_per_link.copy-link')}{' '}
                <BButton size='sm' class='copy-icon' data-test='copyLinkButton' onClick={copyLink}>
                  <IBiCopy />
                </BButton>
              </label>
              <div
                class='copy-link-card pointer text-center gradido-border-radius p-3'
                data-test='copyLink'
                onClick={copyLink}
              >
                {props.link}
              </div>
            </div>
            <div class='mb-4'>
              <label class='copy-label'>
                {t('gdd_per_link.copy-link-with-text')}{' '}
                <BButton
                  size='sm'
                  class='copy-icon'
                  data-test='copyLinkWithTextButton'
                  onClick={copyLinkWithText}
                >
                  <IBiCopy />
                </BButton>
              </label>
              <div
                class='copy-link-card copy-link-text pointer text-center gradido-border-radius p-3'
                data-test='copyLinkWithText'
                onClick={copyLinkWithText}
              >
                {linkText.value}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div class='alert-danger p-3'>{t('gdd_per_link.not-copied')}</div>
            <div class='alert-muted h3 p-3'>{props.link}</div>
          </div>
        )}
      </div>
    )
  },
})
