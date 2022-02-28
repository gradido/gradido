<template>
  <div class="gdd-transaction-list">
    <div class="list-group">
      <div v-if="!transactions" class="test-no-transactionlist text-right">
        <b-icon icon="exclamation-triangle" class="mr-2" variant="danger"></b-icon>
        <small>
          {{ $t('error.no-transactionlist') }}
        </small>
      </div>
      <div v-if="transactionCount < 0" class="test-empty-transactionlist text-right">
        <b-icon icon="exclamation-triangle" class="mr-2" variant="danger"></b-icon>
        <small>{{ $t('error.empty-transactionlist') }}</small>
      </div>
      <div
        v-for="{
          decay,
          transactionId,
          type,
          date,
          balance,
          name,
          memo,
          firstTransaction,
          decayDuration,
          decayEnd,
          decayStart,
        } in transactions"
        :key="transactionId"
        :style="type === 'decay' ? 'background-color:#f1e0ae3d' : ''"
      >
        <div
          class="list-group-item gdd-transaction-list-item"
          :class="getCollapseState(transactionId) ? 'bg-secondary' : ''"
          v-b-toggle="'decay-' + transactionId"
        >
          <!-- Collaps Button  -->
          <div class="text-right" style="width: 95%; position: absolute">
            <b-icon
              :icon="getCollapseState(transactionId) ? 'caret-up-square' : 'caret-down-square'"
              :class="getCollapseState(transactionId) ? 'text-black' : 'text-muted'"
            />
          </div>
          <div>
            <b-row>
              <!-- ICON  -->
              <b-col cols="1">
                <div class="gdd-transaction-list-item-icon">
                  <b-icon :icon="getProperties(type).icon" :class="getProperties(type).class" />
                </div>
              </b-col>

              <b-col cols="11">
                <!-- Betrag / Name Email -->
                <b-row>
                  <b-col cols="5">
                    <div class="text-right">
                      <span class="gdd-transaction-list-item-operator">
                        {{ getProperties(type).operator }}
                      </span>
                      <span class="gdd-transaction-list-item-amount">
                        {{ $n(balance, 'decimal') }}
                      </span>
                    </div>
                  </b-col>
                  <b-col cols="7">
                    <div class="gdd-transaction-list-item-name">
                      {{ type !== 'decay' ? name : $t('decay.decay_since_last_transaction') }}
                    </div>
                  </b-col>
                </b-row>

                <!-- Nachricht -->
                <b-row v-if="type !== 'decay'">
                  <b-col cols="5">
                    <div class="text-right">{{ $t('form.memo') }}</div>
                  </b-col>
                  <b-col cols="7">
                    <div class="gdd-transaction-list-message">{{ memo }}</div>
                  </b-col>
                </b-row>

                <!-- Datum -->
                <b-row v-if="type !== 'decay'">
                  <b-col cols="5">
                    <div class="text-right">{{ $t('form.date') }}</div>
                  </b-col>
                  <b-col cols="7">
                    <div class="gdd-transaction-list-item-date">
                      {{ $d(new Date(date), 'long') }} {{ $i18n.locale === 'de' ? 'Uhr' : '' }}
                    </div>
                  </b-col>
                </b-row>

                <!-- Decay -->
                <b-row v-if="decay && !decay.decayStartBlock">
                  <b-col cols="5">
                    <div class="text-right">
                      <b-icon v-if="type != 'decay'" icon="droplet-half" height="15" class="mb-1" />
                    </div>
                  </b-col>
                  <b-col cols="7">
                    <div class="gdd-transaction-list-item-decay">
                      <decay-information v-if="decay" decaytyp="short" :decay="decay" />
                    </div>
                  </b-col>
                </b-row>
                <b-row v-if="decay && decay.decayStartBlock">
                  <b-col cols="5">
                    <div class="text-right">
                      <b-icon v-if="type != 'decay'" icon="droplet-half" height="15" class="mb-1" />
                    </div>
                  </b-col>
                  <b-col cols="7">
                    <div class="gdd-transaction-list-item-decay">
                      <b>{{ $t('decay.Starting_block_decay') }}</b>
                    </div>
                  </b-col>
                </b-row>
              </b-col>
            </b-row>
          </div>

          <!-- Collaps Start -->
          <!-- v-if="
              (type != 'decay' && decay) ||
              firstTransaction ||
              (!firstTransaction && decay === null)
            " -->
          <b-collapse class="pb-4" :id="'decay-' + transactionId">
            <div class="pt-4 pb-4 bg-white border border-muted">
              <decay-information
                v-if="decay"
                decaytyp="new"
                :balance="balance"
                :decay="decay"
                :type="type"
              />
              <div v-if="firstTransaction" class="mt-3 mb-3 text-center">
                <b>{{ $t('decay.first_transaction') }}</b>
              </div>

              <div
                v-if="type !== 'decay' && !firstTransaction && decay === null"
                class="mt-3 mb-3 text-center"
              >
                <b>{{ $t('decay.befor_startblock_transaction') }}</b>
              </div>
              <div v-if="type === 'decay'" class="mt-3 mb-3">
                <decay-information
                  decaytyp="decayLastTransaction"
                  :gddbalance="gddbalance"
                  :balance="balance"
                  :decay="{
                    balance: balance,
                    decayStart: parseInt(decayStart),
                    decayEnd: parseInt(decayEnd),
                    decayDuration: parseInt(decayDuration),
                  }"
                  :type="type"
                />
              </div>
            </div>
          </b-collapse>

          <!-- Collaps End -->
        </div>
      </div>
      <pagination-buttons
        v-if="showPagination"
        v-model="currentPage"
        :per-page="pageSize"
        :total-rows="transactionCount"
      ></pagination-buttons>
      <div v-if="transactionCount < 0" class="mt-4 text-center">
        <span>{{ $t('transaction.nullTransactions') }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import PaginationButtons from '../../../components/PaginationButtons'
import DecayInformation from '../../../components/DecayInformation'

const iconsByType = {
  send: { icon: 'arrow-left-circle', classes: 'text-danger', operator: '−' },
  receive: { icon: 'arrow-right-circle', classes: 'gradido-global-color-accent', operator: '+' },
  creation: { icon: 'gift', classes: 'gradido-global-color-accent', operator: '+' },
  decay: { icon: 'droplet-half', classes: 'gradido-global-color-gray', operator: '−' },
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
      collapseStatus: [],
    }
  },
  props: {
    gddbalance: { type: Number },
    transactions: { default: () => [] },
    pageSize: { type: Number, default: 25 },
    timestamp: { type: Number, default: 0 },
    transactionCount: { type: Number, default: 0 },
    showPagination: { type: Boolean, default: false },
  },
  methods: {
    updateTransactions() {
      this.$emit('update-transactions', {
        currentPage: this.currentPage,
        pageSize: this.pageSize,
      })
      window.scrollTo(0, 0)
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
    getCollapseState(transactionId) {
      return this.collapseStatus.includes('decay-' + transactionId)
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
  watch: {
    currentPage() {
      this.updateTransactions()
    },
    timestamp: {
      immediate: true,
      handler: 'updateTransactions',
    },
  },
}
</script>
<style>
.el-table .cell {
  padding-left: 0px;
  padding-right: 0px;
}

.gdd-transaction-list-item {
  outline: none !important;
}
</style>
