<template>
  <div class="component-edit-creation-formular">
    <div class="shadow p-3 mb-5 bg-white rounded">
      <BForm ref="updateCreationForm">
        <div class="ml-4">
          <label>{{ $t('creation_form.select_month') }}</label>
        </div>
        <BRow class="m-4">
          <BFormRadioGroup
            v-model="selected"
            :options="radioOptions"
            value-field="item"
            text-field="name"
            name="month-selection"
            :disabled="true"
          ></BFormRadioGroup>
        </BRow>
        <div class="m-4">
          <label>{{ $t('creation_form.select_value') }}</label>
          <div>
            <BInputGroup prepend="GDD" append=".00">
              <b-form-input
                v-model="value"
                type="number"
                :min="rangeMin"
                :max="rangeMax"
              ></b-form-input>
            </BInputGroup>
            <BInputGroup prepend="0" :append="String(rangeMax)" class="mt-3">
              <b-form-input
                v-model="value"
                type="range"
                :min="rangeMin"
                :max="rangeMax"
                step="10"
              ></b-form-input>
            </BInputGroup>
          </div>
        </div>
        <div class="m-4">
          <label>{{ $t('creation_form.enter_text') }}</label>
          <div>
            <BFormTextarea
              id="textarea-state"
              v-model="text"
              :state="text.length >= 10"
              placeholder="Mindestens 10 Zeichen eingeben"
              rows="3"
            ></BFormTextarea>
          </div>
        </div>
        <BRow class="m-4">
          <BCol class="text-left">
            <BButton type="reset" variant="danger" @click="$refs.updateCreationForm.reset()">
              {{ $t('creation_form.reset') }}
            </BButton>
          </BCol>
          <BCol class="text-center">
            <div class="text-right">
              <BButton
                type="button"
                variant="success"
                class="test-submit"
                :disabled="selected === '' || value <= 0 || text.length < 10"
                @click="submitCreation"
              >
                {{ $t('creation_form.update_creation') }}
              </BButton>
            </div>
          </BCol>
        </BRow>
      </BForm>
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
  },
  emits: ['update-creation-data'],
  data() {
    return {
      text: !this.creationUserData.memo ? '' : this.creationUserData.memo,
      value: !this.creationUserData.amount ? 0 : Number(this.creationUserData.amount),
      rangeMin: 0,
      selected: this.selectedComputed, // TODO investigate this one and apply solution based on good practices
      userId: this.item.userId,
    }
  },
  computed: {
    creationIndex() {
      const month = this.$d(new Date(this.item.contributionDate), 'month')
      return this.radioOptions.findIndex((obj) => {
        return obj.item.short === month
      })
    },
    selectedComputed() {
      return this.radioOptions[this.creationIndex].item
    },
    rangeMax() {
      return Number(this.creation[this.creationIndex]) + Number(this.item.amount)
    },
  },
  watch: {
    selectedComputed() {
      this.selected = this.selectedComputed
    },
  },
  methods: {
    submitCreation() {
      this.$apollo
        .mutate({
          mutation: adminUpdateContribution,
          variables: {
            id: this.item.id,
            creationDate: this.selected.date,
            amount: Number(this.value),
            memo: this.text,
          },
        })
        .then((result) => {
          this.$emit('update-creation-data')
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
        .finally(() => {
          this.$apollo.queries.OpenCreations.refetch()
        })
    },
  },
}
</script>
