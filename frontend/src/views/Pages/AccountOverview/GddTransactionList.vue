<template>
  <div>
    <b-list-group>
      <b-list-group-item
        v-for="item in transactions.slice(0, max)"
        :key="item.id"
        style="background-color: #ebebeba3 !important"
      >
        <div class="d-flex" v-b-toggle="'a' + item.date + ''">
          <div style="width: 10%">
            <b-icon :icon="getIcon(item)" :class="getClass(item)" />
          </div>
          <div class="font1_2em pr-2 text-right" style="width: 20%">
            <span>{{ getOperator(item) }}</span>
            {{ $n(item.balance) }}
          </div>
          <div class="font1_2em text-left pl-2" style="width: 65%">
            {{ item.name }}
            <small>{{ item.name ? '' : $t('decay') }}</small>
            <div class="text-sm">{{ $moment(item.date).format('DD.MM.YYYY - HH:mm:ss') }}</div>
          </div>
          <div class="font1_2em text-right" style="width: 5%">
            <b-button class="btn-sm">
              <b>i</b>
            </b-button>
          </div>
        </div>
        <b-collapse :id="'a' + item.date + ''" class="mt-2">
          <b-card>
            <b-list-group>
              <b-list-group-item v-if="item.type === 'send'">
                <b-badge class="mr-4" variant="primary" pill>{{ $t('form.receiver') }}</b-badge>
                {{ item.name }}
              </b-list-group-item>
              <b-list-group-item v-else>
                <b-badge class="mr-4" variant="primary" pill>{{ $t('form.sender') }}</b-badge>
                {{ item.name }}
              </b-list-group-item>

              <b-list-group-item>
                <b-badge class="mr-4" variant="primary" pill>type</b-badge>
                {{ item.type }}
              </b-list-group-item>
              <b-list-group-item>
                <b-badge class="mr-5" variant="primary" pill>id</b-badge>
                {{ item.transaction_id }}
              </b-list-group-item>
              <b-list-group-item>
                <b-badge class="mr-4" variant="primary" pill>{{ $t('form.date') }}</b-badge>
                {{ item.date }}
              </b-list-group-item>
              <b-list-group-item>
                <b-badge class="mr-4" variant="primary" pill>gdd</b-badge>
                {{ item.balance }}
              </b-list-group-item>
              <b-list-group-item>
                <b-badge class="mr-4" variant="primary" pill>{{ $t('form.memo') }}</b-badge>
                {{ item.memo }}
              </b-list-group-item>
            </b-list-group>
            <b-button v-b-toggle="'collapse-1-inner' + item.date" variant="secondary">
              {{ $t('transaction.more') }}
            </b-button>
            <b-collapse :id="'collapse-1-inner' + item.date" class="mt-2">
              <b-card>{{ item }}</b-card>
            </b-collapse>
          </b-card>
        </b-collapse>
      </b-list-group-item>
      <div v-if="transactions.length !== 0" class="mt-4 text-center">
        <span>{{ $t('transaction.nullTransactions') }}</span>
      </div>
    </b-list-group>
  </div>
</template>

<script>
const iconsByType = {
  send: { icon: 'arrow-left-circle', classes: 'text-danger', operator: '-' },
  receive: { icon: 'arrow-right-circle', classes: 'gradido-global-color-accent', operator: '+' },
  creation: { icon: 'gift', classes: 'gradido-global-color-accent', operator: '+' },
  decay: { icon: 'droplet-half', classes: 'gradido-global-color-gray', operator: '-' },
}

export default {
  name: 'gdd-transaction-list',
  props: {
    transactions: { default: [] },
    max: { type: Number, default: 1000 },
    timestamp: { type: Number, default: 0 },
    transactionCount: { type: Number, default: 0 },
  },
  data() {
    return {
      form: [],
      fields: ['balance', 'date', 'memo', 'name', 'transaction_id', 'type', 'details'],
      items: [],
    }
  },
  watch: {
    timestamp: {
      immediate: true,
      handler: 'updateTransactions',
    },
  },
  methods: {
    updateTransactions() {
      this.$emit('update-transactions')
    },
    getIcon(item) {
      const icon = iconsByType[item.type]
      if (icon) return icon.icon
      const thing = new Error('no item to given type')
      thing()
    },
    getClass(item) {
      const icon = iconsByType[item.type]
      if (icon) return icon.classes + ' m-mb-1 font2em'
      const thing = new Error('no item to given type')
      thing()
    },
    getOperator(item) {
      const icon = iconsByType[item.type]
      if (icon) return icon.operator
      const thing = new Error('no item to given type')
      thing()
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
