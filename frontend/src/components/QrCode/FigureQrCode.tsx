// AI-GENERATED — not an architecture reference
import { QRCanvas } from 'qrcanvas-vue'
import { computed, defineComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { COIN_IMAGE_PATH, qrCodeOptions } from '@/utils/qrCode'
import classes from './FigureQrCode.module.scss'

export const FigureQrCode = defineComponent({
  name: 'FigureQrCode',
  props: {
    link: { type: String, required: true },
  },
  setup(props, { expose }) {
    const { t } = useI18n()

    const canvas = ref<InstanceType<typeof QRCanvas> | null>(null)
    const download = ref<HTMLAnchorElement | null>(null)
    const image = ref<HTMLImageElement | null>(null)

    // The code is drawn without the coin until the coin has loaded: `null` is what the options
    // carried then, too.
    const options = computed(() => qrCodeOptions(props.link, image.value as HTMLImageElement))

    const coinImage = new Image()
    coinImage.src = COIN_IMAGE_PATH
    coinImage.onload = () => {
      image.value = coinImage
    }

    const downloadImg = () => {
      const anchor = download.value as HTMLAnchorElement
      anchor.href = (canvas.value as InstanceType<typeof QRCanvas>).$el.toDataURL('image/png')
    }

    expose({ options, canvas })

    return () => (
      <div class={['figure-qr-code', classes['figure-qr-code']]}>
        <div class='qrbox'>
          <div>
            <QRCanvas id='qrcanvas' ref={canvas} options={options.value} class='canvas mb-3' />
          </div>
          <a
            id='download'
            ref={download}
            download='GradidoLinkQRCode.png'
            href=''
            onClick={() => downloadImg()}
          >
            {t('download')}
          </a>
        </div>
      </div>
    )
  },
})
