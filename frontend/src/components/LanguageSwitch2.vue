<template>
  <div ref="root" class="language-switch">
    <button
      type="button"
      class="ls-trigger"
      :aria-expanded="open"
      aria-haspopup="listbox"
      @click="toggleOpen"
    >
      <IBiGlobe2 class="ls-globe" aria-hidden="true" />
      <span class="ls-current">{{ currentName }}</span>
      <IBiCaretDownFill class="ls-caret" aria-hidden="true" />
    </button>
    <ul v-show="open" class="ls-menu" role="listbox">
      <li
        v-for="lang in sortedLocales"
        :key="lang.code"
        class="ls-item"
        :class="{ 'ls-item-active': lang.code === store.state.language }"
        role="option"
        :aria-selected="lang.code === store.state.language"
        @click="select(lang.code)"
      >
        <span class="ls-item-name">{{ lang.name }}</span>
        <IBiCheck v-if="lang.code === store.state.language" class="ls-check" aria-hidden="true" />
      </li>
    </ul>
  </div>
</template>

<script setup>
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import { useMutation } from '@vue/apollo-composable'
import { useAppToast } from '@/composables/useToast'
import locales from '@/locales/'
import { onMounted, onUnmounted, ref, computed } from 'vue'
import { updateUserInfos } from '@/graphql/mutations'
import { setLocale as setValidationI18nLocale } from '@vee-validate/i18n'

const store = useStore()
const { t, locale } = useI18n()
const { mutate } = useMutation(updateUserInfos)
const { toastSuccess, toastError } = useAppToast()

const open = ref(false)
const root = ref(null)

const getLocaleObject = (localeCode) => {
  return locales.find((lang) => lang.code === localeCode)
}

const currentName = computed(() => {
  const current = getLocaleObject(store.state.language)
  return current ? current.name : store.state.language || ''
})

// Current language first, the rest sorted alphabetically by autonym (the language's own name).
const sortedLocales = computed(() => {
  const enabled = locales.filter((lang) => lang.enabled)
  const current = enabled.find((lang) => lang.code === store.state.language)
  const rest = enabled
    .filter((lang) => lang.code !== store.state.language)
    .sort((a, b) => a.name.localeCompare(b.name))
  return current ? [current, ...rest] : rest
})

const setLocale = (newLocale) => {
  store.commit('language', newLocale)
}

const saveLocale = async (newLocale) => {
  if (locale.value === newLocale) return

  setLocale(newLocale)
  setValidationI18nLocale(newLocale)
  if (store.state.gradidoID) {
    try {
      await mutate({ locale: newLocale })
      toastSuccess(t('settings.language.success'))
    } catch (error) {
      toastError(t('settings.language.error'))
    }
  } else {
    // Not logged in yet: remember this deliberate choice so the next login keeps it
    // (and syncs it to the account) instead of overwriting it with the account language.
    store.commit('setPreLoginLanguage', newLocale)
  }
}

const select = (newLocale) => {
  open.value = false
  saveLocale(newLocale)
}

const toggleOpen = () => {
  open.value = !open.value
}

const getNavigatorLang = () => {
  const navigatorLang = navigator.language
  if (navigatorLang) return navigatorLang.split('-')[0]
  return navigatorLang
}

const setCurrentLanguage = () => {
  let newLocale = store.state.language || getNavigatorLang() || 'en'
  if (!getLocaleObject(newLocale)) {
    newLocale = 'en'
  }
  setLocale(newLocale)
}

const onDocumentClick = (event) => {
  if (open.value && root.value && !root.value.contains(event.target)) {
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
</script>

<style scoped>
.language-switch {
  position: relative;
  display: inline-block;
}

.ls-trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: none;
  padding: 0;
  font: inherit;
  color: inherit;
  line-height: 1.2;
  cursor: pointer;
}

.ls-trigger:hover .ls-current {
  text-decoration: underline;
}

.ls-globe {
  font-size: 1.15em;
  opacity: 0.7;
}

.ls-caret {
  font-size: 0.9em;
  opacity: 0.6;
}

.ls-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 1060;
  min-width: 180px;
  max-height: 280px;
  overflow-y: auto;
  margin: 0;
  padding: 4px;
  list-style: none;
  background: #fff;
  border: 0.5px solid rgb(0 0 0 / 15%);
  border-radius: 10px;
  box-shadow: 0 8px 24px rgb(0 0 0 / 12%);
}

.ls-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 6px;
  white-space: nowrap;
  cursor: pointer;
}

.ls-item:hover {
  background: #f2f4f6;
}

.ls-item-active {
  background: #e9f1fb;
  color: #185fa5;
}

.ls-check {
  font-size: 1em;
}
</style>
