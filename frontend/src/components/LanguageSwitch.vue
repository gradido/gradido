<template>
  <div class="language-switch">
    <b-dropdown size="sm" :text="currentLanguage.name + ' - ' + currentLanguage.code">
      <b-dropdown-item
        v-for="lang in locales"
        @click.prevent="saveLocale(lang.code)"
        :key="lang.code"
      >
        {{ lang.name }}
      </b-dropdown-item>
    </b-dropdown>
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
      // if (this.$i18n.locale === locale) return
      this.setLocale(locale)
      if (this.$store.state.gradidoID) {
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
  created() {
    this.setCurrentLanguage()
  },
}
</script>
