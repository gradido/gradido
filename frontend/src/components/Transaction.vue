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
        <transaction-collaps
          :amount="amount"
          :gdtEntryType="gdtEntryType"
          :factor="factor"
          :gdt="gdt"
        ></transaction-collaps>
      </b-collapse>
    </div>
  </div>
</template>
<script>
import TransactionCollaps from '../components/TransactionCollaps.vue'

export default {
  name: 'Transaction',
  components: {
    TransactionCollaps,
  },
  props: {
    amount: { type: Number },
    date: {
      type: Date,
    },
    comment: { type: String },
    gdtEntryType: { type: Number, default: 1 },
    factor: { type: Number },
    gdt: { type: Number },
  },
  methods: {
    getLinesByType(givenType) {
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
          description: this.$t('gdt.action'),
          descriptiontext: this.comment,
          credittext: this.$n(this.gdt, 'decimal') + ' GDT',
        },
      }

      const type = linesByType[givenType]

      if (type)
        return {
          icon: type.icon,
          iconclasses: type.iconclasses,
          description: type.description,
          descriptiontext: type.descriptiontext,
          credittext: type.credittext,
        }
      this.throwError('no lines for this type')
    },
    throwError(msg) {
      throw new Error(msg)
    },
  },
}
</script>
