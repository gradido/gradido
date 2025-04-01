<template>
  <div class="transaction-slot-receive" @click="visible = !visible">
    <BRow class="align-items-center">
      <BCol cols="3" lg="2" md="2">
        <!-- <b-avatar :text="avatarText" variant="success" size="3em"></b-avatar> -->
        <app-avatar
          class="vue3-avatar"
          :name="username.username"
          :initials="username.initials"
          :color="'#fff'"
          :size="42"
          :border="false"
        />
      </BCol>
      <BCol>
        <div>
          <name class="fw-bold" :amount="amount" :linked-user="linkedUser" :link-id="linkId" />
        </div>
        <span class="small">{{ $d(new Date(balanceDate), 'short') }}</span>
        <span class="ms-4 small">{{ $d(new Date(balanceDate), 'time') }}</span>
      </BCol>
      <BCol cols="8" lg="3" md="3" sm="8" offset="3" offset-md="0" offset-lg="0">
        <div class="small mb-2">
          {{ $t('decay.types.receive') }}
        </div>
        <div class="fw-bold gradido-global-color-accent" data-test="transaction-amount">
          {{ $filters.GDD(amount) }}
        </div>
        <div v-if="linkId" class="small">
          {{ $t('via_link') }}
          <variant-icon icon="link45deg" variant="muted" class="m-mb-1" />
        </div>
      </BCol>
      <BCol cols="12" md="1" lg="1" class="text-end">
        <collapse-icon class="text-end" :visible="visible" />
      </BCol>
    </BRow>
    <BCollapse class="pb-4 pt-lg-3" :model-value="visible">
      <decay-information
        :type-id="typeId"
        :decay="decay"
        :amount="amount"
        :memo="memo"
        :balance="balance"
        :previous-balance="previousBalance"
      />
    </BCollapse>
  </div>
</template>
<script>
import CollapseIcon from '../TransactionRows/CollapseIcon'
import Name from '../TransactionRows/Name'
import DecayInformation from '../DecayInformations/DecayInformation'

export default {
  name: 'TransactionReceive',
  components: {
    CollapseIcon,
    Name,
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
    balance: {
      type: String,
      required: true,
    },
    previousBalance: {
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
