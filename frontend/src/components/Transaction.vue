<template>
  <div>
    <div class="list-group">
      <div class="list-group-item gdt-transaction-list-item" v-b-toggle="'a' + date + ''">
        <!-- icon  -->
        <div class="text-right" style="position: absolute">
          <b-icon
            :icon="getLinesByType(gdtEntryType).icon"
            :class="getLinesByType(gdtEntryType).iconclasses"
          ></b-icon>
        </div>

        <!-- collaps Button  -->
        <div class="text-right" style="width: 96%; position: absolute">
          <b-button class="btn-sm">
            <b>i</b>
          </b-button>
        </div>

        <!-- type  -->
        <b-row>
          <div class="col-6 text-right">
            {{ getLinesByType(gdtEntryType).description }}
          </div>
          <div class="col-6">
            {{ getLinesByType(gdtEntryType).descriptiontext }}
          </div>
        </b-row>

        <!-- credit -->
        <b-row>
          <div class="col-6 text-right">
            {{ $t('gdt.credit') }}
          </div>
          <div class="col-6">
            {{ getLinesByType(gdtEntryType).credittext }}
          </div>
        </b-row>

        <!-- Message-->
        <b-row v-if="comment && gdtEntryType !== 7">
          <div class="col-6 text-right">
            {{ $t('form.memo') }}
          </div>
          <div class="col-6">
            {{ comment }}
          </div>
        </b-row>

        <!-- date-->
        <b-row class="gdt-list-row text-header">
          <div class="col-6 text-right">
            {{ $t('form.date') }}
          </div>
          <div class="col-6">
            {{ $d($moment(date), 'long') }} {{ $i18n.locale === 'de' ? 'Uhr' : '' }}
          </div>
        </b-row>
      </div>

      <!-- collaps trancaction info-->
      <b-collapse :id="'a' + date + ''" class="pb-4">
        <transaction-collapse
          :amount="amount"
          :gdtEntryType="gdtEntryType"
          :factor="factor"
          :gdt="gdt"
        ></transaction-collapse>
      </b-collapse>
    </div>
  </div>
</template>
<script>
import TransactionCollapse from './TransactionCollapse.vue'

export default {
  name: 'Transaction',
  components: {
    TransactionCollapse,
  },
  props: {
    amount: { type: Number },
    date: { type: String },
    comment: { type: String },
    gdtEntryType: { type: Number, default: 1 },
    factor: { type: Number },
    gdt: { type: Number },
  },
  methods: {
    getLinesByType(givenType) {
      if (givenType === 2 || givenType === 3 || givenType === 5 || givenType === 6) givenType = 1

      const linesByType = {
        1: {
          icon: 'heart',
          iconclasses: 'gradido-global-color-accent m-mb-1 font2em',
          description: this.$t('gdt.contribution'),
          descriptiontext: this.$n(this.amount, 'decimal') + ' €',
          credittext: this.$n(this.gdt, 'decimal') + ' GDT',
        },
        4: {
          icon: 'person-check',
          iconclasses: 'gradido-global-color-accent m-mb-1 font2em',
          description: this.$t('gdt.recruited-member'),
          descriptiontext: '5%',
          credittext: this.$n(this.amount, 'decimal') + ' GDT',
        },
        7: {
          icon: 'gift',
          iconclasses: 'gradido-global-color-accent m-mb-1 font2em',
          description: this.$t('gdt.gdt-receive'),
          descriptiontext: this.comment,
          credittext: this.$n(this.gdt, 'decimal') + ' GDT',
        },
      }

      const type = linesByType[givenType]

      if (type) return type
      throw new Error('no lines for this type: ' + givenType)
    },
  },
}
</script>
