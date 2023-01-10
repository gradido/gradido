<template>
  <div class="language-switch">
    <div v-b-toggle.collapse-1>
      <span
        v-for="lang in locales"
        :key="lang.code"
        class="pointer"
        :class="$store.state.language === lang.code ? 'c-grey' : 'c-blau'"
      >
        <span v-if="lang.code === $store.state.language" class="locales mr-1">
          {{ lang.name }}
        </span>
      </span>
      <b-icon icon="caret-down-fill" aria-hidden="true"></b-icon>
    </div>
    <b-collapse id="collapse-1" class="mt-4">
      <span
        v-for="(lang, index) in locales"
        @click.prevent="saveLocale(lang.code)"
        :key="lang.code"
        class="pointer"
        :class="$store.state.language === lang.code ? 'c-grey' : 'c-blau'"
      >
        <span v-if="lang.code !== $store.state.language" v-b-toggle.collapse-1 class="locales">
          {{ lang.name }}
        </span>
        <span
          v-if="
            lang.code !== $store.state.language &&
            (indexOfSelectedLocale !== indexOfLastLocale ||
              (indexOfSelectedLocale === indexOfLastLocale && index !== indexOfSecondLastLocale))
          "
          class="ml-3 mr-3"
        >
          {{ locales.length - 1 > index ? $t('math.pipe') : '' }}
        </span>
      </span>
    </b-collapse>
  </div>
</template>

<script>
import locales from '@/locales/'
import { updateUserInfos } from '@/graphql/mutations'

export default {
  name: 'LanguageSwitch',
  data() {
    return {
      locales: locales,
      currentLanguage: {},
    }
  },
  methods: {
    setLocale(locale) {
      this.$store.commit('language', locale)
      this.currentLanguage = this.getLocaleObject(locale)
    },
    async saveLocale(locale) {
      if (this.$i18n.locale === locale) return
      this.setLocale(locale)
      if (this.$store.state.email) {
        this.$apollo
          .mutate({
            mutation: updateUserInfos,
            variables: {
              locale: locale,
            },
          })
          .then(() => {
            // toast success message
          })
          .catch(() => {
            // toast error message
          })
      }
    },
    getLocaleObject(code) {
      return this.locales.find((l) => l.code === code)
    },
    getNavigatorLanguage() {
      const lang = navigator.language
      if (lang) return lang.split('-')[0]
      return lang
    },
    setCurrentLanguage() {
      let locale = this.$store.state.language || this.getNavigatorLanguage() || 'en'
      let object = this.getLocaleObject(locale)
      if (!object) {
        locale = 'en'
        object = this.getLocaleObject(locale)
      }
      this.setLocale(locale)
      this.currentLanguage = object
    },
  },
  computed: {
    indexOfSelectedLocale() {
      return this.locales.findIndex((element) => element.code === this.$store.state.language)
    },
    indexOfSecondLastLocale() {
      return this.locales.length - 2
    },
    indexOfLastLocale() {
      return this.locales.length - 1
    },
  },
  created() {
    this.setCurrentLanguage()
  },
}
</script>
