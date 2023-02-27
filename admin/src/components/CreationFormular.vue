<template>
  <div class="component-creation-formular">
    {{ $t('creation_form.form') }}
    <div class="shadow p-3 mb-5 bg-white rounded">
      <b-form ref="creationForm">
        <div class="ml-4">
          <label>{{ $t('creation_form.select_month') }}</label>
        </div>
        <b-row class="ml-4">
          <b-form-radio-group
            v-model="selected"
            :options="radioOptions"
            value-field="item"
            text-field="name"
            name="month-selection"
          ></b-form-radio-group>
        </b-row>
        <b-row class="m-4" v-show="selected !== ''">
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
        <div class="m-4">
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
        </div>
        <b-row class="m-4">
          <b-col class="text-left">
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
                :disabled="selected === '' || value <= 0 || text.length < 10"
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
import { adminCreateContribution } from '../graphql/adminCreateContribution'
import { creationMonths } from '../mixins/creationMonths'
export default {
  name: 'CreationFormular',
  mixins: [creationMonths],
  props: {
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
      text: !this.creationUserData.memo ? '' : this.creationUserData.memo,
      value: !this.creationUserData.amount ? 0 : this.creationUserData.amount,
      rangeMin: 0,
      rangeMax: 1000,
      selected: '',
    }
  },
  methods: {
    updateRadioSelected(name) {
      // do we want to reset the memo everytime the month changes?
      this.text = this.$t('creation_form.creation_for') + ' ' + name.short + ' ' + name.year
      this.rangeMin = 0
      this.rangeMax = name.creation
    },
    submitCreation() {
      this.$apollo
        .mutate({
          mutation: adminCreateContribution,
          variables: {
            email: this.item.email,
            creationDate: this.selected.date,
            amount: Number(this.value),
            memo: this.text,
          },
        })
        .then((result) => {
          this.$emit('update-user-data', this.item, result.data.adminCreateContribution)
          this.$store.commit('openCreationsPlus', 1)
          this.toastSuccess(
            this.$t('creation_form.toasted', {
              value: this.value,
              email: this.item.email,
            }),
          )
          // what is this? Tests says that this.text is not reseted
          this.$refs.creationForm.reset()
          this.value = 0
        })
        .catch((error) => {
          this.toastError(error.message)
          this.$refs.creationForm.reset()
          this.value = 0
        })
    },
  },
  watch: {
    selected() {
      this.updateRadioSelected(this.selected)
    },
  },
}
</script>
