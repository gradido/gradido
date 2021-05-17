<template>
  <div class="language-switch">
    <b-dropdown size="sm" :text="currentLanguageName + ' - ' + currentLanguage">
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
    setLocale(locale) {
      this.$i18n.locale = locale
      this.$store.commit('language', this.$i18n.locale)
      localeChanged(locale)
    },
    async saveLocale(locale) {
      this.setLocale(locale)
      if (this.$store.state.sessionId && this.$store.state.email) {
        const result = loginAPI.updateLanguage(
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
  },
  computed: {
    currentLanguage() {
      const locale = this.$store.state.language || navigator.language || 'en'
      this.setLocale(this.$store.state.language)
      return locale
    },
    currentLanguageName() {
      return this.locales.find((l) => l.code === this.currentLanguage).name
    },
  },
}
</script>
