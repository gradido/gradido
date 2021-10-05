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
        <b-row v-if="comment && !isGlobalModificator">
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
import { GdtEntryType } from '../graphql/enums'

export default {
  name: 'Transaction',
  components: {
    TransactionCollapse,
  },
  props: {
    amount: { type: Number },
    date: { type: String },
    comment: { type: String },
    gdtEntryType: { type: String, default: GdtEntryType.FORM },
    factor: { type: Number },
    gdt: { type: Number },
  },
  computed: {
    isGlobalModificator: function () {
      return this.gdtEntryType === GdtEntryType.GLOBAL_MODIFICATOR
    },
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
            icon: 'heart',
            iconclasses: 'gradido-global-color-accent m-mb-1 font2em',
            description: this.$t('gdt.contribution'),
            descriptiontext: this.$n(this.amount, 'decimal') + ' €',
            credittext: this.$n(this.gdt, 'decimal') + ' GDT',
          }
        }
        case GdtEntryType.ELOPAGE_PUBLISHER: {
          return {
            icon: 'person-check',
            iconclasses: 'gradido-global-color-accent m-mb-1 font2em',
            description: this.$t('gdt.recruited-member'),
            descriptiontext: '5%',
            credittext: this.$n(this.amount, 'decimal') + ' GDT',
          }
        }
        case GdtEntryType.GLOBAL_MODIFICATOR: {
          return {
            icon: 'gift',
            iconclasses: 'gradido-global-color-accent m-mb-1 font2em',
            description: this.$t('gdt.gdt-received'),
            descriptiontext: this.comment,
            credittext: this.$n(this.gdt, 'decimal') + ' GDT',
          }
        }
        default:
          throw new Error('no lines for this type: ' + givenType)
      }
    },
  },
}
</script>
