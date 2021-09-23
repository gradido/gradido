<template>
  <div
    class="gdt-transaction-collapse p-2 pt-4 pb-4 mb-4"
    style="border: 0px; background-color: #f1f1f1"
  >
    <b-row class="gdt-list-collapse-header-text text-center pb-3">
      <div id="collapse-headline" class="col">
        <b>{{ getLinesByType(gdtEntryType).headline }}</b>
      </div>
    </b-row>
    <b-row class="gdt-list-collapse-box--all">
      <div class="col-6 text-right collapse-col-left">
        <div id="collapse-first">{{ getLinesByType(gdtEntryType).first }}</div>
        <div id="collapse-second">{{ getLinesByType(gdtEntryType).second }}</div>
      </div>
      <div class="col-6 collapse-col-right">
        <div id="collapse-firstMath">{{ getLinesByType(gdtEntryType).firstMath }}</div>
        <div id="collapse-secondMath">
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
