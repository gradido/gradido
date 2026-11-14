// AI-GENERATED — not an architecture reference
import { BImg, BTab, BTabs } from 'bootstrap-vue-next'
import { computed, defineComponent, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { NavContributions, type NavTab } from '@/components/Contributions/NavContributions'
import { SupportForm } from '@/components/Support/SupportForm'
import { SupportTicketList } from '@/components/Support/SupportTicketList'
import { InfoStatistic } from '@/pages/InfoStatistic'
import IonPersonSharp from '~icons/ion/person-sharp'
import IMdiInformation from '~icons/mdi/information'

const TABS = ['write', 'my-requests', 'information']

/**
 * "Support" (SUA-009): writing a request, the member's own requests, and what the page
 * "Information" says -- three tabs in the form of "Schöpfen". Reached by its address until the
 * menu takes it in place of "Information" (K5).
 */
export const Support = defineComponent({
  name: 'Support',
  setup(_, { expose }) {
    const route = useRoute()
    const router = useRouter()
    const { t } = useI18n()

    const tabIndex = ref(0)
    watch(
      () => route.params.tab,
      (tab) => {
        const index = TABS.indexOf(String(tab))
        if (index < 0) {
          router.replace({ path: `/support/${TABS[0]}` })
        }
        tabIndex.value = Math.max(index, 0)
      },
      { immediate: true },
    )

    const tabs = computed<NavTab[]>(() => [
      {
        route: 'write',
        label: t('support.write'),
        icon: () => <BImg src='/img/svg/write.svg' height='20' class='svg-icon' />,
      },
      {
        route: 'my-requests',
        label: t('support.myRequests'),
        icon: () => <IonPersonSharp class='svg-icon' />,
      },
      {
        route: 'information',
        label: t('info'),
        icon: () => <IMdiInformation class='svg-icon' />,
      },
    ])

    const toMyRequests = () => router.push({ path: '/support/my-requests' })

    expose({ tabIndex })

    // `borderless` is no prop of BTabs: it lands on the tabs as the empty attribute it was.
    const borderless = { borderless: '' } as object

    return () => (
      <div class='support-page'>
        <div class='mt--3'>
          <NavContributions tabs={tabs.value} routeBase='/support/' />
          <BTabs modelValue={tabIndex.value} noNavStyle {...borderless} align='center' class='mt-3'>
            <BTab noBody lazy>
              <SupportForm onSent={toMyRequests} />
            </BTab>
            <BTab noBody lazy>
              <SupportTicketList />
            </BTab>
            <BTab noBody lazy>
              {/* The card of the page "Information" pulls itself up by 1rem (`mt--3`) to
                  stand under the page's title; the padding gives that rem back, so under the
                  tabs it stands where the other two do. */}
              <div class='support-information pt-3'>
                <InfoStatistic />
              </div>
            </BTab>
          </BTabs>
        </div>
      </div>
    )
  },
})
