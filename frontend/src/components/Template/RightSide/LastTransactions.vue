<template>
  <div class="rightside-last-transactions">
    <b-row>
      <b-col>{{ $t('transaction.lastTransactions') }}</b-col>
      <b-col cols="1" class="text-right">
        <b-icon icon="three-dots-vertical"></b-icon>
      </b-col>
    </b-row>
    <b-list-group flush horizontal>
      <b-list-group-item v-for="(transaction, index) in transactions" :key="transaction.id">
        <div
          v-if="
            index <= 7 &&
            transaction.typeId !== 'DECAY' &&
            transaction.typeId !== 'LINK_SUMMARY' &&
            transaction.typeId !== 'CREATION'
          "
          class="d-flex align-items-center"
        >
          <b-avatar
            :text="transaction.linkedUser.firstName[0] + transaction.linkedUser.lastName[0]"
            :variant="transaction.typeId === 'SEND' ? 'danger' : 'success'"
            class="mr-3"
          ></b-avatar>
          <span class="mr-auto">
            {{ transaction.linkedUser.firstName }} {{ transaction.linkedUser.lastName }}
          </span>
          <b-badge>{{ transaction.amount | GDD }}</b-badge>
        </div>
      </b-list-group-item>
    </b-list-group>
    <!-- <div class="mt-3 mb-3" v-for="(transaction, index) in transactions" :key="transaction.id">
      <b-row
        v-if="
          index <= 7 &&
          transaction.typeId !== 'DECAY' &&
          transaction.typeId !== 'LINK_SUMMARY' &&
          transaction.typeId !== 'CREATION'
        "
      >
        <b-col>
          <div class="d-flex">
            <b-avatar
              :text="transaction.linkedUser.firstName[0] + transaction.linkedUser.lastName[0]"
              :variant="transaction.typeId === 'SEND' ? 'success' : 'danger'"
              class="mr-3"
            ></b-avatar>
            <div class="small">
              <div class="font-weight-bold">
                {{ transaction.linkedUser.firstName }} {{ transaction.linkedUser.lastName }}
              </div>
              {{ $d(new Date(transaction.balanceDate), 'short') }}
            </div>
          </div>

          <b-row class="mb-2 text-right">
            <b-col class="small">{{ $d(new Date(transaction.balanceDate), 'short') }}</b-col>
            <b-col class="small">{{ transaction.amount | GDD }}</b-col>
          </b-row>
        </b-col>
      </b-row>
    </div> -->
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
  computed: {
    avatarText() {
      return this.linkedUser.firstName[0] + this.linkedUser.lastName[0]
    },
  },
}
</script>
