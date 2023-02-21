<template>
  <b-card id="formuserlanguage" class="card-border-radius card-background-gray">
    <div>
      <b-row class="mb-4 text-right">
        <b-col class="text-right">
          <a
            class="cursor-pointer"
            @click="showLanguage ? (showLanguage = !showLanguage) : cancelEdit()"
          >
            <span class="pointer mr-3">{{ $t('settings.language.changeLanguage') }}</span>
            <b-icon v-if="showLanguage" class="pointer ml-3" icon="pencil"></b-icon>
            <b-icon v-else icon="x-circle" class="pointer ml-3" variant="danger"></b-icon>
          </a>
        </b-col>
      </b-row>
    </div>

    <div v-if="showLanguage">
      <b-row class="mb-3">
        <b-col class="col-12">
          <small>
            <b>{{ $t('language') }}</b>
          </small>
        </b-col>
        <!-- eslint-disable-next-line @intlify/vue-i18n/no-dynamic-keys-->
        <b-col class="col-12">{{ $t(buildTagFromLanguageString()) }}</b-col>
      </b-row>
    </div>

    <div v-else>
      <div>
        <b-form @submit.stop.prevent="onSubmit">
          <b-row class="mb-2">
            <b-col class="col-12">
              <small>
                <b>{{ $t('language') }}</b>
              </small>
            </b-col>
            <b-col class="col-12">
              <language-switch-select @update-language="updateLanguage" :language="language" />
            </b-col>
          </b-row>

          <b-row class="text-right">
            <b-col>
              <div class="text-right" ref="submitButton">
                <b-button
                  :variant="loading ? 'light' : 'success'"
                  type="submit"
                  class="mt-4"
                  :disabled="loading"
                >
                  {{ $t('form.save') }}
                </b-button>
              </div>
            </b-col>
          </b-row>
        </b-form>
      </div>
    </div>
  </b-card>
</template>
<script>
import LanguageSwitchSelect from '@/components/LanguageSwitchSelect'
import { updateUserInfos } from '@/graphql/mutations'

export default {
  name: 'UserLanguage',
  components: { LanguageSwitchSelect },
  data() {
    return {
      showLanguage: true,
      language: '',
      loading: true,
    }
  },
  methods: {
    updateLanguage(e) {
      this.language = e
      if (this.language !== this.$store.state.language) {
        this.loading = false
      } else {
        this.loading = true
      }
    },
    cancelEdit() {
      this.showLanguage = true
      this.language = this.$store.state.language
    },
    async onSubmit() {
      this.$apollo
        .mutate({
          mutation: updateUserInfos,
          variables: {
            locale: this.language,
          },
        })
        .then(() => {
          this.$store.commit('language', this.language)
          this.cancelEdit()
          this.toastSuccess(this.$t('settings.language.success'))
        })
        .catch((error) => {
          this.language = this.$store.state.language
          this.toastError(error.message)
        })
    },
    buildTagFromLanguageString() {
      return 'settings.language.' + this.$store.state.language
    },
  },
}
</script>
<style>
.cursor-pointer {
  cursor: pointer;
}
</style>
