// AI-GENERATED — not an architecture reference
import { BButton, BLink, type ButtonVariant } from 'bootstrap-vue-next'
import { defineComponent, type PropType, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { CommunitySwitch, type SwitchCommunity } from '@/components/CommunitySwitch'
import { useAuthLinks } from '@/composables/useAuthLinks'
import { useRedeemCommunity } from '@/composables/useRedeemCommunity'
import CONFIG from '@/config'
import classes from './RedeemThanksHaveAccount.module.scss'
import type { RedeemLinkData } from './RedeemThanksPaper'

/**
 * "I already have an account": the way in for somebody who has one, under the thank-you and
 * under the form that opens an account for it. Moved out of RedeemThanks as it stood, so that
 * both places offer the same.
 *
 * Where a link can be redeemed in another community as well (`asksWhere`), the account may be
 * there: the line opens the question where it is, with this community chosen (ZE-020, F13).
 * Elsewhere it leads straight to the sign-in, with the code of the address.
 */
export const RedeemThanksHaveAccount = defineComponent({
  name: 'RedeemThanksHaveAccount',
  props: {
    linkData: { type: Object as PropType<RedeemLinkData>, required: true },
    // The code in the address: the redeem page of another community gets it.
    redeemCode: { type: String, required: true },
    // The page has read the switch already (`REDEEM_SELECT_COMMUNITY`).
    asksWhere: { type: Boolean, default: false },
  },
  setup(props) {
    const { t } = useI18n()
    const { routeWithParamsAndQuery } = useAuthLinks()

    const accountOpen = ref(false)

    // This community first, as the old page had it: without a uuid, which the switch fills in
    // from the list of communities once it has it.
    const recipientCommunity = ref<SwitchCommunity>({
      uuid: '',
      name: CONFIG.COMMUNITY_NAME,
      url: CONFIG.COMMUNITY_URL,
      foreign: false,
    })
    const communities = ref<SwitchCommunity[]>([])

    const chooseCommunity = (community: SwitchCommunity) => {
      recipientCommunity.value = {
        uuid: community.uuid,
        name: community.name,
        url: community.url,
        foreign: community.foreign,
      }
    }

    const { isForeignCommunitySelected, recipientRedeemUrl } = useRedeemCommunity({
      linkData: () => props.linkData,
      redeemCode: () => props.redeemCode,
      recipientCommunity,
    })

    return () => (
      <div class={['redeem-thanks-have-account', classes['redeem-thanks-have-account']]}>
        {/* Where a link can be redeemed in another community as well, the account may be
            there: the line opens the question where it is, with this community chosen.
            Elsewhere it leads straight to the sign-in. */}
        {props.asksWhere ? (
          <>
            <button
              type='button'
              class='redeem-thanks-link redeem-thanks-toggle'
              aria-expanded={accountOpen.value}
              aria-controls='redeem-thanks-account'
              data-test='redeem-thanks-have-account'
              onClick={() => {
                accountOpen.value = !accountOpen.value
              }}
            >
              {t('redeem-thanks.have-account')}
              <svg
                class={['redeem-thanks-caret', { 'is-open': accountOpen.value }]}
                viewBox='0 0 16 16'
                width='12'
                height='12'
                aria-hidden='true'
              >
                <path
                  fill='currentColor'
                  d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'
                />
              </svg>
            </button>
            {accountOpen.value ? (
              <div
                id='redeem-thanks-account'
                class='redeem-thanks-account'
                data-test='redeem-thanks-account'
              >
                <p class='redeem-thanks-account-title' data-test='redeem-thanks-where-account'>
                  {t('redeem-thanks.where-account')}
                </p>
                <CommunitySwitch
                  modelValue={recipientCommunity.value}
                  onUpdate:modelValue={chooseCommunity}
                  onCommunitiesLoaded={(loaded: SwitchCommunity[]) => {
                    communities.value = loaded
                  }}
                />
                {isForeignCommunitySelected.value ? (
                  <BButton
                    variant={'gradido' as ButtonVariant}
                    class='fs-7 redeem-thanks-account-go'
                    href={recipientRedeemUrl.value}
                    data-test='redeem-thanks-forward'
                  >
                    {t('gdd_per_link.to-switch')}
                  </BButton>
                ) : (
                  <BButton
                    variant={'gradido' as ButtonVariant}
                    class='fs-7 redeem-thanks-account-go'
                    to={routeWithParamsAndQuery('Login')}
                    data-test='redeem-thanks-sign-in'
                  >
                    {t('signin')}
                  </BButton>
                )}
                {/* Only where there is another community to choose: with one, the switch
                    shows its name and nothing can be picked. */}
                {communities.value.length > 1 ? (
                  <p
                    class='redeem-thanks-account-hint small'
                    data-test='redeem-thanks-other-community'
                  >
                    {t('redeem-thanks.other-community')}
                  </p>
                ) : null}
              </div>
            ) : null}
          </>
        ) : (
          <BLink
            class='redeem-thanks-link'
            to={routeWithParamsAndQuery('Login')}
            data-test='redeem-thanks-have-account'
          >
            {t('redeem-thanks.have-account')}
          </BLink>
        )}
      </div>
    )
  },
})
