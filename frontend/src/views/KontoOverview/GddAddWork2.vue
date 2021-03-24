<template>
  <div>
    <b-tabs content-class="mt-3" fill>
      <b-tab :title="names.thisMonth" active>
        <b-row>
          <b-col cols="3">
            <base-input label="Arbeitstunden">
              <b-form-input type="number" placeholder="23" />
            </base-input>
            <base-input label="Datum / Zeitraum">
              <flat-pickr
                class="form-control"
                v-model="date"
                :config="config"
              ></flat-pickr>
            </base-input>
          </b-col>
          <b-col cols="9">
            <base-input label="Arbeitsreport">
              <textarea
                class="form-control"
                rows="5"
                @focus="textFocus"
              ></textarea>
            </base-input>
          </b-col>
        </b-row>
        <b-row>
          <b-col>
            <button
              class="btn btn-info text-right"
              @click.prevent="newWorkForm"
            >
              weiteren Report hinzufügen
            </button>
          </b-col>
          <b-col>
            <div class="text-right">
              <button
                class="btn btn-info text-right"
                @click.prevent="submitForm2"
              >
                save new Report
              </button>
            </div>
          </b-col>
        </b-row>
      </b-tab>

      <b-tab :title="names.lastMonth">
        <b-row>
          <b-col cols="3">
            <base-input label="Arbeitstunden">
              <b-form-input type="number" placeholder="23" />
            </base-input>
            <base-input label="Datum / Zeitraum">
              <flat-pickr
                class="form-control"
                v-model="date"
                :config="lastConfig"
              ></flat-pickr>
            </base-input>
          </b-col>
          <b-col cols="9">
            <base-input label="Arbeitsreport">
              <textarea
                class="form-control"
                rows="5"
                @focus="textFocus"
              ></textarea>
            </base-input>
          </b-col>
        </b-row>
        <b-row>
          <b-col>
            <button
              class="btn btn-warning text-right"
              @click.prevent="newWorkForm"
            >
              + weiteren Report hinzufügen
            </button>
          </b-col>
          <b-col>
            <div class="text-right">
              <button
                class="btn btn-info text-right"
                @click.prevent="submitForm2"
              >
                save new Report
              </button>
            </div>
          </b-col>
        </b-row>
        <hr />
        <pre>Selected date is - {{ date }}</pre>
        <p>{{ days.lastMonth }} Days in {{ names.lastMonth }}</p>

        <p>
          Du hast diesen Monat
          {{ stundenSumme > 0 ? "schon " : "noch keine" }}
          {{ stundenSumme > 0 ? "" + stundenSumme : "" }}
          Stunden eingetragen
        </p>
      </b-tab>

      <b-tab :title="names.beforLastMonth">
        <b-row>
          <b-col cols="3">
            <base-input label="Arbeitstunden">
              <b-form-input type="number" placeholder="23" />
            </base-input>
            <base-input label="Datum / Zeitraum">
              <flat-pickr
                class="form-control"
                v-model="date"
                :config="beforLastConfig"
              ></flat-pickr>
            </base-input>
          </b-col>
          <b-col cols="9">
            <base-input label="Arbeitsreport">
              <textarea
                class="form-control"
                rows="5"
                @focus="textFocus"
              ></textarea>
            </base-input>
          </b-col>
        </b-row>
        <b-row>
          <b-col>
            <button
              class="btn btn-warning text-right"
              @click.prevent="newWorkForm"
            >
              + weiteren Report hinzufügen
            </button>
          </b-col>
          <b-col>
            <div class="text-right">
              <button
                class="btn btn-info text-right"
                @click.prevent="submitForm3"
              >
                save new Report
              </button>
            </div>
          </b-col>
        </b-row>
        <hr />
        <pre>Selected date is - {{ date }}</pre>
        <p>{{ days.beforLastMonth }} Days in {{ names.beforLastMonth }}</p>
        <p>Du hast noch keine Einträge</p>
      </b-tab>
    </b-tabs>
  </div>
</template>

<script>
import flatPickr from "vue-flatpickr-component";
import "flatpickr/dist/flatpickr.css";

export default {
  name: "GDDAddWork2",
  components: { flatPickr },
  data() {
    return {
      date: null,
      config: {
        altInput: false,
        dateFormat: "d-m-Y",
        minDate: this.$moment()
          .startOf("month")
          .format("DD.MM.YYYY"),
        maxDate: this.$moment().format("DD.MM.YYYY"),
        mode: "range"
      },
      lastConfig: {
        altInput: false,
        dateFormat: "d-m-Y",
        minDate: this.$moment()
          .month(this.$moment().month() - 1)
          .startOf("month")
          .format("DD.MM.YYYY"),
        maxDate: this.$moment()
          .month(this.$moment().month() - 1)
          .endOf("month")
          .format("DD.MM.YYYY"),
        mode: "range"
      },
      beforLastConfig: {
        altInput: false,
        dateFormat: "d-m-Y",
        minDate: this.$moment()
          .month(this.$moment().month() - 2)
          .startOf("month")
          .format("DD.MM.YYYY"),
        maxDate: this.$moment()
          .month(this.$moment().month() - 2)
          .endOf("month")
          .format("DD.MM.YYYY"),
        mode: "range"
      },
      index: 0,
      form: [],
      stundenSumme: 0,
      messages: [],
      submitted: false,
      days: {
        thisMonth: this.$moment()
          .month(this.$moment().month())
          .daysInMonth(),
        lastMonth: this.$moment()
          .month(this.$moment().month() - 1)
          .daysInMonth(),
        beforLastMonth: this.$moment()
          .month(this.$moment().month() - 2)
          .daysInMonth()
      },
      names: {
        thisMonth: this.$moment()
          .month(this.$moment().month())
          .format("MMMM"),
        lastMonth: this.$moment()
          .month(this.$moment().month() - 1)
          .format("MMMM"),
        beforLastMonth: this.$moment()
          .month(this.$moment().month() - 2)
          .format("MMMM")
      }
    };
  },
  created() {},
  watch: {
    $form: function() {
      stunden(this.form);
    }
  },
  methods: {
    getTR(m, i) {
      console.log(m + "-" + i);
    },
    stunden(hour, i, mon) {
      let n = 0;
      console.log("stunden(form)=>", hour);
      console.log("stunden(i)=>", i);
      console.log("stunden(mon)=>", mon);

      console.log("this.stundenSumme start=> ", this.stundenSumme);
      this.stundenSumme = 0;
      console.log("arr.length => ", this.form.length);
      for (n; n < this.form.length; n++) {
        console.log(">arr[n]=> ", this.form[n]);
        if (this.form[n] > 0) {
          this.stundenSumme += parseInt(this.form[n]);
        }
      }
      this.messages.push({
        id: this.index,
        MonthsNumber: mon,
        DaysNumber: i,
        HoursNumber: hour,
        DestinationText: "",
        TextDecoded: ""
      });
      this.index++;
      console.log("this.stundenSumme ende=> ", this.stundenSumme);
    },
    addNewMessage: function() {
      this.messages.push({
        DaysNumber: "",
        TextDecoded: ""
      });
    },
    deleteNewMessage: function(event) {
      console.log("deleteNewMessage:event) => ", event);
      //console.log("deleteNewMessage:this.events.splice(this.event) => ", this.events.splice(this.event))
      this.form.splice(event, null);
      this.messages.splice(index, 1);
      this.index--;
    },
    submitForm: function(e) {
      console.log(this.messages);

      this.messages = [{ DaysNumber: "", TextDecoded: "" }];
      this.submitted = true;
    },
    submitForm2() {
      console.log("submitForm2 TODO");
    },
    submitForm3() {
      console.log("submitForm3 TODO");
    },
    textFocus() {
      console.log("textFocus TODO");
    },
    newWorkForm() {
      console.log("newWorkForm TODO");
    }
  }
};
</script>
