<template>
  <div class="component-edit-creation-formular">
    <div class="shadow p-3 mb-5 bg-white rounded">
      <b-form ref="updateCreationForm">
        <div class="ml-4">
          <label>{{ $t('creation_form.select_month') }}</label>
        </div>
        <b-row class="m-4">
          <b-form-radio-group
            v-model="selected"
            :options="radioOptions"
            value-field="item"
            text-field="name"
            name="month-selection"
          ></b-form-radio-group>
        </b-row>
        <div class="m-4">
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
        </div>
        <div class="m-4">
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
        </div>
        <b-row class="m-4">
          <b-col class="text-left">
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
                :disabled="selected === '' || value <= 0 || text.length < 10"
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
import { adminUpdateContribution } from '../graphql/adminUpdateContribution'
import { creationMonths } from '../mixins/creationMonths'

export default {
  name: 'EditCreationFormular',
  mixins: [creationMonths],
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
      text: !this.creationUserData.memo ? '' : this.creationUserData.memo,
      value: !this.creationUserData.amount ? 0 : Number(this.creationUserData.amount),
      rangeMin: 0,
      rangeMax: 1000,
      selected: '',
    }
  },
  methods: {
    submitCreation() {
      this.$apollo
        .mutate({
          mutation: adminUpdateContribution,
          variables: {
            id: this.item.id,
            email: this.item.email,
            creationDate: this.selected.date,
            amount: Number(this.value),
            memo: this.text,
          },
        })
        .then((result) => {
          this.$emit('update-user-data', this.item, result.data.adminUpdateContribution.creation)
          this.$emit('update-creation-data', {
            amount: Number(result.data.adminUpdateContribution.amount),
            date: result.data.adminUpdateContribution.date,
            memo: result.data.adminUpdateContribution.memo,
            row: this.row,
          })
          this.toastSuccess(
            this.$t('creation_form.toasted_update', {
              value: this.value,
              email: this.item.email,
            }),
          )
          // das creation Formular reseten
          this.$refs.updateCreationForm.reset()
          // Den geschöpften Wert auf o setzen
          this.value = 0
        })
        .catch((error) => {
          this.toastError(error.message)
          // das creation Formular reseten
          this.$refs.updateCreationForm.reset()
          // Den geschöpften Wert auf o setzen
          this.value = 0
        })
    },
  },
  created() {
    if (this.creationUserData.date) {
      const month = this.$d(new Date(this.creationUserData.date), 'month')
      const index = this.radioOptions.findIndex((obj) => obj.item.short === month)
      this.selected = this.radioOptions[index].item
      this.rangeMax = Number(this.creation[index]) + Number(this.creationUserData.amount)
    }
  },
}
</script>
