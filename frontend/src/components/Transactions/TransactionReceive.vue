<template>
  <div class="transaction-slot-receive">
    <b-row @click="visible = !visible" class="align-items-center">
      <b-col cols="2">
        <!-- <b-avatar :text="avatarText" variant="success" size="3em"></b-avatar> -->
        <avatar
          :username="username.username"
          :initials="username.initials"
          :color="'#fff'"
          size="42"
        ></avatar>
      </b-col>
      <b-col>
        <div>
          <name
            class="font-weight-bold"
            v-on="$listeners"
            :amount="amount"
            :linkedUser="linkedUser"
            :linkId="linkId"
          />
        </div>
        <span class="small">{{ this.$d(new Date(balanceDate), 'short') }}</span>
        <span class="ml-4 small">{{ this.$d(new Date(balanceDate), 'time') }}</span>
        <div class="word-break">{{ memo }}</div>
      </b-col>
      <b-col cols="3">
        <div class="small">
          {{ $t('decay.types.receive') }}
        </div>
        <div class="font-weight-bold gradido-global-color-accent">{{ amount | GDD }}</div>
        <div v-if="linkId" class="small">
          {{ $t('via_link') }}
          <b-icon
            icon="link45deg"
            variant="muted"
            class="m-mb-1"
            :title="$t('gdd_per_link.redeemed-title')"
          />
        </div>
      </b-col>
      <b-col cols="1"><collapse-icon class="text-right" :visible="visible" /></b-col>
    </b-row>
    <b-collapse class="pb-4 pt-5" v-model="visible">
      <decay-information :typeId="typeId" :decay="decay" :amount="amount" />
    </b-collapse>
  </div>
</template>
<script>
import Avatar from 'vue-avatar'
import CollapseIcon from '../TransactionRows/CollapseIcon'
// import TypeIcon from '../TransactionRows/TypeIcon'
import Name from '../TransactionRows/Name'
// import MemoRow from '../TransactionRows/MemoRow'
// import DateRow from '../TransactionRows/DateRow'
// import DecayRow from '../TransactionRows/DecayRow'
import DecayInformation from '../DecayInformations/DecayInformation'

export default {
  name: 'TransactionReceive',
  components: {
    Avatar,
    CollapseIcon,
    // TypeIcon,
    Name,
    // MemoRow,
    // DateRow,
    // DecayRow,
    DecayInformation,
  },
  props: {
    amount: {
      type: String,
      required: true,
    },
    balanceDate: {
      type: String,
      required: true,
    },
    decay: {
      type: Object,
      required: true,
    },
    linkedUser: {
      type: Object,
      required: true,
    },
    memo: {
      type: String,
      required: true,
    },
    typeId: {
      type: String,
    },
    previousBookedBalance: {
      type: String,
      required: true,
    },
    linkId: {
      type: Number,
      required: false,
      default: null,
    },
  },
  data() {
    return {
      visible: false,
    }
  },
  computed: {
    username() {
      return {
        username: `${this.linkedUser.firstName} ${this.linkedUser.lastName}`,
        initials: `${this.linkedUser.firstName[0]}${this.linkedUser.lastName[0]}`,
      }
    },
  },
}
</script>
