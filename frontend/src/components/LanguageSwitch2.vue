<template>
  <div class="language-switch">
    <div v-b-toggle.collapse-1>
      <span
        v-for="lang in locales"
        :key="lang.code"
        class="pointer"
        :class="$store.state.language === lang.code ? 'c-grey' : 'c-blau'"
      >
        <span v-if="lang.code === $store.state.language" class="locales mr-1">
          {{ lang.name }}
        </span>
      </span>
      <!--      <b-icon icon="caret-down-fill" aria-hidden="true"></b-icon>-->
      <IBiCaretDownFill />
    </div>
    <BCollapse id="collapse-1" class="mt-4">
      <span
        v-for="(lang, index) in locales"
        :key="lang.code"
        class="pointer"
        :class="$store.state.language === lang.code ? 'c-grey' : 'c-blau'"
        @click.prevent="saveLocale(lang.code)"
      >
        <span v-if="lang.code !== $store.state.language" v-b-toggle.collapse-1 class="locales">
          {{ lang.name }}
        </span>
        <span
          v-if="
            lang.code !== $store.state.language &&
            (indexOfSelectedLocale !== indexOfLastLocale ||
              (indexOfSelectedLocale === indexOfLastLocale && index !== indexOfSecondLastLocale))
          "
          class="ml-3 mr-3"
        >
          {{ locales.length - 1 > index ? $t('math.pipe') : '' }}
        </span>
      </span>
    </BCollapse>
  </div>
</template>

<!--<script>-->
<!--import locales from '@/locales/'-->
<!--import { updateUserInfos } from '@/graphql/mutations'-->

<!--export default {-->
<!--  name: 'LanguageSwitch',-->
<!--  data() {-->
<!--    return {-->
<!--      locales: locales,-->
<!--      currentLanguage: {},-->
<!--    }-->
<!--  },-->
<!--  methods: {-->
<!--    setLocale(locale) {-->
<!--      this.$store.commit('language', locale)-->
<!--      this.currentLanguage = this.getLocaleObject(locale)-->
<!--    },-->
<!--    async saveLocale(locale) {-->
<!--      if (this.$i18n.locale === locale) return-->
<!--      this.setLocale(locale)-->
<!--      if (this.$store.state.gradidoID) {-->
<!--        this.$apollo-->
<!--          .mutate({-->
<!--            mutation: updateUserInfos,-->
<!--            variables: {-->
<!--              locale: locale,-->
<!--            },-->
<!--          })-->
<!--          .then(() => {-->
<!--            this.toastSuccess(this.$t('settings.language.success'))-->
<!--          })-->
<!--          .catch(() => {-->
<!--            this.toastSuccess(this.$t('error'))-->
<!--          })-->
<!--      }-->
<!--    },-->
<!--    getLocaleObject(code) {-->
<!--      return this.locales.find((l) => l.code === code)-->
<!--    },-->
<!--    getNavigatorLanguage() {-->
<!--      const lang = navigator.language-->
<!--      if (lang) return lang.split('-')[0]-->
<!--      return lang-->
<!--    },-->
<!--    setCurrentLanguage() {-->
<!--      let locale = this.$store.state.language || this.getNavigatorLanguage() || 'en'-->
<!--      let object = this.getLocaleObject(locale)-->
<!--      if (!object) {-->
<!--        locale = 'en'-->
<!--        object = this.getLocaleObject(locale)-->
<!--      }-->
<!--      this.setLocale(locale)-->
<!--      this.currentLanguage = object-->
<!--    },-->
<!--  },-->
<!--  computed: {-->
<!--    indexOfSelectedLocale() {-->
<!--      return this.locales.findIndex((element) => element.code === this.$store.state.language)-->
<!--    },-->
<!--    indexOfSecondLastLocale() {-->
<!--      return this.locales.length - 2-->
<!--    },-->
<!--    indexOfLastLocale() {-->
<!--      return this.locales.length - 1-->
<!--    },-->
<!--  },-->
<!--  created() {-->
<!--    this.setCurrentLanguage()-->
<!--  },-->
<!--}-->
<!--</script>-->

<script setup>
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import { useMutation } from '@vue/apollo-composable'
import { useAppToast } from '../composables/useToast'
import locales from '@/locales/'
import { onMounted, ref, computed } from 'vue'
import { updateUserInfos } from '../graphql/mutations'

const store = useStore()
const { t, locale } = useI18n()
const { mutate } = useMutation(updateUserInfos)
const { toastSuccess, toastError } = useAppToast()

const currentLang = ref({})

const getLocaleObject = (localeCode) => {
  return locales.find((lang) => lang.code === localeCode)
}

const setLocale = (newLocale) => {
  store.commit('language', newLocale)
  currentLang.value = getLocaleObject(newLocale)
}

const saveLocale = async (newLocale) => {
  if (locale.value === newLocale) return

  setLocale(newLocale)
  if (store.state.gradidoID) {
    try {
      await mutate({ locale: newLocale })
      toastSuccess(t('settings.language.success'))
    } catch (error) {
      toastError(t('settings.language.error'))
    }
  }
}

const getNavigatorLang = () => {
  const navigatorLang = navigator.language
  if (navigatorLang) return navigatorLang.split('-')[0]
  return navigatorLang
}

const setCurrentLanguage = () => {
  let newLocale = store.state.language || getNavigatorLang() || 'en'
  let langObject = getLocaleObject(newLocale)
  if (!langObject) {
    newLocale = 'en'
    langObject = getLocaleObject(newLocale)
  }

  setLocale(newLocale)
  currentLang.value = langObject
}

const indexOfSelectedLocale = computed(() => {
  return locales.findIndex((element) => element.code === store.state.language)
})

const indexOfSecondLastLocale = computed(() => {
  return locales.length - 2
})

const indexOfLastLocale = computed(() => {
  return locales.length - 1
})

onMounted(() => {
  setCurrentLanguage()
})
</script>
