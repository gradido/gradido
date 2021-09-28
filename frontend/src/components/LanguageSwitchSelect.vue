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
        { value: null, text: this.$t('settings.language.select_language') },
        { value: 'de', text: this.$t('settings.language.de') },
        { value: 'en', text: this.$t('settings.language.en') },
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
