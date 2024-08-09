<template>
  <b-card id="formuserlanguage" class="card-border-radius card-background-gray">
    <div>
      <BRow class="mb-4 text-right">
        <BCol class="text-right">
          <a
            class="cursor-pointer"
            @click="showLanguage ? (showLanguage = !showLanguage) : cancelEdit()"
          >
            <span class="pointer mr-3">{{ $t('settings.language.changeLanguage') }}</span>
            <b-icon v-if="showLanguage" class="pointer ml-3" icon="pencil"></b-icon>
            <b-icon v-else icon="x-circle" class="pointer ml-3" variant="danger"></b-icon>
          </a>
        </BCol>
      </BRow>
    </div>

    <div v-if="showLanguage">
      <BRow class="mb-3">
        <BCol class="col-12">
          <small>
            <b>{{ $t('language') }}</b>
          </small>
        </BCol>
        <!-- eslint-disable-next-line @intlify/vue-i18n/no-dynamic-keys-->
        <BCol class="col-12">{{ $t(buildTagFromLanguageString()) }}</BCol>
      </BRow>
    </div>

    <div v-else>
      <div>
        <b-form @submit.stop.prevent="onSubmit">
          <BRow class="mb-2">
            <BCol class="col-12">
              <small>
                <b>{{ $t('language') }}</b>
              </small>
            </BCol>
            <BCol class="col-12">
              <language-switch-select :language="language" @update-language="updateLanguage" />
            </BCol>
          </BRow>

          <BRow class="text-right">
            <BCol>
              <div ref="submitButton" class="text-right">
                <b-button
                  :variant="loading ? 'light' : 'success'"
                  type="submit"
                  class="mt-4"
                  :disabled="loading"
                >
                  {{ $t('form.save') }}
                </b-button>
              </div>
            </BCol>
          </BRow>
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
