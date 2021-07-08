<template>
  <div class="gdd-transaction-list">
    <b-list-group>
      <b-list-group-item
        v-for="item in transactions"
        v-bind:key="item.transaction_id"
        :style="item.type === 'decay' ? 'background-color:#f1e0ae3d' : ''"
      >
        <div class="d-flex gdd-transaction-list-item" v-b-toggle="'a' + item.date + ''">
          <div style="width: 8%">
            <b-icon :icon="getProperties(item).icon" :class="getProperties(item).class" />
          </div>

          <div class="font1_2em pr-2 text-right" style="width: 32%">
            <span>{{ getProperties(item).operator }}</span>
            <small v-if="item.type === 'decay'">{{ $n(item.balance, 'decimal') }}</small>

            <span v-else>{{ $n(item.balance, 'decimal') }}</span>

            <div v-if="getTransaction(item.transaction_id).decay">
              <br />
              <b-icon v-if="item.type != 'decay'" icon="droplet-half" height="15" class="mb-3" />
            </div>
          </div>

          <div class="font1_2em text-left pl-2" style="width: 55%">
            {{ item.name ? item.name : '' }}
            <span v-if="item.type === 'decay'">
              <small>Vergänglichkeit seit der letzten Transaktion</small>
            </span>
            <div v-if="item.date" class="text-sm">{{ $d($moment(item.date), 'long') }}</div>
            <decay-information
              :decay="getTransaction(item.transaction_id).decay"
              decaytyp="short"
            />
          </div>

          <div v-if="item.type != 'decay'" class="text-right" style="width: 5%">
            <b-button class="btn-sm">
              <b>i</b>
            </b-button>
          </div>
        </div>

        <b-collapse v-if="item.type != 'decay'" :id="'a' + item.date + ''">
          <b-card>
            <b-card-title>
              <div class="display-4" v-if="item.type === 'receive' || item.type === 'send'">
                <b-icon :icon="getProperties(item).icon" :class="getProperties(item).class" />

                {{ item.type === 'receive' ? 'empfangen:' : 'gesendet:' }}
              </div>
              <div class="display-4" v-if="item.type === 'creation'">
                <b-icon :icon="getProperties(item).icon" :class="getProperties(item).class" />

                {{ item.type === 'creation' ? 'geschöpft:' : '' }}
              </div>
            </b-card-title>
            <b-card-body>
              <p class="display-2">{{ $n(item.balance, 'decimal') }} GDD</p>

              <div v-if="item.type != 'creation'">
                <div>am:</div>

                <b-list-group style="min-width: 300px">
                  <b-list-group-item class="d-flex align-items-center">
                    <b-icon icon="clock" class="mr-3" />
                    <span>{{ $d($moment(item.date), 'long') }}</span>
                  </b-list-group-item>
                  <div>{{ item.type === 'receive' ? 'von:' : 'an:' }}</div>
                  <b-list-group-item class="d-flex align-items-center">
                    <b-avatar class="mr-3"></b-avatar>
                    <span>{{ item.name }}</span>
                    <b-badge>5</b-badge>
                  </b-list-group-item>
                </b-list-group>
                <div>
                  {{
                    item.type === 'receive' ? 'Nachricht vom Absender:' : 'Nachricht an Empfänger:'
                  }}
                </div>
                <b-list-group>
                  <b-list-group-item class="d-flex align-items-center">
                    <b-icon icon="card-text" class="mr-3" />
                    <span>{{ item.memo }}</span>
                  </b-list-group-item>
                </b-list-group>
              </div>
              <div v-else>
                <div>Dein Eintrag aus der Community wurde bestätigt.</div>

                <div class="mt-3">
                  <b-card
                    title="Hilfe bei Gartenarbeit"
                    img-src="https://picsum.photos/600/300/?image=25"
                    img-alt="Image"
                    img-top
                    tag="article"
                    style="max-width: 30rem"
                    class="mb-2"
                  >
                    <b-card-text>
                      5 Stunden hilfe bei Gartenarbeit. Meine 80 jährige Nachbarin kann zur Zeit
                      nicht in Ihrem Garten arbeiten.
                    </b-card-text>

                    <b-button href="#" variant="primary">ansehen</b-button>
                  </b-card>
                </div>

                <hr />
                Deinem Konto wurden am
                <span>{{ $d($moment(item.date), 'long') }}</span>
                <div>{{ $n(item.balance, 'decimal') }} GDD geschöpft</div>
              </div>

              <decay-information
                :decay="getTransaction(item.transaction_id).decay"
                decay_typ="short"
              />
            </b-card-body>
          </b-card>
        </b-collapse>
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
    getTransaction(id) {
      return this.transactions.find((t) => t.transaction_id === id)
    },

    updateTransactions() {
      this.$emit('update-transactions', {
        firstPage: this.currentPage,
        items: this.pageSize,
      })
    },
    getProperties(item) {
      const type = iconsByType[item.type]
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
    },
    showPrevious() {
      this.currentPage--
      this.updateTransactions()
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