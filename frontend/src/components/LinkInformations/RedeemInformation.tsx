// AI-GENERATED — not an architecture reference
import { BCard, type ColorVariant } from 'bootstrap-vue-next'
import { defineComponent, type PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFilters } from '@/composables/useFilters'
import CONFIG from '@/config'

/** What the card reads of a contribution link. */
export type RedeemInformationLinkData = { amount: string | number; memo: string }

export const RedeemInformation = defineComponent({
  name: 'RedeemInformation',
  props: {
    linkData: { type: Object as PropType<RedeemInformationLinkData>, required: true },
  },
  setup(props) {
    const { t } = useI18n()
    const filters = useFilters()

    return () => (
      <div class='redeem-information'>
        {/* A contribution link: the member's links come as a thank-you (RedeemThanks). */}
        <BCard bgVariant={'muted' as ColorVariant} textVariant='dark' borderVariant='info'>
          {props.linkData.amount === '' ? (
            <h1>{t('gdd_per_link.redeemlink-error')}</h1>
          ) : (
            <h1>
              {CONFIG.COMMUNITY_NAME} {t('contribution-link.thanksYouWith')}{' '}
              {filters.GDD(props.linkData.amount)}
            </h1>
          )}
          <b>{props.linkData.memo}</b>
        </BCard>
      </div>
    )
  },
})
