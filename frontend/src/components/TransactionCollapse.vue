<template>
  <div
    class="gdt-transaction-collapse p-2 pt-4 pb-4 mb-4"
    style="border: 0px; background-color: #f1f1f1"
  >
    <b-row class="gdt-list-collapse-header-text text-center pb-3">
      <b-col id="collapse-headline">
        <b>{{ getLinesByType(gdtEntryType).headline }}</b>
      </b-col>
    </b-row>
    <b-row class="gdt-list-collapse-box--all">
      <b-col cols="6" class="text-right collapse-col-left">
        <div id="collapse-first">{{ getLinesByType(gdtEntryType).first }}</div>
        <div id="collapse-second">{{ getLinesByType(gdtEntryType).second }}</div>
      </b-col>
      <b-col cols="6" class="collapse-col-right">
        <div id="collapse-firstMath">{{ getLinesByType(gdtEntryType).firstMath }}</div>
        <div id="collapse-secondMath">
          {{ getLinesByType(gdtEntryType).secondMath }}
        </div>
      </b-col>
    </b-row>
  </div>
</template>
<script>
import { GdtEntryType } from '../graphql/enums'

export default {
  name: 'TransactionCollapse',
  props: {
    amount: { type: Number },
    gdtEntryType: { type: String, default: GdtEntryType.FORM },
    factor: { type: Number },
    gdt: { type: Number },
  },
  methods: {
    getLinesByType(givenType) {
      switch (givenType) {
        case GdtEntryType.FORM:
        case GdtEntryType.CVS:
        case GdtEntryType.ELOPAGE:
        case GdtEntryType.DIGISTORE:
        case GdtEntryType.CVS2: {
          return {
            headline: this.$t('gdt.calculation'),
            first: this.$t('gdt.factor'),
            firstMath: this.factor + ' GDT pro €',
            second: this.$t('gdt.formula'),
            secondMath:
              this.$n(this.amount, 'decimal') +
              ' € * ' +
              this.factor +
              ' GDT / € = ' +
              this.$n(this.gdt, 'decimal') +
              ' GDT',
          }
        }
        case GdtEntryType.ELOPAGE_PUBLISHER: {
          return {
            headline: this.$t('gdt.publisher'),
            first: null,
            firstMath: null,
            second: null,
            secondMath: null,
          }
        }
        case GdtEntryType.GLOBAL_MODIFICATOR: {
          return {
            headline: this.$t('gdt.conversion-gdt-euro'),
            first: this.$t('gdt.raise'),
            firstMath: this.factor * 100 + ' % ',
            second: this.$t('gdt.conversion'),
            secondMath:
              this.$n(this.amount, 'decimal') +
              ' GDT * ' +
              this.factor * 100 +
              ' % = ' +
              this.$n(this.gdt, 'decimal') +
              ' GDT',
          }
        }
        default:
          throw new Error('no additional transaction info for this type: ' + givenType)
      }
    },
  },
}
</script>
