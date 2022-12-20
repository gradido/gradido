<template>
  <div class="rightside-last-transactions d-none d-lg-block">
    <b-row class="mb-3">
      <b-col class="h3">{{ $t('transaction.lastTransactions') }}</b-col>
      <!-- <b-col cols="1" class="text-right">
        <b-icon icon="three-dots-vertical"></b-icon>
      </b-col> -->
    </b-row>
    <!-- <b-list-group class="mt-5"> -->
    <div v-for="(transaction, index) in transactions" :key="transaction.id">
      <b-row
        align-v="center"
        v-if="
          index <= 8 &&
          transaction.typeId !== 'DECAY' &&
          transaction.typeId !== 'LINK_SUMMARY' &&
          transaction.typeId !== 'CREATION'
        "
        class="mb-4"
      >
        <b-col cols="auto">
          <div class="align-items-center">
            <avatar
              :size="72"
              :color="'#fff'"
              :username="`${transaction.linkedUser.firstName} ${transaction.linkedUser.lastName}`"
            ></avatar>
          </div>
        </b-col>
        <b-col align-self="stretch p-1">
          <b-row>
            <b-col>
              <div class="font-weight-bold">
                <name
                  :linkedUser="transaction.linkedUser"
                  v-on="$listeners"
                  fontColor="text-dark"
                />
              </div>
              <div class="d-flex mt-3">
                <div class="small">
                  {{ transaction.amount | GDD }}
                </div>
                <div class="small ml-3 text-right">
                  {{ $d(new Date(transaction.balanceDate), 'short') }}
                </div>
              </div>
            </b-col>
          </b-row>
        </b-col>
      </b-row>
      <!-- <b-list-group-item
          class="border-0"
          v-if="
            index <= 7 &&
            transaction.typeId !== 'DECAY' &&
            transaction.typeId !== 'LINK_SUMMARY' &&
            transaction.typeId !== 'CREATION'
          "
        >
          <div class="d-flex align-items-center">
            <avatar
              :username="`${transaction.linkedUser.firstName} ${transaction.linkedUser.lastName}`"
            ></avatar>
            <span>
              <name :linkedUser="transaction.linkedUser" @set-tunneled-email="setTunneledEmail" />
            </span>
            <b-badge>{{ transaction.amount | GDD }}</b-badge>
          </div>
        </b-list-group-item> -->
    </div>
    <!-- </b-list-group> -->
  </div>
</template>
<script>
import Avatar from 'vue-avatar'
import Name from '@/components/TransactionRows/Name.vue'

export default {
  name: 'LastTransactions',
  components: {
    Avatar,
    Name,
  },
  props: {
    transactions: {
      default: () => [],
    },
    transactionCount: { type: Number, default: 0 },
    transactionLinkCount: { type: Number, default: 0 },
  },
}
</script>
