<template>
  <div class="component-creation-formular">
    {{ $t('creation_form.form') }}
    <div class="shadow p-3 mb-5 bg-white rounded">
      <b-form ref="creationForm">
        <b-row class="m-4">
          <label>{{ $t('creation_form.select_month') }}</label>
          <b-col class="text-left">
            <b-form-radio
              id="beforeLastMonth"
              v-model="radioSelected"
              :value="beforeLastMonth"
              :disabled="creation[0] === 0"
              size="lg"
              @change="updateRadioSelected(beforeLastMonth, 0, creation[0])"
            >
              <label for="beforeLastMonth">
                {{ beforeLastMonth.short }} {{ creation[0] != null ? creation[0] + ' GDD' : '' }}
              </label>
            </b-form-radio>
          </b-col>
          <b-col>
            <b-form-radio
              id="lastMonth"
              v-model="radioSelected"
              :value="lastMonth"
              :disabled="creation[1] === 0"
              size="lg"
              @change="updateRadioSelected(lastMonth, 1, creation[1])"
            >
              <label for="lastMonth">
                {{ lastMonth.short }} {{ creation[1] != null ? creation[1] + ' GDD' : '' }}
              </label>
            </b-form-radio>
          </b-col>
          <b-col class="text-right">
            <b-form-radio
              id="currentMonth"
              v-model="radioSelected"
              :value="currentMonth"
              :disabled="creation[2] === 0"
              size="lg"
              @change="updateRadioSelected(currentMonth, 2, creation[2])"
            >
              <label for="currentMonth">
                {{ currentMonth.short }} {{ creation[2] != null ? creation[2] + ' GDD' : '' }}
              </label>
            </b-form-radio>
          </b-col>
        </b-row>

        <b-row class="m-4" v-show="createdIndex != null">
          <label>{{ $t('creation_form.select_value') }}</label>
          <div>
            <b-input-group prepend="GDD" append=".00">
              <b-form-input
                type="number"
                v-model="value"
                :min="rangeMin"
                :max="rangeMax"
              ></b-form-input>
            </b-input-group>

            <b-input-group prepend="0" :append="String(rangeMax)" class="mt-3">
              <b-form-input
                type="range"
                v-model="value"
                :min="rangeMin"
                :max="rangeMax"
                step="10"
              ></b-form-input>
            </b-input-group>
          </div>
        </b-row>
        <b-row class="m-4">
          <label>{{ $t('creation_form.enter_text') }}</label>
          <div>
            <b-form-textarea
              id="textarea-state"
              v-model="text"
              :state="text.length >= 10"
              :placeholder="$t('creation_form.min_characters')"
              rows="3"
            ></b-form-textarea>
          </div>
        </b-row>
        <b-row class="m-4">
          <b-col class="text-center">
            <b-button type="reset" variant="danger" @click="$refs.creationForm.reset()">
              {{ $t('creation_form.reset') }}
            </b-button>
          </b-col>
          <b-col class="text-center">
            <div class="text-right">
              <b-button
                v-if="pagetype === 'PageCreationConfirm'"
                type="button"
                variant="success"
                class="test-submit"
                @click="submitCreation"
                :disabled="radioSelected === '' || value <= 0 || text.length < 10"
              >
                {{ $t('creation_form.update_creation') }}
              </b-button>

              <b-button
                v-else
                type="button"
                variant="success"
                class="test-submit"
                @click="submitCreation"
                :disabled="radioSelected === '' || value <= 0 || text.length < 10"
              >
                {{ $t('creation_form.submit_creation') }}
              </b-button>
            </div>
          </b-col>
        </b-row>
      </b-form>
    </div>
  </div>
</template>
<script>
import { verifyLogin } from '../graphql/verifyLogin'
import { createPendingCreation } from '../graphql/createPendingCreation'
import { createPendingCreations } from '../graphql/createPendingCreations'
export default {
  name: 'CreationFormular',
  props: {
    type: {
      type: String,
      required: false,
    },
    pagetype: {
      type: String,
      required: false,
      default: '',
    },
    item: {
      type: Object,
      required: false,
      default() {
        return {}
      },
    },
    items: {
      type: Array,
      required: false,
      default() {
        return []
      },
    },
    creationUserData: {
      type: Object,
      required: false,
      default() {
        return {}
      },
    },
    creation: {
      type: Array,
      required: true,
    },
  },
  data() {
    return {
      radioSelected: '',
      text: !this.creationUserData.memo ? '' : this.creationUserData.memo,
      value: !this.creationUserData.amount ? 0 : this.creationUserData.amount,
      rangeMin: 0,
      rangeMax: 1000,
      currentMonth: {
        short: this.$moment().format('MMMM'),
        long: this.$moment().format('YYYY-MM-DD'),
        year: this.$moment().format('YYYY'),
      },
      lastMonth: {
        short: this.$moment().subtract(1, 'month').format('MMMM'),
        long: this.$moment().subtract(1, 'month').format('YYYY-MM') + '-01',
        year: this.$moment().subtract(1, 'month').format('YYYY'),
      },
      beforeLastMonth: {
        short: this.$moment().subtract(2, 'month').format('MMMM'),
        long: this.$moment().subtract(2, 'month').format('YYYY-MM') + '-01',
        year: this.$moment().subtract(2, 'month').format('YYYY'),
      },
      submitObj: null,
      isdisabled: true,
      createdIndex: null,
    }
  },

  methods: {
    // Auswählen eines Zeitraumes
    updateRadioSelected(name, index, openCreation) {
      this.createdIndex = index
      this.text = this.$t('creation_form.creation_for') + ' ' + name.short + ' ' + name.year
      // Wenn Mehrfachschöpfung
      if (this.type === 'massCreation') {
        // An Creation.vue emitten und radioSelectedMass aktualisieren
        this.$emit('update-radio-selected', [name, index])
      } else if (this.type === 'singleCreation') {
        this.rangeMin = 0
        // Der maximale offene Betrag an GDD die für ein User noch geschöpft werden kann
        this.rangeMax = openCreation
      }
    },
    submitCreation() {
      if (this.type === 'massCreation') {
        // Die anzahl der Mitglieder aus der Mehrfachschöpfung
        const i = Object.keys(this.items).length
        // hinweis das eine Mehrfachschöpfung ausgeführt wird an (Anzahl der MItgleider an die geschöpft wird)
        // eslint-disable-next-line no-console
        console.log('SUBMIT CREATION => ' + this.type + ' >> für VIELE ' + i + ' Mitglieder')
        this.submitObj = []
        this.items.forEach((item) => {
          this.submitObj.push({
            email: item.email,
            creationDate: this.radioSelected.long,
            amount: Number(this.value),
            memo: this.text,
            moderator: Number(this.$store.state.moderator.id),
          })
        })
        // eslint-disable-next-line no-console
        console.log('MehrfachSCHÖPFUNG ABSENDEN FÜR >> ' + i + ' Mitglieder')
        this.$apollo
          .mutate({
            mutation: createPendingCreations,
            variables: {
              pendingCreations: this.submitObj,
            },
            fetchPolicy: 'no-cache',
          })
          .then((result) => {
            this.$store.commit(
              'openCreationsPlus',
              result.data.createPendingCreations.successfulCreation.length,
            )
            if (result.data.createPendingCreations.failedCreation.length > 0) {
              result.data.createPendingCreations.failedCreation.forEach((failed) => {
                this.$toasted.error('Could not created PendingCreation for ' + failed)
              })
            }
            this.$emit('remove-all-bookmark')
          })
          .catch((error) => {
            this.$toasted.error(error.message)
          })
      } else if (this.type === 'singleCreation') {
        this.submitObj = {
          email: this.item.email,
          creationDate: this.radioSelected.long,
          amount: Number(this.value),
          memo: this.text,
          moderator: Number(this.$store.state.moderator.id),
        }

        this.$apollo
          .mutate({
            mutation: createPendingCreation,
            variables: this.submitObj,
          })
          .then((result) => {
            this.$emit('update-user-data', this.item, result.data.createPendingCreation)
            this.$toasted.success(
              this.$t('creation_form.toasted', {
                value: this.value,
                email: this.item.email,
              }),
            )
            this.$store.commit('openCreationsPlus', 1)
            this.submitObj = null
            this.createdIndex = null
            // das creation Formular reseten
            this.$refs.creationForm.reset()
            // Den geschöpften Wert auf o setzen
            this.value = 0
          })
          .catch((error) => {
            this.$toasted.error(error.message)
            this.submitObj = null
            // das creation Formular reseten
            this.$refs.creationForm.reset()
            // Den geschöpften Wert auf o setzen
            this.value = 0
          })
      }
    },
    searchModeratorData() {
      this.$apollo
        .query({ query: verifyLogin })
        .then((result) => {
          this.$store.commit('moderator', result.data.verifyLogin)
        })
        .catch(() => {
          this.$store.commit('moderator', { id: 0, name: 'Test Moderator' })
        })
    },
  },
  created() {
    this.searchModeratorData()
  },
}
</script>
