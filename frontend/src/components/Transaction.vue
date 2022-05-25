<template>
  <div>
    <div class="list-group">
      <div class="list-group-item gdt-transaction-list-item" v-b-toggle="collapseId">
        <!-- icon  -->
        <div class="text-right position-absolute">
          <b-icon :icon="getLinesByType.icon" :class="getLinesByType.iconclasses"></b-icon>
        </div>

        <!-- collaps Button  -->
        <div class="text-right gradido-width-96 position-absolute">
          <b-icon
            :icon="getCollapseState(id) ? 'caret-up-square' : 'caret-down-square'"
            :class="getCollapseState(id) ? 'text-black' : 'text-muted'"
          />
        </div>

        <!-- type  -->
        <b-row>
          <b-col cols="6" class="text-right">
            {{ getLinesByType.description }}
          </b-col>
          <b-col cols="6">
            {{ getLinesByType.descriptiontext }}
          </b-col>
        </b-row>

        <!-- credit -->
        <b-row>
          <b-col cols="6" class="text-right">
            {{ $t('gdt.credit') }}
          </b-col>
          <b-col cols="6">
            {{ getLinesByType.credittext }}
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
            {{ $d(new Date(date), 'long') }}
          </b-col>
        </b-row>

        <!-- collaps trancaction info-->
        <b-collapse :id="collapseId" class="mt-2 pb-4">
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
    id: { type: Number },
  },
  data() {
    return {
      collapseStatus: [],
    }
  },
  methods: {
    getCollapseState(id) {
      return this.collapseStatus.includes('gdt-collapse-' + id)
    },
  },
  computed: {
    collapseId() {
      return 'gdt-collapse-' + String(this.id)
    },
    isGlobalModificator() {
      return this.gdtEntryType === GdtEntryType.GLOBAL_MODIFICATOR
    },
    getLinesByType() {
      switch (this.gdtEntryType) {
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
          throw new Error('no lines for this type: ' + this.gdtEntryType)
      }
    },
  },
  mounted() {
    this.$root.$on('bv::collapse::state', (collapseId, isJustShown) => {
      if (isJustShown) {
        this.collapseStatus.push(collapseId)
      } else {
        this.collapseStatus = this.collapseStatus.filter((id) => id !== collapseId)
      }
    })
  },
}
</script>
