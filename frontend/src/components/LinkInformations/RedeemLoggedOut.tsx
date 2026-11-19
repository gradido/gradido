// AI-GENERATED — not an architecture reference
import { BButton, BCard, BCol, BRow, type ButtonVariant } from 'bootstrap-vue-next'
import { defineComponent, type PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthLinks } from '@/composables/useAuthLinks'
import { RedeemInformation, type RedeemInformationLinkData } from './RedeemInformation'

export const RedeemLoggedOut = defineComponent({
  name: 'RedeemLoggedOut',
  props: {
    linkData: { type: Object as PropType<RedeemInformationLinkData>, required: true },
  },
  setup(props) {
    const { t } = useI18n()
    const { routeWithParamsAndQuery } = useAuthLinks()

    return () => (
      <div class='redeem-logged-out'>
        <RedeemInformation linkData={props.linkData} />

        <BCard>
          <div class='mb-2'>
            <h2>{t('gdd_per_link.redeem')}</h2>
          </div>

          <BRow>
            <BCol sm='12' md='6'>
              <p>{t('gdd_per_link.no-account')}</p>
              <BButton variant='primary' to={routeWithParamsAndQuery('Register')}>
                {t('gdd_per_link.to-register')}
              </BButton>
            </BCol>
            <BCol sm='12' md='6' class='mt-4 mt-lg-0'>
              <p>{t('gdd_per_link.has-account')}</p>
              <BButton variant={'gradido' as ButtonVariant} to={routeWithParamsAndQuery('Login')}>
                {t('gdd_per_link.to-login')}
              </BButton>
            </BCol>
          </BRow>
        </BCard>
      </div>
    )
  },
})
