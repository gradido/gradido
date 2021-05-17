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
import { localeChanged } from 'vee-validate'
import locales from '../locales/'
import loginAPI from '../apis/loginAPI'

export default {
  name: 'LanguageSwitch',
  data() {
    return {
      locales: locales,
    }
  },
  methods: {
    async setLocale(locale) {
      this.$i18n.locale = locale
      this.$store.commit('language', this.$i18n.locale)
      localeChanged(locale)
    },
    async saveLocale(locale) {
      this.setLocale(locale)
      if (this.$store.state.sessionId && this.$store.state.email) {
        const result = await loginAPI.updateLanguage(
          this.$store.state.sessionId,
          this.$store.state.email,
          locale,
        )
        if (result.success) {
          // toast success message
        } else {
          // toast error message
        }
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
  },
  computed: {
    currentLanguage() {
      let locale = this.$store.state.language || this.getNavigatorLanguage() || 'en'
      let object = this.getLocaleObject(locale)
      if (!object) {
        locale = 'en'
        object = this.getLocaleObject(locale)
      }
      this.setLocale(locale)
      return object
    },
  },
}
</script>
