<template>
  <b-card
    id="formuserlanguage"
    class="bg-transparent"
    style="background-color: #ebebeba3 !important"
  >
    <div>
      <b-row class="mb-4 text-right">
        <b-col class="text-right">
          <a @click="showLanguage ? (showLanguage = !showLanguage) : cancelEdit()">
            <span class="pointer mr-3">{{ $t('form.changeLanguage') }}</span>
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
        <b-col class="col-12">{{ $store.state.language }}</b-col>
      </b-row>
    </div>

    <div v-else>
      <div>
        <b-form @submit.stop.prevent="handleSubmit(onSubmit)">
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
                  :variant="loading ? 'default' : 'success'"
                  @click="onSubmit"
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
import LanguageSwitchSelect from '../../../components/LanguageSwitchSelect.vue'
import { updateUserInfos } from '../../../graphql/mutations'

export default {
  name: 'FormUserLanguage',
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
    },

    async onSubmit() {
      this.$apollo
        .mutate({
          mutation: updateUserInfos,
          variables: {
            language: this.$store.state.language,
          },
        })
        .then(() => {
          this.cancelEdit()
        })
        .catch((error) => {
          this.$toasted.error(error.message)
        })
    },
  },
}
</script>
