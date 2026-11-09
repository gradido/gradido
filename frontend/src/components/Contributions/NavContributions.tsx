// AI-GENERATED — not an architecture reference
import { BButton, BImg } from 'bootstrap-vue-next'
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import IonPersonSharp from '~icons/ion/person-sharp'
import MdiPeopleGroup from '~icons/mdi/people-group'
import classes from './NavContributions.module.scss'

/** The three tabs of the contributions page, each a link to a route of its own. */
export const NavContributions = defineComponent({
  name: 'NavContributions',
  props: {
    allContributions: { type: String, default: '' },
    contribute: { type: String, default: '' },
    ownContributions: { type: String, default: '' },
    routeBase: { type: String, default: '' },
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
          <BButton
            to={{ path: routeToTab(props.contribute) }}
            class={[stateClasses(props.contribute), 'nav-contributions__btn']}
            {...block}
            variant='link'
          >
            <BImg src='/img/svg/write.svg' height='20' class='svg-icon' />{' '}
            {t('community.submitContribution')}
          </BButton>
          <BButton
            to={{ path: routeToTab(props.ownContributions) }}
            class={[stateClasses(props.ownContributions), 'nav-contributions__btn']}
            {...block}
            variant='link'
          >
            <IonPersonSharp class='svg-icon' /> {t('community.myContributions')}
          </BButton>
          <BButton
            to={{ path: routeToTab(props.allContributions) }}
            class={[stateClasses(props.allContributions), 'nav-contributions__btn']}
            {...block}
            variant='link'
          >
            <MdiPeopleGroup class='svg-icon' /> {t('community.community')}
          </BButton>
        </div>
      </div>
    )
  },
})
