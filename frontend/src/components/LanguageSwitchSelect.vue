<template>
  <div class="language-switch-select">
    <b-form-select
      v-model="selected"
      :options="options"
      class="selectedLanguage mb-3"
    ></b-form-select>
  </div>
</template>
<script>
export default {
  name: 'LanguageSwitch',
  data() {
    return {
      selected: null,
      options: [
        { value: 'de', text: this.$t('settings.language.de') },
        { value: 'en', text: this.$t('settings.language.en') },
        { value: 'es', text: this.$t('settings.language.es') },
      ],
    }
  },
  props: {
    language: { type: String },
  },
  created() {
    this.selected = this.$store.state.language
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
}
</script>
