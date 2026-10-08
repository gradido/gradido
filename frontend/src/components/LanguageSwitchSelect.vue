<template>
  <div class="language-switch-select">
    <BFormSelect v-model="selected" :options="options" class="selectedLanguage mb-3"></BFormSelect>
  </div>
</template>
<script setup>
import { computed, defineOptions, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'

defineOptions({ name: 'LanguageSwitch' })

defineProps({
  language: { type: String },
})
const emit = defineEmits(['update-language'])

const { t } = useI18n()
const store = useStore()

const selected = ref(null)
const options = [
  { value: 'de', text: t('settings.language.de') },
  { value: 'en', text: t('settings.language.en') },
  { value: 'es', text: t('settings.language.es') },
  { value: 'fr', text: t('settings.language.fr') },
  { value: 'nl', text: t('settings.language.nl') },
]

const languageObject = computed(() => selected.value)

watch(selected, () => {
  emit('update-language', languageObject.value)
})

selected.value = store.state.language
</script>
