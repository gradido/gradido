<template>
  <div class="gdt-transaction-collapse">
    <b-row class="gdt-list-clooaps-header-text text-center pb-3">
      <div id="clooaps-headline" class="col h4">
        {{ getLinesByType(gdtEntryType).headline }}
      </div>
    </b-row>
    <b-row class="gdt-list-clooaps-box--all">
      <div class="col-6 text-right clooaps-col-left">
        <div id="clooaps-first">{{ getLinesByType(gdtEntryType).first }}</div>
        <div id="clooaps-second">{{ getLinesByType(gdtEntryType).second }}</div>
      </div>
      <div class="col-6 clooaps-col-right">
        <div id="clooaps-firstMath">{{ getLinesByType(gdtEntryType).firstMath }}</div>
        <div id="clooaps-secondMath">
          {{ getLinesByType(gdtEntryType).secondMath }}
        </div>
      </div>
    </b-row>
  </div>
</template>
<script>
export default {
  name: 'TransactionCollapse',
  props: {
    amount: { type: Number },
    gdtEntryType: { type: Number, default: 1 },
    factor: { type: Number },
    gdt: { type: Number },
  },
  methods: {
    getLinesByType(givenType) {
      const linesByType = {
        1: {
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
        },
        4: {
          headline: this.$t('gdt.publisher'),
          first: null,
          firstMath: null,
          second: null,
          secondMath: null,
        },
        7: {
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
        },
      }

      const type = linesByType[givenType]

      if (type) return type
      throw new Error('no additional transaction info for this type: ' + givenType)
    },
  },
}
</script>
