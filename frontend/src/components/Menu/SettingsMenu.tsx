// AI-GENERATED — not an architecture reference
import { useQuery } from '@vue/apollo-composable'
import { computed, defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRoute } from 'vue-router'
import CONFIG from '@/config'
import { firstCreationStatus } from '@/graphql/firstCreation.graphql'
import { thankYouCardSettings, thankYouCards } from '@/graphql/thankYouCard.graphql'
import { useWalletStore } from '@/store/useWalletStore'
import IMdiChevronRight from '~icons/mdi/chevron-right'
import classes from './SettingsMenu.module.scss'
import { SettingsMenuIcon } from './SettingsMenuIcon'

interface Entry {
  to: string
  test: string
  label: string
  first?: boolean
  state?: string | null
}

export const SettingsMenu = defineComponent({
  name: 'SettingsMenu',
  setup() {
    const { t } = useI18n()
    const store = useWalletStore()
    const route = useRoute()

    // Read once: the flag is baked in at build time, it cannot change while the app runs.
    const isCirclesActive = CONFIG.HUMHUB_ACTIVE

    /**
     * The only state that is not already in the store. Two small queries, asked once when the
     * settings are entered -- `cache-first` is Apollo's default, so the second copy of this list
     * (the phone list and the desk menu are both in the DOM at /settings, one of them hidden by
     * a breakpoint) reads the cache instead of asking again.
     */
    const {
      result: cardSettings,
      loading: loadingSettings,
      error: errorSettings,
    } = useQuery(thankYouCardSettings)
    const { result: cards, loading: loadingCards, error: errorCards } = useQuery(thankYouCards)

    const thankYouCardState = computed<string | null>(() => {
      // ⛔ Nothing at all while the answers are on their way, and nothing if they do not arrive.
      // The naive form said "off" in the meantime -- and "off" beside a card that is switched ON
      // is worse than an empty space: a state that is briefly wrong is still read as a state, and
      // this line exists so that one look is enough.
      if (loadingSettings.value || loadingCards.value) {
        return null
      }
      if (errorSettings.value || errorCards.value) {
        return null
      }
      if (!cardSettings.value?.thankYouCardSettings) {
        return t('settings.menu.state.off')
      }
      const list = cards.value?.thankYouCards ?? []
      // Blocked is worth its own word: the function is on, but the card in the wallet does not
      // pay any more -- and that is exactly what one comes here to check.
      if (list.length > 0 && list.every((card: { blockedAt: unknown }) => card.blockedAt)) {
        return t('settings.menu.state.blocked')
      }
      return t('settings.menu.state.on')
    })

    const onOff = (value: unknown) =>
      value ? t('settings.menu.state.on') : t('settings.menu.state.off')

    /**
     * "Nachrichten" holds two switches since #4007: the information mails (`newsletterState`) and the
     * transfers in the chat and by mail (`transfersInChat`, on unless switched off -- as the page
     * reads it). One word says them only where they agree: "Ein" for both on, "Aus" for both off.
     * Where they differ, no word (Bernd, 30.09.2026): "Aus" beside a switch that is on is worse than
     * an empty space, for the reason the thank-you card's state gives above.
     */
    const notificationsState = computed(() => {
      const mails = Boolean(store.newsletterState)
      const transfers = store.transfersInChat !== false
      return mails === transfers ? onOff(mails) : null
    })

    /**
     * The function-test area (ES-014). Its own query rather than a third field on the two
     * above, because it is the first creation's status this asks -- the same answer the window
     * in the layout reads, so on the second of the two menus in the DOM and on the window this
     * costs nothing new.
     *
     * ⚠️ `cache-and-network`, like everywhere this query is read: it takes no arguments, so
     * every member on this browser shares one cache key.
     */
    const { result: firstCreation } = useQuery(firstCreationStatus, null, {
      fetchPolicy: 'cache-and-network',
    })
    const showFunctionTests = computed(
      () =>
        store.role === 'ADMIN' &&
        firstCreation.value?.firstCreationStatus?.functionTestsEnabled === true,
    )

    // Every label is a literal t() call: the i18n lint counts only literal keys, and a table of
    // key strings would report every one of them as unused.
    const entries = computed(() => {
      const list: Entry[] = [
        {
          to: '/settings/account',
          test: 'account',
          label: t('settings.menu.account'),
          // /settings shows this section on a wide screen, so it is the one to mark there.
          first: true,
        },
        {
          to: '/settings/appearance',
          test: 'appearance',
          label: t('settings.menu.appearance'),
        },
        {
          to: '/settings/gradido-card',
          test: 'gradido-card',
          label: t('settings.menu.gradido-card'),
        },
        {
          to: '/settings/thank-you-card',
          test: 'thank-you-card',
          label: t('thank-you-card.name'),
          state: thankYouCardState.value,
        },
        {
          to: '/settings/visibility',
          test: 'visibility',
          label: t('settings.menu.visibility'),
          state: onOff(store.avatarVisibleToMembers),
        },
        {
          to: '/settings/notifications',
          test: 'notifications',
          label: t('settings.menu.notifications'),
          state: notificationsState.value,
        },
      ]
      // The circles only: the old GMS member search that shared this area is gone, and its
      // settings are the matching's (home tab). Where HumHub is not switched on the area does not
      // exist at all -- so the entry goes, and the route is not registered either.
      //
      // ⛔ No "(will be dropped later)". Such a note is written for US, but it would stand in the
      // MEMBER's menu, where it only raises a question nobody can answer: dropped why? A screen is
      // not a notebook. (Bernd, 24.08.2026.)
      if (isCirclesActive) {
        list.push({
          to: '/settings/communities',
          test: 'communities',
          label: t('settings.community'),
        })
      }
      // ES-014: a tool, not a setting, and last in the list for that reason. Both halves have
      // to hold -- the server offers the area at all, and this account may use it. The route is
      // registered whatever the answer (routes.js says why), so the page turns anybody else
      // away and the backend refuses the mutation regardless; this line is only the way in.
      if (showFunctionTests.value) {
        list.push({
          to: '/settings/function-tests',
          test: 'function-tests',
          label: t('settings.menu.function-tests'),
        })
      }
      return list
    })

    // ⭐ ONE list for both screens. Bernd, after using it: the settings looked like every
    // other page, and one hardly noticed one was in them. A row list with a rule under each
    // entry, a state beside it and a chevron at the end looks like nothing else in the
    // wallet -- so the form itself says "this is a different place", which no heading can
    // do on its own. The phone had it that way already; the desk gets the same, only with
    // the section standing open beside it.
    return () => (
      <div class={['settings-menu', classes['settings-menu']]}>
        {entries.value.map((entry) => (
          <RouterLink
            key={entry.to}
            to={entry.to}
            class={[
              'settings-menu-row',
              {
                'is-current':
                  entry.to === route.path || (entry.first && route.path === '/settings'),
              },
            ]}
            data-test={`settings-menu-${entry.test}`}
          >
            <SettingsMenuIcon name={entry.test} class='settings-menu-icon' />
            <span class='settings-menu-text'>
              <span class='settings-menu-label'>{entry.label}</span>
              {entry.state ? (
                <span class='settings-menu-state' data-test={`settings-state-${entry.test}`}>
                  {entry.state}
                </span>
              ) : null}
            </span>
            <IMdiChevronRight class='settings-menu-chevron' />
          </RouterLink>
        ))}
      </div>
    )
  },
})
