// AI-GENERATED — not an architecture reference
import { BButton, BImg } from 'bootstrap-vue-next'
import { computed, defineComponent, type PropType, type VNode } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import IonPersonSharp from '~icons/ion/person-sharp'
import MdiPeopleGroup from '~icons/mdi/people-group'
import classes from './NavContributions.module.scss'

/** A tab of the bar: the route it leads to, its word ready to show, and its sign. */
export type NavTab = { route: string; label: string; icon: () => VNode }

/**
 * The tabs of a page, each a link to a route of its own: the three of the contributions page,
 * or the ones another page hands in as `tabs` (the support page).
 */
export const NavContributions = defineComponent({
  name: 'NavContributions',
  props: {
    allContributions: { type: String, default: '' },
    contribute: { type: String, default: '' },
    ownContributions: { type: String, default: '' },
    routeBase: { type: String, default: '' },
    tabs: { type: Array as PropType<NavTab[]>, default: undefined },
  },
  setup(props) {
    const { t } = useI18n()
    const currentRoute = useRoute()

    const stateClasses = (route: string) => {
      if (currentRoute.path.includes(route)) {
        return 'router-link-active router-link-exact-active'
      }
      return ''
    }
    const routeToTab = (route: string) => props.routeBase + route

    const tabs = computed<NavTab[]>(
      () =>
        props.tabs ?? [
          {
            route: props.contribute,
            label: t('community.submitContribution'),
            icon: () => <BImg src='/img/svg/write.svg' height='20' class='svg-icon' />,
          },
          {
            route: props.ownContributions,
            label: t('community.myContributions'),
            icon: () => <IonPersonSharp class='svg-icon' />,
          },
          {
            route: props.allContributions,
            label: t('community.community'),
            icon: () => <MdiPeopleGroup class='svg-icon' />,
          },
        ],
    )

    // `block` is no prop of BButton: it lands on the button as the empty attribute it was.
    const block = { block: '' } as object

    return () => (
      <div class={['nav-contributions', classes['nav-contributions']]}>
        <div
          class={[
            'nav-contributions-btn-wrapper',
            classes['nav-contributions-btn-wrapper'],
            'bg-209 rounded-26 d-flex bd-highlight mx-xl-6 mx-lg-5 shadow justify-content-between',
          ]}
        >
          {tabs.value.map((tab) => (
            <BButton
              key={tab.route}
              to={{ path: routeToTab(tab.route) }}
              class={[stateClasses(tab.route), 'nav-contributions__btn']}
              {...block}
              variant='link'
            >
              {tab.icon()} {tab.label}
            </BButton>
          ))}
        </div>
      </div>
    )
  },
})
