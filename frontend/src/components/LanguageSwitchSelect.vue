<template>
  <div class="language-switch-select">
    <BFormSelect v-model="selected" :options="options" class="selectedLanguage mb-3"></BFormSelect>
  </div>
</template>
<script>
export default {
  name: 'LanguageSwitch',
  props: {
    language: { type: String },
  },
  data() {
    return {
      selected: null,
      options: [
        { value: 'de', text: this.$t('settings.language.de') },
        { value: 'en', text: this.$t('settings.language.en') },
        { value: 'es', text: this.$t('settings.language.es') },
        { value: 'fr', text: this.$t('settings.language.fr') },
        { value: 'nl', text: this.$t('settings.language.nl') },
      ],
    }
  },
  computed: {
    languageObject() {
      return this.selected
    },
  },
  watch: {
    selected() {
      this.$emit('update-language', this.languageObject)
    },
  },
  created() {
    this.selected = this.$store.state.language
  },
}
</script>
