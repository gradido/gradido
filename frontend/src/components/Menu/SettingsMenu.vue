<!-- AI-GENERATED — not an architecture reference -->
<template>
  <!-- ⭐ ONE list for both screens. Bernd, after using it: the settings looked like every
       other page, and one hardly noticed one was in them. A row list with a rule under each
       entry, a state beside it and a chevron at the end looks like nothing else in the
       wallet -- so the form itself says "this is a different place", which no heading can
       do on its own. The phone had it that way already; the desk gets the same, only with
       the section standing open beside it. -->
  <div class="settings-menu">
    <router-link
      v-for="entry in entries"
      :key="entry.to"
      :to="entry.to"
      class="settings-menu-row"
      :class="{
        'is-current': entry.to === $route.path || (entry.first && $route.path === '/settings'),
      }"
      :data-test="`settings-menu-${entry.test}`"
    >
      <settings-menu-icon :name="entry.test" class="settings-menu-icon" />
      <span class="settings-menu-label">
        {{ entry.label }}
        <span v-if="entry.note" class="settings-menu-note">{{ entry.note }}</span>
      </span>
      <span
        v-if="entry.state"
        class="settings-menu-state"
        :data-test="`settings-state-${entry.test}`"
      >
        {{ entry.state }}
      </span>
      <i-mdi-chevron-right class="settings-menu-chevron" />
    </router-link>
  </div>
</template>
<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import { useQuery } from '@vue/apollo-composable'
import CONFIG from '@/config'
import { thankYouCardSettings, thankYouCards } from '@/graphql/thankYouCard.graphql'
import SettingsMenuIcon from './SettingsMenuIcon.vue'

const { t } = useI18n()
const store = useStore()

// Read once: the flags are baked in at build time, they cannot change while the app runs.
const isCommunityService = CONFIG.GMS_ACTIVE || CONFIG.HUMHUB_ACTIVE

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

const thankYouCardState = computed(() => {
  // ⛔ Nothing at all while the answers are on their way, and nothing if they do not arrive.
  // The naive form said "off" in the meantime -- and "off" beside a card that is switched ON
  // is worse than an empty space: a state that is briefly wrong is still read as a state, and
  // this line exists so that one look is enough.
  if (loadingSettings.value || loadingCards.value) return null
  if (errorSettings.value || errorCards.value) return null
  if (!cardSettings.value?.thankYouCardSettings) return t('settings.menu.state.off')
  const list = cards.value?.thankYouCards ?? []
  // Blocked is worth its own word: the function is on, but the card in the wallet does not
  // pay any more -- and that is exactly what one comes here to check.
  if (list.length > 0 && list.every((card) => card.blockedAt))
    return t('settings.menu.state.blocked')
  return t('settings.menu.state.on')
})

const onOff = (value) => (value ? t('settings.menu.state.on') : t('settings.menu.state.off'))

// Every label is a literal t() call: the i18n lint counts only literal keys, and a table of
// key strings would report every one of them as unused.
const entries = computed(() => {
  const list = [
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
      state: onOff(store.state.avatarVisibleToMembers),
    },
    {
      to: '/settings/notifications',
      test: 'notifications',
      label: t('settings.menu.notifications'),
      state: onOff(store.state.newsletterState),
    },
  ]
  // The area is on its way out with the matching, and where neither service is switched on it
  // does not exist at all -- so the entry goes, and the route is not registered either.
  // ⚠️ No state: there are TWO switches behind it (GMS and HumHub), and one word cannot say
  // what two switches stand at.
  if (isCommunityService) {
    list.push({
      to: '/settings/communities',
      test: 'communities',
      label: t('settings.community'),
      note: t('settings.menu.communities-note'),
    })
  }
  return list
})
</script>
<style scoped>
.settings-menu-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.9rem 1rem;
  border-bottom: 1px solid var(--border);
  color: var(--text) !important;
  text-decoration: none;
}

.settings-menu-row:last-child {
  border-bottom: 0;
}

.settings-menu-row.is-current {
  font-weight: bold;
  background-color: var(--surface-muted);
}

.settings-menu-icon {
  flex: 0 0 auto;
  opacity: 0.75;
}

.settings-menu-label {
  flex: 1 1 auto;
  min-width: 0;
}

.settings-menu-note {
  display: block;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.settings-menu-state {
  flex: 0 0 auto;
  font-size: 0.875rem;
  color: var(--text-muted);
}

.settings-menu-chevron {
  flex: 0 0 auto;
  color: var(--text-muted);
}
</style>
