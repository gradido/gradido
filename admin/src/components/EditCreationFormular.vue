<template>
  <div class="component-edit-creation-formular">
    <div class="shadow p-3 mb-5 bg-white rounded">
      <b-form ref="updateCreationForm">
        <b-row class="m-4">
          <label>{{ $t('creation_form.select_month') }}</label>
          <b-col class="text-left">
            <b-form-radio
              id="beforeLastMonth"
              v-model="radioSelected"
              :value="beforeLastMonth"
              :disabled="selectedOpenCreationAmount[0] === 0"
              size="lg"
              @change="updateRadioSelected(beforeLastMonth, 0, selectedOpenCreationAmount[0])"
            >
              <label for="beforeLastMonth">
                {{ beforeLastMonth.short }}
                {{
                  selectedOpenCreationAmount[0] != null
                    ? selectedOpenCreationAmount[0] + ' GDD'
                    : ''
                }}
              </label>
            </b-form-radio>
          </b-col>
          <b-col>
            <b-form-radio
              id="lastMonth"
              v-model="radioSelected"
              :value="lastMonth"
              :disabled="selectedOpenCreationAmount[1] === 0"
              size="lg"
              @change="updateRadioSelected(lastMonth, 1, selectedOpenCreationAmount[1])"
            >
              <label for="lastMonth">
                {{ lastMonth.short }}
                {{
                  selectedOpenCreationAmount[1] != null
                    ? selectedOpenCreationAmount[1] + ' GDD'
                    : ''
                }}
              </label>
            </b-form-radio>
          </b-col>
          <b-col class="text-right">
            <b-form-radio
              id="currentMonth"
              v-model="radioSelected"
              :value="currentMonth"
              :disabled="selectedOpenCreationAmount[2] === 0"
              size="lg"
              @change="updateRadioSelected(currentMonth, 2, selectedOpenCreationAmount[2])"
            >
              <label for="currentMonth">
                {{ currentMonth.short }}
                {{
                  selectedOpenCreationAmount[2] != null
                    ? selectedOpenCreationAmount[2] + ' GDD'
                    : ''
                }}
              </label>
            </b-form-radio>
          </b-col>
        </b-row>

        <b-row class="m-4">
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
              placeholder="Mindestens 10 Zeichen eingeben"
              rows="3"
            ></b-form-textarea>
          </div>
        </b-row>
        <b-row class="m-4">
          <b-col class="text-center">
            <b-button type="reset" variant="danger" @click="$refs.updateCreationForm.reset()">
              {{ $t('creation_form.reset') }}
            </b-button>
          </b-col>
          <b-col class="text-center">
            <div class="text-right">
              <b-button
                type="button"
                variant="success"
                class="test-submit"
                @click="submitCreation"
                :disabled="radioSelected === '' || value <= 0 || text.length < 10"
              >
                {{ $t('creation_form.update_creation') }}
              </b-button>
            </div>
          </b-col>
        </b-row>
      </b-form>
    </div>
  </div>
</template>
<script>
import { updatePendingCreation } from '../graphql/updatePendingCreation'
export default {
  name: 'EditCreationFormular',
  props: {
    item: {
      type: Object,
      required: true,
    },
    row: {
      type: Object,
      required: false,
      default() {
        return {}
      },
    },
    creationUserData: {
      type: Object,
      required: true,
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
      },
      lastMonth: {
        short: this.$moment().subtract(1, 'month').format('MMMM'),
        long: this.$moment().subtract(1, 'month').format('YYYY-MM') + '-01',
      },
      beforeLastMonth: {
        short: this.$moment().subtract(2, 'month').format('MMMM'),
        long: this.$moment().subtract(2, 'month').format('YYYY-MM') + '-01',
      },
      submitObj: null,
      isdisabled: true,
      createdIndex: null,
      selectedOpenCreationAmount: {},
    }
  },

  methods: {
    updateRadioSelected(name, index, openCreation) {
      this.createdIndex = index
      this.rangeMin = 0
      this.rangeMax = this.creation[index]
    },
    submitCreation() {
      this.submitObj = {
        id: this.item.id,
        email: this.item.email,
        creationDate: this.radioSelected.long,
        amount: Number(this.value),
        memo: this.text,
        moderator: Number(this.$store.state.moderator.id),
      }

      // hinweis das eine ein einzelne Schöpfung abgesendet wird an (email)
      this.$apollo
        .mutate({
          mutation: updatePendingCreation,
          variables: this.submitObj,
        })
        .then((result) => {
          this.$emit('update-user-data', this.item, result.data.updatePendingCreation.creation)
          this.$emit('update-creation-data', {
            amount: Number(result.data.updatePendingCreation.amount),
            date: result.data.updatePendingCreation.date,
            memo: result.data.updatePendingCreation.memo,
            moderator: Number(result.data.updatePendingCreation.moderator),
            row: this.row,
          })
          this.$toasted.success(
            this.$t('creation_form.toasted_update', {
              value: this.value,
              email: this.item.email,
            }),
          )
          this.submitObj = null
          this.createdIndex = null
          // das creation Formular reseten
          this.$refs.updateCreationForm.reset()
          // Den geschöpften Wert auf o setzen
          this.value = 0
        })
        .catch((error) => {
          this.$toasted.error(error.message)
          this.submitObj = null
          // das creation Formular reseten
          this.$refs.updateCreationForm.reset()
          // Den geschöpften Wert auf o setzen
          this.value = 0
        })
    },
  },
  created() {
    if (this.creationUserData.date) {
      switch (this.$moment(this.creationUserData.date).format('MMMM')) {
        case this.currentMonth.short:
          this.createdIndex = 2
          this.radioSelected = this.currentMonth
          break
        case this.lastMonth.short:
          this.createdIndex = 1
          this.radioSelected = this.lastMonth
          break
        case this.beforeLastMonth.short:
          this.createdIndex = 0
          this.radioSelected = this.beforeLastMonth
          break
        default:
          throw new Error('Something went wrong')
      }
      this.selectedOpenCreationAmount[this.createdIndex] =
        this.creation[this.createdIndex] + this.creationUserData.amount
      this.rangeMax = this.selectedOpenCreationAmount[this.createdIndex]
    }
  },
}
</script>
