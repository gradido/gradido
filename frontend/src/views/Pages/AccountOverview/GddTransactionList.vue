<template>
  <div class="gdd-transaction-list">
    <div class="list-group">
      <div v-if="!transactions" class="test-no-transactionlist text-right">
        <b-icon icon="exclamation-triangle" class="mr-2" style="color: red"></b-icon>
        <small>
          {{ $t('error.no-transactionlist') }}
        </small>
      </div>
      <div v-if="transactionCount < 0" class="test-empty-transactionlist text-right">
        <b-icon icon="exclamation-triangle" class="mr-2" style="color: red"></b-icon>
        <small>{{ $t('error.empty-transactionlist') }}</small>
      </div>
      <div
        v-for="{ decay, id, typeId, balanceDate, amount, linkedUser, memo } in transactions"
        :key="id"
        :style="typeId === 'DECAY' ? 'background-color:#f1e0ae3d' : ''"
      >
        <div class="list-group-item gdd-transaction-list-item" v-b-toggle="'decay-' + id">
          <!-- Collaps Button  -->
          <div
            v-if="typeId != 'DECAY' && decay"
            class="text-right"
            style="width: 95%; position: absolute"
          >
            <b-button class="btn-sm">
              <b>i</b>
            </b-button>
          </div>

          <div>
            <b-row>
              <!-- ICON  -->
              <b-col cols="1">
                <div class="gdd-transaction-list-item-icon">
                  <b-icon :icon="getProperties(typeId).icon" :class="getProperties(typeId).class" />
                </div>
              </b-col>

              <b-col cols="11">
                <!-- Betrag / Name Email -->
                <b-row>
                  <b-col cols="5">
                    <div class="text-right">
                      <span class="gdd-transaction-list-item-operator">
                        {{ getProperties(typeId).operator }}
                      </span>
                      <span class="gdd-transaction-list-item-amount">
                        {{ $n(Math.abs(Number(amount)), 'decimal') }}
                      </span>
                    </div>
                  </b-col>
                  <b-col cols="7">
                    <div class="gdd-transaction-list-item-name">
                      {{
                        typeId !== 'DECAY'
                          ? `${linkedUser.firstName} ${linkedUser.lastName}`
                          : $t('decay.decay_since_last_transaction')
                      }}
                    </div>
                  </b-col>
                </b-row>

                <!-- Nachricht -->
                <b-row v-if="typeId !== 'DECAY'">
                  <b-col cols="5">
                    <div class="text-right">{{ $t('form.memo') }}</div>
                  </b-col>
                  <b-col cols="7">
                    <div class="gdd-transaction-list-message">{{ memo }}</div>
                  </b-col>
                </b-row>

                <!-- Datum -->
                <b-row v-if="typeId !== 'DECAY'">
                  <b-col cols="5">
                    <div class="text-right">{{ $t('form.date') }}</div>
                  </b-col>
                  <b-col cols="7">
                    <div class="gdd-transaction-list-item-date">
                      {{ $d(new Date(balanceDate), 'long') }}
                      {{ $i18n.locale === 'de' ? 'Uhr' : '' }}
                    </div>
                  </b-col>
                </b-row>

                <!-- Decay -->
                <b-row v-if="decay && !decay.decayStartBlock">
                  <b-col cols="5">
                    <div class="text-right">
                      <b-icon
                        v-if="typeId != 'DECAY'"
                        icon="droplet-half"
                        height="15"
                        class="mb-1"
                      />
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
                      <b-icon
                        v-if="typeId != 'DECAY'"
                        icon="droplet-half"
                        height="15"
                        class="mb-1"
                      />
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

          <b-collapse v-if="typeId != 'DECAY' && decay" class="pb-4" :id="'decay-' + id">
            <div style="border: 0px; background-color: #f1f1f1" class="p-2 pb-4 mb-4">
              <decay-information v-if="decay" decaytyp="new" :decay="decay" :type="typeId" />
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
  SEND: { icon: 'arrow-left-circle', classes: 'text-danger', operator: '−' },
  RECEIVE: { icon: 'arrow-right-circle', classes: 'gradido-global-color-accent', operator: '+' },
  CREATION: { icon: 'gift', classes: 'gradido-global-color-accent', operator: '+' },
  DECAY: { icon: 'droplet-half', classes: 'gradido-global-color-gray', operator: '−' },
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
