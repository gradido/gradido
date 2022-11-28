<template>
  <div class="rightside-last-transactions">
    <b-row>
      <b-col>{{ $t('transaction.lastTransactions') }}</b-col>
      <b-col cols="1" class="text-right">
        <b-icon icon="three-dots-vertical"></b-icon>
      </b-col>
    </b-row>
    <div class="mt-3 mb-3" v-for="(transaction, index) in transactions" :key="transaction.id">
      <div
        v-if="
          index <= 7 &&
          transaction.typeId !== 'DECAY' &&
          transaction.typeId !== 'LINK_SUMMARY' &&
          transaction.typeId !== 'CREATION'
        "
      >
        <b-row>
          <b-col cols="3">
            <b-avatar badge-variant="white" src="https://placekitten.com/300/300">
              <template #badge>
                <b-icon
                  :icon="transaction.typeId === 'SEND' ? 'arrow-left' : 'arrow-right'"
                  :variant="transaction.typeId === 'SEND' ? 'danger' : 'success'"
                ></b-icon>
              </template>
            </b-avatar>
          </b-col>
          <b-col>
            <b-row>
              <b-col class="small font-weight-bold">
                {{ transaction.linkedUser.firstName }} {{ transaction.linkedUser.lastName }}
              </b-col>
              <b-col cols="2" class="mr-4">
                <b-icon icon="bookmark-plus" variant="black"></b-icon>
              </b-col>
            </b-row>
            <b-row class="mb-2">
              <b-col class="small">{{ transaction.amount | GDD }}</b-col>
              <b-col class="small">{{ $d(new Date(transaction.balanceDate), 'short') }}</b-col>
            </b-row>
          </b-col>
        </b-row>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: 'LastTransactions',
  props: {
    transactions: {
      default: () => [],
    },
    transactionCount: { type: Number, default: 0 },
    transactionLinkCount: { type: Number, default: 0 },
  },
}
</script>
