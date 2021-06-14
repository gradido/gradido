<template>
  <div class="pt-4 pb-4">
    <b-tabs content-class="mt-3" class="display-4" fill>
      <b-tab :title="names.thisMonth" active>
        <b-row>
          <b-col lg="3">
            <b-input :label="$t('communitys.form.hours')">
              <b-form-input
                type="number"
                size="lg"
                placeholder="23"
                style="font-size: xx-large; padding-left: 5px"
              />
            </b-input>
            <b-input :label="$t('communitys.form.date_period')">
              <flat-pickr
                class="form-control"
                v-model="date"
                :config="config"
                style="font-size: 0.5em; padding-left: 5px"
              ></flat-pickr>
            </b-input>
          </b-col>
          <b-col lg="9">
            <b-input :label="$t('communitys.form.hours_report')">
              <textarea
                class="form-control"
                rows="5"
                @focus="textFocus"
                style="font-size: x-large; padding-left: 20px"
              ></textarea>
            </b-input>
          </b-col>
        </b-row>
        <b-row>
          <div ref="mydiv"></div>
        </b-row>
        <b-row>
          <b-col md="6">
            <b-button @click.prevent="newWorkForm" variant="warning">
              + {{ $t('communitys.form.more_hours') }}
            </b-button>
          </b-col>
          <b-col md="6" class="text-right">
            <b-button variant="success" @click.prevent="submitForm2">
              {{ $t('communitys.form.submit') }}
            </b-button>
          </b-col>
        </b-row>
      </b-tab>

      <b-tab :title="names.lastMonth"></b-tab>

      <b-tab :title="names.beforLastMonth"></b-tab>
    </b-tabs>
  </div>
</template>

<script>
export default {
  name: 'GDDAddWork2',
  data() {
    return {
      date: null,
      config: {
        altInput: false,
        dateFormat: 'd-m-Y',
        minDate: this.$moment().startOf('month').format('DD.MM.YYYY'),
        maxDate: this.$moment().format('DD.MM.YYYY'),
        mode: 'range',
      },
      index: 0,
      form: [],
      stundenSumme: 0,
      messages: [],
      submitted: false,
      days: {
        thisMonth: this.$moment().month(this.$moment().month()).daysInMonth(),
        lastMonth: this.$moment()
          .month(this.$moment().month() - 1)
          .daysInMonth(),
        beforLastMonth: this.$moment()
          .month(this.$moment().month() - 2)
          .daysInMonth(),
      },
      names: {
        thisMonth: this.$moment().month(this.$moment().month()).format('MMMM'),
        lastMonth: this.$moment()
          .month(this.$moment().month() - 1)
          .format('MMMM'),
        beforLastMonth: this.$moment()
          .month(this.$moment().month() - 2)
          .format('MMMM'),
      },
      formular: null,
    }
  },
  created() {},
  watch: {
    $form: function () {
      this.stunden(this.form)
    },
  },
  mounted() {},
  methods: {
    stunden(hour, i, mon) {
      let n = 0
      this.stundenSumme = 0
      for (n; n < this.form.length; n++) {
        if (this.form[n] > 0) {
          this.stundenSumme += parseInt(this.form[n])
        }
      }
      this.messages.push({
        id: this.index,
        MonthsNumber: mon,
        DaysNumber: i,
        HoursNumber: hour,
        DestinationText: '',
        TextDecoded: '',
      })
      this.index++
    },
    addNewMessage: function () {
      this.messages.push({
        DaysNumber: '',
        TextDecoded: '',
      })
    },
    deleteNewMessage: function (event) {
      this.form.splice(event, null)
      this.messages.splice(this.index, 1)
      this.index--
    },
    submitForm: function (e) {
      // console.log('submitForm')
      this.messages = [{ DaysNumber: '', TextDecoded: '' }]
      this.submitted = true
    },
    textFocus() {
      // console.log('textFocus TODO')
    },
    newWorkForm() {
      this.formular = `  
          <b-col lg="3">
            <b-input label="Stunden">
              <b-form-input
                type="number"
                size="lg"
                placeholder="0"
                style="font-size: xx-large; padding-left: 20px"
              />
            </b-input>
            <b-input label="Datum / Zeitraum">
              <flat-pickr
                class="form-control"
                v-model="date"
                :config="config"
                style="font-size: xx-large; padding-left: 20px"
              ></flat-pickr>
            </b-input>
          </b-col>
          <b-col lg="9">
            <b-input label="Arbeitsreport">
              <textarea
                class="form-control"
                rows="5"
                @focus="textFocus"
                style="font-size: x-large; padding-left: 20px"
              ></textarea>
            </b-input>
          </b-col>
       `

      // console.log('newWorkForm TODO')
      const myElement = this.$refs.mydiv
      myElement.append(this.formular)
      this.$compile(myElement)
      this.formular = null
    },
  },
}
</script>
