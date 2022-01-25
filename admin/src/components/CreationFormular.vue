<template>
  <div class="component-creation-formular">
    {{ $t('creation_form.form') }}
    <div class="shadow p-3 mb-5 bg-white rounded">
      <b-form ref="creationForm">
        <b-row>
          <label>{{ $t('creation_form.select_month') }}</label>
          <b-form-radio-group
            v-model="selected"
            :options="radioOptions"
            value-field="item"
            text-field="name"
            name="month-selection"
          ></b-form-radio-group>
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
                :disabled="selected === '' || value <= 0 || text.length < 10"
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
import { createPendingCreation } from '../graphql/createPendingCreation'
import { createPendingCreations } from '../graphql/createPendingCreations'
import { creationMonths } from '../mixins/creationMonths'
export default {
  name: 'CreationFormular',
  mixins: [creationMonths],
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
      submitObj: null,
      isdisabled: true,
      createdIndex: null,
      now: Date.now(),
      selected: '',
    }
  },
  methods: {
    // Auswählen eines Zeitraumes
    updateRadioSelected(name) {
      this.createdIndex = this.radioOptions.findIndex((obj) => name === obj.item)
      this.text = this.$t('creation_form.creation_for') + ' ' + name.short + ' ' + name.year
      // Wenn Mehrfachschöpfung
      if (this.type === 'massCreation') {
        // An Creation.vue emitten und radioSelectedMass aktualisieren
        this.$emit('update-radio-selected', [name, this.createdIndex])
      } else if (this.type === 'singleCreation') {
        this.rangeMin = 0
        // Der maximale offene Betrag an GDD die für ein User noch geschöpft werden kann
        this.rangeMax = name.creation
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
            creationDate: this.radioSelected.date,
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
          creationDate: this.selected.date,
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
  },
  watch: {
    selected() {
      this.updateRadioSelected(this.selected)
    },
  },
  computed: {
    currentMonth() {
      return {
        short: this.$d(this.now, 'month'),
        long: this.$d(this.now, 'short'),
        year: this.$d(this.now, 'year'),
        date: this.$d(this.now, 'short', 'en'),
      }
    },
    lastMonth() {
      const now = new Date(this.now)
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      return {
        short: this.$d(lastMonth, 'month'),
        long: this.$d(lastMonth, 'short'),
        year: this.$d(lastMonth, 'year'),
        date: this.$d(lastMonth, 'short', 'en'),
      }
    },
    beforeLastMonth() {
      const now = new Date(this.now)
      const beforeLastMonth = new Date(now.getFullYear(), now.getMonth() - 2, 1)
      return {
        short: this.$d(beforeLastMonth, 'month'),
        long: this.$d(beforeLastMonth, 'short'),
        year: this.$d(beforeLastMonth, 'year'),
        date: this.$d(beforeLastMonth, 'short', 'en'),
      }
    },
    radioOptions() {
      return this.creationDateObjects.map((obj, idx) => {
        return {
          item: { ...obj, creation: this.creation[idx] },
          name: obj.short + (this.creation[idx] ? ' ' + this.creation[idx] + ' GDD' : ''),
        }
      })
    },
    creationObjects() {
      return this.creationDateObjects.map((obj, idx) => {
        return {
          ...obj,
          creation: this.creation[idx],
          selected: '',
        }
      })
    },
  },
}
</script>
