<template>
  <div class="language-switch">
    <span
      v-for="(lang, index) in locales"
      @click.prevent="saveLocale(lang.code)"
      :key="lang.code"
      class="pointer pr-2"
      :class="$store.state.language === lang.code ? 'c-grey' : 'c-blau'"
    >
      <span v-if="index <= 1" class="locales">{{ lang.name }}</span>
      <span v-if="index <= 1" class="ml-3">
        {{ locales.length - 1 > index ? $t('math.pipe') : '' }}
      </span>
    </span>
    <b-icon v-b-toggle.collapse-1 icon="caret-down-fill" aria-hidden="true"></b-icon>
    <b-collapse id="collapse-1" class="mt-2">
      <span
        v-for="(lang, index) in locales"
        @click.prevent="saveLocale(lang.code)"
        :key="lang.code"
        class="pointer pr-2"
        :class="$store.state.language === lang.code ? 'c-grey' : 'c-blau'"
      >
        <span v-if="index > 1" class="locales">{{ lang.name }}</span>
        <span v-if="index > 1" class="ml-3">
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
  created() {
    this.setCurrentLanguage()
  },
}
</script>
