<template>
  <div class="gdd-transaction-list">
    <b-list-group>
      <b-list-group-item
        v-for="{ decay, transactionId, type, date, balance, name, memo } in transactions"
        :key="transactionId"
        :style="type === 'decay' ? 'background-color:#f1e0ae3d' : ''"
      >
        <!-- ROW Start -->
        <div class="d-flex gdd-transaction-list-item" v-b-toggle="'a' + date + ''">
          <!-- ICON -->
          <div style="width: 8%">
            <b-icon :icon="getProperties(type).icon" :class="getProperties(type).class" />
          </div>
          <!-- Text Links -->
          <div class="font1_2em pr-2 text-right" style="width: 32%">
            <span>{{ getProperties(type).operator }}</span>

            <small v-if="type === 'decay'">{{ $n(balance, 'decimal') }}</small>

            <span v-else>{{ $n(balance, 'decimal') }}</span>
            <div v-if="type !== 'decay' && type !== 'creation'">
              <small>
                {{ $t('form.memo') }}
              </small>
            </div>
            <div v-if="decay">
              <br />
              <b-icon v-if="type != 'decay'" icon="droplet-half" height="15" class="mb-3" />
            </div>
          </div>
          <!-- Text Rechts -->
          <div class="font1_2em text-left pl-2" style="width: 55%">
            <div>{{ name ? name : '' }}</div>
            <div>
              <small>
                {{ memo }}
              </small>
            </div>
            <span v-if="type === 'decay'">
              <small>{{ $t('decay.decay_since_last_transaction') }}</small>
            </span>
            <div v-if="date" class="text-sm">
              {{ $d($moment(date), 'long') }} {{ $i18n.locale === 'de' ? 'Uhr' : '' }}
            </div>
            <decay-information v-if="decay" decaytyp="short" :decay="decay" />
          </div>
          <!-- Collaps Toggle Button -->
          <div v-if="type != 'decay'" class="text-right" style="width: 5%">
            <b-button class="btn-sm">
              <b>i</b>
            </b-button>
          </div>
        </div>
        <!-- ROW End -->
        <!-- Collaps Start -->
        <b-collapse v-if="type != 'decay'" :id="'a' + date + ''">
          <b-list-group v-if="type === 'creation'">
            <b-list-group-item style="border: 0px">
              <div class="d-flex">
                <div style="width: 40%" class="text-right pr-3 mr-2">{{ $t('decay.created') }}</div>
                <div style="width: 60%">{{ $t('decay.fromCommunity') }}</div>
              </div>
            </b-list-group-item>
          </b-list-group>
          <decay-information v-if="decay" decaytyp="new" :decay="decay" />
        </b-collapse>
        <!-- Collaps End -->
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
      startDecay: 0,
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
