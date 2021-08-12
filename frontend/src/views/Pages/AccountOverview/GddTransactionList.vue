<template>
  <div class="gdd-transaction-list">
    <b-list-group>
      <b-list-group-item
        v-for="{ decay, transactionId, type, date, balance, name, memo } in transactions"
        :key="transactionId"
        :style="type === 'decay' ? 'background-color:#f1e0ae3d' : ''"
      >
        <div class="list-group-item gdd-transaction-list-item" v-b-toggle="'a' + date + ''">
          <!-- Collaps Button  -->
          <div v-if="type != 'decay'" class="text-right" style="width: 95%; position: absolute">
            <b-button class="btn-sm">
              <b>i</b>
            </b-button>
          </div>

          <b-row>
            <!-- ICON  -->
            <div class="col-1 gdd-transaction-list-item-icon">
              <b-icon :icon="getProperties(type).icon" :class="getProperties(type).class" />
            </div>

            <div class="col col-11">
              <!-- Betrag / Name Email -->
              <b-row>
                <div class="col-5 text-right">
                  <span class="gdd-transaction-list-item-operator">
                    {{ getProperties(type).operator }}
                  </span>
                  <span class="gdd-transaction-list-item-amount">{{ $n(balance, 'decimal') }}</span>
                </div>
                <div class="col-7 gdd-transaction-list-item-name">
                  {{ type !== 'decay' ? name : $t('decay.decay_since_last_transaction') }}
                </div>
              </b-row>

              <!-- Nachricht -->
              <b-row v-if="type !== 'decay'">
                <div class="col-5 text-right">{{ $t('form.memo') }}</div>
                <div class="col-7 gdd-transaction-list-message">{{ memo }}</div>
              </b-row>

              <!-- Datum -->
              <b-row v-if="type !== 'decay'">
                <div class="col-5 text-right">{{ $t('form.date') }}</div>
                <div class="col-7 gdd-transaction-list-item-date">
                  {{ $d($moment(date), 'long') }} {{ $i18n.locale === 'de' ? 'Uhr' : '' }}
                </div>
              </b-row>

              <!-- Decay -->
              <b-row v-if="decay">
                <div class="col-5 text-right">
                  <b-icon v-if="type != 'decay'" icon="droplet-half" height="15" class="mb-1" />
                </div>
                <div class="col-7 gdd-transaction-list-item-decay">
                  <decay-information v-if="decay" decaytyp="short" :decay="decay" />
                </div>
              </b-row>
            </div>
          </b-row>

          <!-- Collaps Start -->

          <b-collapse v-if="type != 'decay'" class="pb-4" :id="'a' + date + ''">
            <div style="border: 0px; background-color: #f1f1f1" class="p-2 pb-4 mb-4">
              <decay-information v-if="decay" decaytyp="new" :decay="decay" />
            </div>
          </b-collapse>

          <!-- Collaps End -->
        </div>
      </b-list-group-item>
      <pagination-buttons
        v-if="showPagination && transactionCount > pageSize"
        :has-next="hasNext"
        :has-previous="hasPrevious"
        :total-pages="totalPages"
        :current-page="currentPage"
        @show-next="showNext"
        @show-previous="showPrevious"
      ></pagination-buttons>
      <div v-if="transactions.length === 0" class="mt-4 text-center">
        <span>{{ $t('transaction.nullTransactions') }}</span>
      </div>
    </b-list-group>
  </div>
</template>

<script>
import PaginationButtons from '../../../components/PaginationButtons'
import DecayInformation from '../../../components/DecayInformation'

const iconsByType = {
  send: { icon: 'arrow-left-circle', classes: 'text-danger', operator: '-' },
  receive: { icon: 'arrow-right-circle', classes: 'gradido-global-color-accent', operator: '+' },
  creation: { icon: 'gift', classes: 'gradido-global-color-accent', operator: '+' },
  decay: { icon: 'droplet-half', classes: 'gradido-global-color-gray', operator: '-' },
}

export default {
  name: 'gdd-transaction-list',
  components: {
    PaginationButtons,
    DecayInformation,
  },
  data() {
    return {
      currentPage: 1,
    }
  },
  props: {
    transactions: { default: () => [] },
    pageSize: { type: Number, default: 25 },
    timestamp: { type: Number, default: 0 },
    transactionCount: { type: Number, default: 0 },
    showPagination: { type: Boolean, default: false },
  },
  watch: {
    timestamp: {
      immediate: true,
      handler: 'updateTransactions',
    },
  },
  computed: {
    hasNext() {
      return this.currentPage * this.pageSize < this.transactionCount
    },
    hasPrevious() {
      return this.currentPage > 1
    },
    totalPages() {
      return Math.ceil(this.transactionCount / this.pageSize)
    },
  },
  methods: {
    updateTransactions() {
      this.$emit('update-transactions', {
        firstPage: this.currentPage,
        items: this.pageSize,
      })
    },
    getProperties(givenType) {
      const type = iconsByType[givenType]
      if (type)
        return {
          icon: type.icon,
          class: type.classes + ' m-mb-1 font2em',
          operator: type.operator,
        }
      this.throwError('no icon to given type')
    },
    throwError(msg) {
      throw new Error(msg)
    },
    showNext() {
      this.currentPage++
      this.updateTransactions()
      window.scrollTo(0, 0)
    },
    showPrevious() {
      this.currentPage--
      this.updateTransactions()
      window.scrollTo(0, 0)
    },
  },
}
</script>
<style>
.el-table .cell {
  padding-left: 0px;
  padding-right: 0px;
}
</style>
