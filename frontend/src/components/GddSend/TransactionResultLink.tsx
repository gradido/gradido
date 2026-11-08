// AI-GENERATED — not an architecture reference
import { BButton, type ButtonVariant } from 'bootstrap-vue-next'
import { defineComponent, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import ClipboardCopy from '@/components/ClipboardCopy.vue'
import FigureQrCode from '@/components/QrCode/FigureQrCode.vue'
import { useThankYouCheque } from '@/composables/useThankYouCheque'
import IBiDownload from '~icons/bi/download'
import classes from './TransactionResultLink.module.scss'

/** The link that was made: to copy, as a cheque to download, as a QR code. */
export const TransactionResultLink = defineComponent({
  name: 'TransactionResultLink',
  props: {
    link: { type: String, required: true },
    amount: { type: String, required: true },
    memo: { type: String, required: true },
    validUntil: { type: String, required: true },
  },
  emits: ['on-back'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const { drawThankYouCheque, downloadThankYouCheque } = useThankYouCheque({ ...props })

    const chequeImage = ref<string | null>(null)

    // Drawn when the page appears, so the button hands the picture over without a wait. A
    // failure stays quiet here on purpose - there is nothing the member asked for yet. It is
    // reported when the button is pressed, which is when it stands in the way.
    onMounted(async () => {
      try {
        chequeImage.value = await drawThankYouCheque()
      } catch {
        chequeImage.value = null
      }
    })

    const download = () => downloadThankYouCheque(chequeImage.value)

    return () => (
      <div
        class={[classes.transactionResultLink, 'bg-white app-box-shadow gradido-border-radius p-5']}
      >
        <div class='h3 fw-bold mb-4'>{t('gdd_per_link.created')}</div>
        <ClipboardCopy
          link={props.link}
          amount={props.amount}
          memo={props.memo}
          validUntil={props.validUntil}
        />
        <div class='mb-4'>
          <label class={['cheque-label', classes.chequeLabel]}>
            {t('thank-you-cheque.download')}{' '}
            <BButton
              size='sm'
              class={['cheque-icon', classes.chequeIcon]}
              data-test='downloadCheque'
              onClick={download}
            >
              <IBiDownload />
            </BButton>
          </label>
          {/* The picture is the cheque itself, not a sample: whoever presses the button gets
              exactly what is shown, and it is drawn only once for both. */}
          {chequeImage.value ? (
            <div class='text-center'>
              <img
                src={chequeImage.value}
                class={['cheque-preview pointer', classes.chequePreview]}
                alt={t('thank-you-cheque.download')}
                onClick={download}
              />
            </div>
          ) : null}
        </div>
        <label class='fw-bold'>{t('qrCode')}</label>
        <div class='text-center'>
          <div>
            <FigureQrCode link={props.link} />
          </div>
          <div>
            <BButton
              // `gradido` is the wallet's own variant (.btn-gradido, gradido.css)
              variant={'gradido' as ButtonVariant}
              class='mt-4'
              data-test='close-btn'
              onClick={() => emit('on-back')}
            >
              {t('form.close')}
            </BButton>
          </div>
        </div>
      </div>
    )
  },
})
