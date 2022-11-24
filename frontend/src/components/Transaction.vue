<template>
  <div>
    <div class="list-group">
      <b-row @click="visible = !visible" class="">
        <b-col cols="2">
          <b-avatar :icon="getLinesByType.icon" variant="light" size="4em"></b-avatar>
        </b-col>
        <b-col>
          <div>
            {{ getLinesByType }}
          </div>
        </b-col>
        <b-col cols="3">
          <div class="small">Gesendet</div>
          <div class="small">{{ amount | GDT }}</div>
        </b-col>
        <b-col cols="1"><collapse-icon class="text-right" :visible="visible" /></b-col>
      </b-row>

      <b-collapse :id="collapseId" class="mt-2 pb-4" v-model="visible">
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
import CollapseIcon from './TransactionRows/CollapseIcon'
import TransactionCollapse from './TransactionCollapse.vue'
import { GdtEntryType } from '../graphql/enums'

export default {
  name: 'Transaction',
  components: {
    CollapseIcon,
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
      visible: false,
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
