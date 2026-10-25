// AI-GENERATED — not an architecture reference
import { useMutation } from '@vue/apollo-composable'
import { computed, defineComponent, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppToast } from '@/composables/useToast'
import { updateUserInfos } from '@/graphql/mutations'
import locales from '@/locales/'
import { sessionRuns } from '@/routes/guards'
import { useWalletStore } from '@/store/useWalletStore'
import IBiCaretDownFill from '~icons/bi/caret-down-fill'
import IBiCheck from '~icons/bi/check'
import IBiGlobe2 from '~icons/bi/globe2'
import classes from './LanguageSwitch2.module.css'

type Locale = { name: string; code: string; iso: string; enabled: boolean }

// The plain class names stay beside the module's: the wallet's stylesheets address some of
// them -- `.auth-template .language-switch …` (auth-navbar.scss), the chosen language in the
// dark (`#app.dark-mode .ls-item-active`, gradido-template-dark.scss) -- and the specs find
// the parts by them.
export const LanguageSwitch2 = defineComponent({
  name: 'LanguageSwitch2',
  setup() {
    const store = useWalletStore()
    const { t, locale } = useI18n()
    const { mutate } = useMutation(updateUserInfos)
    const { toastSuccess, toastError } = useAppToast()

    const open = ref(false)
    const root = ref<HTMLElement | null>(null)

    const getLocaleObject = (localeCode: string | null) => {
      return (locales as Locale[]).find((lang) => lang.code === localeCode)
    }

    const currentName = computed(() => {
      const current = getLocaleObject(store.language)
      return current ? current.name : store.language || ''
    })

    // Current language first, the rest sorted alphabetically by autonym (the language's own name).
    const sortedLocales = computed(() => {
      const enabled = (locales as Locale[]).filter((lang) => lang.enabled)
      const current = enabled.find((lang) => lang.code === store.language)
      const rest = enabled
        .filter((lang) => lang.code !== store.language)
        .sort((a, b) => a.name.localeCompare(b.name))
      return current ? [current, ...rest] : rest
    })

    const setLocale = (newLocale: string) => {
      store.setLanguage(newLocale)
    }

    const saveLocale = async (newLocale: string) => {
      if (locale.value === newLocale) {
        return
      }

      setLocale(newLocale)
      // Saved to the account only while the session runs. One that has run out stays in the store
      // until somebody signs in again, and asked with it the server signs the member out: the
      // wallet then sends them to the sign-in page, and what they had typed on a public page --
      // the event-matching builder, the registration -- is gone.
      if (store.gradidoID && sessionRuns(store)) {
        try {
          await mutate({ locale: newLocale })
          toastSuccess(t('settings.language.success'))
        } catch {
          toastError(t('settings.language.error'))
        }
      } else {
        // Not logged in (yet, or any more): remember this deliberate choice so the next login keeps
        // it (and syncs it to the account) instead of overwriting it with the account language.
        store.setPreLoginLanguage(newLocale)
      }
    }

    const select = (newLocale: string) => {
      open.value = false
      saveLocale(newLocale)
    }

    const toggleOpen = () => {
      open.value = !open.value
    }

    const getNavigatorLang = () => {
      const navigatorLang = navigator.language
      if (navigatorLang) {
        return navigatorLang.split('-')[0]
      }
      return navigatorLang
    }

    const setCurrentLanguage = () => {
      let newLocale = store.language || getNavigatorLang() || 'en'
      if (!getLocaleObject(newLocale)) {
        newLocale = 'en'
      }
      setLocale(newLocale)
    }

    const onDocumentClick = (event: MouseEvent) => {
      if (open.value && root.value && !root.value.contains(event.target as Node)) {
        open.value = false
      }
    }

    onMounted(() => {
      setCurrentLanguage()
      document.addEventListener('click', onDocumentClick)
    })

    onUnmounted(() => {
      document.removeEventListener('click', onDocumentClick)
    })

    return () => (
      <div ref={root} class={['language-switch', classes.languageSwitch]}>
        <button
          type='button'
          class={['ls-trigger', classes.lsTrigger]}
          aria-expanded={open.value}
          aria-haspopup='listbox'
          onClick={toggleOpen}
        >
          <IBiGlobe2 class={['ls-globe', classes.lsGlobe]} aria-hidden='true' />
          <span class={['ls-current', classes.lsCurrent]}>{currentName.value}</span>
          <IBiCaretDownFill class={['ls-caret', classes.lsCaret]} aria-hidden='true' />
        </button>
        <ul v-show={open.value} class={['ls-menu', classes.lsMenu]} role='listbox'>
          {sortedLocales.value.map((lang) => (
            <li
              key={lang.code}
              class={[
                'ls-item',
                classes.lsItem,
                {
                  'ls-item-active': lang.code === store.language,
                  [classes.lsItemActive]: lang.code === store.language,
                },
              ]}
              role='option'
              aria-selected={lang.code === store.language}
              onClick={() => select(lang.code)}
            >
              <span class='ls-item-name'>{lang.name}</span>
              {lang.code === store.language ? (
                <IBiCheck class={['ls-check', classes.lsCheck]} aria-hidden='true' />
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    )
  },
})
