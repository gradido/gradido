<template>
  <div
    id="change_language"
    class="bg-transparent pt-3 pb-3"
    style="background-color: #ebebeba3 !important"
  >
    <b-container>
      <div>
        <b-row class="mb-4 text-right">
          <b-col class="text-right">
            <a @click="!editLanguage ? (editLanguage = !editLanguage) : cancelEdit()">
              <span class="pointer mr-3">{{ $t('form.changeLanguage') }}</span>
              <b-icon v-if="!editPassword" class="pointer ml-3" icon="pencil" />
              <b-icon v-else icon="x-circle" class="pointer ml-3" variant="danger"></b-icon>
            </a>
          </b-col>
        </b-row>
      </div>
      <div v-if="editLanguage">
        <b-form @submit.stop.prevent="handleSubmit(onSubmit)">
          <b-row class="mb-2">
            <b-col>
              <language-switch-select @update-language="updateLanguage" :language="language" />
            </b-col>
          </b-row>

          <b-row class="text-right">
            <b-col>
              <div class="text-right">
                <b-button type="submit" variant="primary" class="mt-4">
                  {{ $t('form.save') }}
                </b-button>
              </div>
            </b-col>
          </b-row>
        </b-form>
      </div>
      <div>Language in store: {{ $store.state.language }}</div>
      <div>Language in data: {{ this.language }}</div>
    </b-container>
  </div>
</template>
<script>
import LanguageSwitchSelect from '../../../components/LanguageSwitchSelect.vue'
import { updateUserInfos } from '../../../graphql/queries'

export default {
  name: 'FormUserLanguage',
  components: { LanguageSwitchSelect },
  data() {
    return {
      editLanguage: false,
      language: '',
      register: false,
    }
  },
  methods: {
    updateLanguage(e) {
      this.language = e
    },
    cancelEdit() {
      this.editLanguage = false
    },
    async onSubmit() {
      this.$apollo
        .query({
          query: updateUserInfos,
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
