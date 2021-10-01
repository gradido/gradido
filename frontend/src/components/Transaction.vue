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
          <b-col cols="6" class="text-right">
            {{ getLinesByType(gdtEntryType).description }}
          </b-col>
          <b-col cols="6">
            {{ getLinesByType(gdtEntryType).descriptiontext }}
          </b-col>
        </b-row>

        <!-- credit -->
        <b-row>
          <b-col cols="6" class="text-right">
            {{ $t('gdt.credit') }}
          </b-col>
          <b-col cols="6">
            {{ getLinesByType(gdtEntryType).credittext }}
          </b-col>
        </b-row>

        <!-- Message-->
        <b-row v-if="comment && gdtEntryType !== 7">
          <b-col cols="6" class="text-right">
            {{ $t('form.memo') }}
          </b-col>
          <b-col cols="6">
            {{ comment }}
          </b-col>
        </b-row>

        <!-- date-->
        <b-row class="gdt-list-row text-header">
          <b-col cols="6" class="text-right">
            {{ $t('form.date') }}
          </b-col>
          <b-col cols="6">
            {{ $d($moment(date), 'long') }} {{ $i18n.locale === 'de' ? 'Uhr' : '' }}
          </b-col>
        </b-row>

        <!-- collaps trancaction info-->
        <b-collapse :id="'a' + date + ''" class="mt-2 pb-4">
          <transaction-collapse
            :amount="amount"
            :gdtEntryType="gdtEntryType"
            :factor="factor"
            :gdt="gdt"
          ></transaction-collapse>
        </b-collapse>
      </div>
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
          description: this.$t('gdt.gdt-received'),
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
