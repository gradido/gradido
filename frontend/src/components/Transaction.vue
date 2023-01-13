<template>
  <div class="gdt-transaction-list">
    <div class="list-group bg-white appBoxShadow gradido-border-radius p-3 mb-3">
      <b-row @click="visible = !visible" class="align-items-center">
        <b-col cols="3" lg="2" md="2">
          <b-avatar
            :icon="getLinesByType.icon"
            variant="light"
            size="3em"
            :class="getLinesByType.iconclasses"
          ></b-avatar>
        </b-col>
        <b-col>
          <!-- <div>
            {{ getLinesByType }}
          </div> -->
          <div>
            <span class="small">{{ this.$d(new Date(date), 'short') }}</span>
            <span class="small ml-3">{{ this.$d(new Date(date), 'time') }}</span>
          </div>
          <div>
            {{ getLinesByType.description }}
          </div>
          <div class="small">
            {{ getLinesByType.descriptiontext }}
          </div>
        </b-col>
        <b-col cols="8" lg="3" md="3" sm="8" offset="3" offset-md="0" offset-lg="0">
          <div class="small mb-2">{{ $t('gdt.credit') }}</div>
          <div class="font-weight-bold">{{ getLinesByType.credittext }}</div>
        </b-col>
        <b-col cols="12" md="1" lg="1" class="text-right">
          <collapse-icon class="text-right" :visible="visible" />
        </b-col>
      </b-row>

      <b-collapse :id="collapseId" class="mt-2" v-model="visible">
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
            iconclasses: 'gradido-global-color-accent',
            description: this.$t('gdt.contribution'),
            descriptiontext: this.$n(this.amount, 'decimal') + ' €',
            credittext: this.$n(this.gdt, 'decimal') + ' GDT',
          }
        }
        case GdtEntryType.ELOPAGE_PUBLISHER: {
          return {
            icon: 'person-check',
            iconclasses: 'gradido-global-color-accent',
            description: this.$t('gdt.recruited-member'),
            descriptiontext: '5%',
            credittext: this.$n(this.amount, 'decimal') + ' GDT',
          }
        }
        case GdtEntryType.GLOBAL_MODIFICATOR: {
          return {
            icon: 'gift',
            iconclasses: 'gradido-global-color-accent',
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
