<template>
  <div class="language-switch">
    <b-dropdown size="sm" :text="$t('language') + ' - ' + $i18n.locale">
      <b-dropdown-item @click.prevent="setLocale('de')">Deutsch</b-dropdown-item>
      <b-dropdown-item @click.prevent="setLocale('en')">English</b-dropdown-item>
    </b-dropdown>
  </div>
</template>
<script>
import { localeChanged } from 'vee-validate'

export default {
  name: 'language-switch',
  methods: {
    setLocale(locale) {
      this.$i18n.locale = locale
      this.$store.commit('language', this.$i18n.locale)
      localeChanged(locale)
    },
  },
}
</script>
