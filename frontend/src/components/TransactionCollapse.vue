<template>
  <div class="gdt-transaction-collapse  py-4 mb-4 gradido-no-border">
    <b-row class="gdt-list-collapse-header-text mb-3">
      <b-col class="collapse-headline">
        <b>{{ getLinesByType.headline }}</b>
      </b-col>
    </b-row>
    <b-row class="gdt-list-collapse-box--all">
      <b-col cols="12" lg="4" md="4">
        <div class="collapse-first">{{ getLinesByType.first }}</div>
        <div class="collapse-second">{{ getLinesByType.second }}</div>
      </b-col>
      <b-col offset="1" offset-md="0" offset-lg="0">
        <div class="collapse-firstMath">{{ getLinesByType.firstMath }}</div>
        <div class="collapse-secondMath">
          {{ getLinesByType.secondMath }}
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
  computed: {
    getLinesByType() {
      switch (this.gdtEntryType) {
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
          throw new Error('no additional transaction info for this type: ' + this.gdtEntryType)
      }
    },
  },
}
</script>
