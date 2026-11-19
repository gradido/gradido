// AI-GENERATED — not an architecture reference
import { BFormSelect } from 'bootstrap-vue-next'
import { computed, defineComponent, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useWalletStore } from '@/store/useWalletStore'

export const LanguageSwitchSelect = defineComponent({
  name: 'LanguageSwitch',
  props: {
    language: { type: String },
  },
  emits: ['update-language'],
  setup(_props, { emit }) {
    const { t } = useI18n()
    const store = useWalletStore()

    const selected = ref<string | null>(null)
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

    selected.value = store.language

    return () => (
      <div class='language-switch-select'>
        <BFormSelect
          modelValue={selected.value}
          options={options}
          class='selectedLanguage mb-3'
          onUpdate:modelValue={(value) => {
            selected.value = value as string | null
          }}
        />
      </div>
    )
  },
})
