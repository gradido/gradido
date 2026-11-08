// AI-GENERATED — not an architecture reference
import { BButton, BImg } from 'bootstrap-vue-next'
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { SEND_TYPES, type SendType } from '@/utils/sendTypes'
import IMdiEmailFastOutline from '~icons/mdi/email-fast-outline'
import IMdiLinkVariant from '~icons/mdi/link-variant'
import classes from './NavSend.module.scss'

/**
 * The three tabs of the send page as links to routes of their own. Nothing renders it: the form
 * carries its own switch (TransactionForm). Kept as it was.
 */
export const NavSend = defineComponent({
  name: 'NavSend',
  props: {
    selected: { type: String, default: '' },
    transactionForm: { type: String, default: '' },
    transactionConfirmationLink: { type: String, default: '' },
    sendEmailForm: { type: String, default: '' },
    routeBase: { type: String, default: '' },
  },
  setup(props) {
    const { t } = useI18n()

    const stateClasses = (sendType: SendType) => {
      if (props.selected === sendType) {
        return 'router-link-active router-link-exact-active'
      }
      return ''
    }
    const routeToTab = (route: string) => {
      return `/send/${route}` // props.routeBase + route
    }

    // `block` is no prop of BButton: it lands on the button as the empty attribute it was.
    const block = { block: '' } as object

    return () => (
      <div class={['nav-send', classes.navSend]}>
        <div
          class={[
            'nav-send-btn-wrapper',
            classes.navSendBtnWrapper,
            'bg-209 rounded-26 d-flex bd-highlight mx-xl-6 mx-lg-5 shadow justify-content-between',
          ]}
        >
          <BButton
            to={{ path: routeToTab(props.transactionForm) }}
            class={['nav-send__btn', stateClasses(SEND_TYPES.send)]}
            {...block}
            variant='link'
          >
            <BImg src='/img/svg/gdd_coin_sw.svg' height='20' class='svg-icon' /> {t('send_gdd')}
          </BButton>
          <BButton
            to={{ path: routeToTab(props.transactionConfirmationLink) }}
            class={['nav-send__btn', stateClasses(SEND_TYPES.link)]}
            {...block}
            variant='link'
          >
            <IMdiLinkVariant height='20' class='svg-icon' /> {t('send_per_link')}
          </BButton>
          <BButton
            to={{ path: routeToTab(props.sendEmailForm) }}
            class={['nav-send__btn', stateClasses(SEND_TYPES.email)]}
            {...block}
            variant='link'
          >
            <IMdiEmailFastOutline height='20' class='svg-icon' /> {t('send_email')}
          </BButton>
        </div>
      </div>
    )
  },
})
