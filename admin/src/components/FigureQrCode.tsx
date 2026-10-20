// AI-GENERATED — not an architecture reference
import { QRCanvas } from 'qrcanvas-vue'
import { computed, defineComponent, ref } from 'vue'
import { COIN_IMAGE_PATH, qrCodeOptions } from '@/utils/qrCode'
import classes from './FigureQrCode.module.css'

export const FigureQrCode = defineComponent({
  name: 'FigureQrCode',
  props: {
    link: { type: String, required: true },
  },
  setup(props) {
    const image = ref<HTMLImageElement | null>(null)
    const showQr = ref(false)

    // null until the coin has loaded, as before -- the options take it as it is
    const qrOptions = computed(() => qrCodeOptions(props.link, image.value as HTMLImageElement))

    const coinImage = new Image()
    coinImage.src = COIN_IMAGE_PATH
    coinImage.onload = () => {
      image.value = coinImage
      showQr.value = true
    }

    return () => (
      <div class='figure-qr-code'>
        <div class={classes.qrbox}>
          {showQr.value ? <QRCanvas options={qrOptions.value} class={classes.canvas} /> : null}
        </div>
      </div>
    )
  },
})
