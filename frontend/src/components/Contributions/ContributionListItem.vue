<template>
  <div>
    <div
      class="contribution-list-item bg-white appBoxShadow gradido-border-radius pt-3 px-3"
      :class="state === 'IN_PROGRESS' ? 'pulse border border-205' : ''"
    >
      <b-row>
        <b-col cols="3" lg="2" md="2">
          <avatar
            v-if="firstName"
            :username="username.username"
            :initials="username.initials"
            color="#fff"
            class="font-weight-bold"
          ></avatar>
          <b-avatar v-else :icon="icon" :variant="variant" size="3em"></b-avatar>
        </b-col>
        <b-col>
          <div v-if="firstName" class="mr-3 font-weight-bold">
            {{ firstName }} {{ lastName }}
            <b-icon :icon="icon" :variant="variant"></b-icon>
          </div>
          <div class="small">
            {{ $d(new Date(contributionDate), 'monthAndYear') }}
          </div>
          <div class="mt-3 font-weight-bold">{{ $t('contributionText') }}</div>
          <div class="mb-3 text-break word-break">{{ memo }}</div>
          <div v-if="state === 'IN_PROGRESS'" class="text-205">
            {{ $t('contribution.alert.answerQuestion') }}
          </div>
        </b-col>
        <b-col cols="9" lg="3" offset="3" offset-md="0" offset-lg="0">
          <div class="small">
            {{ $t('creation') }} {{ $t('(') }}{{ amount / 20 }} {{ $t('h') }}{{ $t(')') }}
          </div>
          <div v-if="state === 'DENIED' && allContribution" class="font-weight-bold">
            <b-icon icon="x-circle" variant="danger"></b-icon>
            {{ $t('contribution.alert.rejected') }}
          </div>
          <div v-if="state === 'DELETED'" class="small">
            {{ $t('contribution.deleted') }}
          </div>
          <div v-else class="font-weight-bold">{{ amount | GDD }}</div>
        </b-col>
        <b-col cols="12" md="1" lg="1" class="text-right align-items-center">
          <div v-if="messagesCount > 0" @click="visible = !visible">
            <collapse-icon class="text-right" :visible="visible" />
          </div>
        </b-col>
      </b-row>
      <b-row
        v-if="(!['CONFIRMED', 'DELETED'].includes(state) && !allContribution) || messagesCount > 0"
        class="p-2"
      >
        <b-col cols="3" class="mr-auto text-center">
          <div
            v-if="!['CONFIRMED', 'DELETED'].includes(state) && !allContribution"
            class="test-delete-contribution pointer mr-3"
            @click="deleteContribution({ id })"
          >
            <b-icon icon="trash"></b-icon>

            <div>{{ $t('delete') }}</div>
          </div>
        </b-col>
        <b-col cols="3" class="text-center">
          <div
            v-if="!['CONFIRMED', 'DELETED'].includes(state) && !allContribution"
            class="test-edit-contribution pointer mr-3"
            @click="
              $emit('update-contribution-form', {
                id: id,
                contributionDate: contributionDate,
                memo: memo,
                amount: amount,
              })
            "
          >
            <b-icon icon="pencil"></b-icon>
            <div>{{ $t('edit') }}</div>
          </div>
        </b-col>

        <b-col cols="6" class="text-center">
          <div v-if="messagesCount > 0" class="pointer" @click="visible = !visible">
            <b-icon icon="chat-dots"></b-icon>
            <div>{{ $t('moderatorChat') }}</div>
          </div>
        </b-col>
      </b-row>
      <div v-else class="pb-3"></div>
      <b-collapse :id="collapsId" class="mt-2" v-model="visible">
        <contribution-messages-list
          :messages="messages_get"
          :state="state"
          :contributionId="contributionId"
          @get-list-contribution-messages="getListContributionMessages"
          @update-state="updateState"
        />
      </b-collapse>
    </div>
  </div>
</template>
<script>
import Avatar from 'vue-avatar'
import CollapseIcon from '../TransactionRows/CollapseIcon'
import ContributionMessagesList from '@/components/ContributionMessages/ContributionMessagesList.vue'
import { listContributionMessages } from '../../graphql/queries.js'

export default {
  name: 'ContributionListItem',
  components: {
    Avatar,
    CollapseIcon,
    ContributionMessagesList,
  },
  props: {
    id: {
      type: Number,
    },
    amount: {
      type: String,
    },
    memo: {
      type: String,
    },
    firstName: {
      type: String,
      required: false,
    },
    lastName: {
      type: String,
      required: false,
    },
    createdAt: {
      type: String,
    },
    contributionDate: {
      type: String,
    },
    deletedAt: {
      type: String,
      required: false,
    },
    confirmedBy: {
      type: Number,
      required: false,
    },
    confirmedAt: {
      type: String,
      required: false,
    },
    deniedBy: {
      type: Number,
      required: false,
    },
    deniedAt: {
      type: String,
      required: false,
    },
    state: {
      type: String,
      required: false,
      default: '',
    },
    messagesCount: {
      type: Number,
      required: false,
    },
    contributionId: {
      type: Number,
      required: true,
    },
    allContribution: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  data() {
    return {
      inProcess: true,
      messages_get: [],
      visible: false,
    }
  },
  computed: {
    icon() {
      if (this.deletedAt) return 'trash'
      if (this.deniedAt) return 'x-circle'
      if (this.confirmedAt) return 'check'
      if (this.state === 'IN_PROGRESS') return 'question-circle'
      return 'bell-fill'
    },
    variant() {
      if (this.deletedAt) return 'danger'
      if (this.deniedAt) return 'warning'
      if (this.confirmedAt) return 'success'
      if (this.state === 'IN_PROGRESS') return 'f5'
      return 'primary'
    },
    date() {
      return this.createdAt
    },
    collapsId() {
      return 'collapse' + String(this.id)
    },
    username() {
      return {
        username: `${this.firstName} ${this.lastName}`,
        initials: `${this.firstName[0]}${this.lastName[0]}`,
      }
    },
  },
  methods: {
    deleteContribution(item) {
      this.$bvModal.msgBoxConfirm(this.$t('contribution.delete')).then(async (value) => {
        if (value) this.$emit('delete-contribution', item)
      })
    },
    getListContributionMessages(closeCollapse = true) {
      if (closeCollapse) {
        this.$emit('closeAllOpenCollapse')
      }
      this.$apollo
        .query({
          query: listContributionMessages,
          variables: {
            contributionId: this.contributionId,
          },
          fetchPolicy: 'no-cache',
        })
        .then((result) => {
          this.messages_get = result.data.listContributionMessages.messages
        })
        .catch((error) => {
          this.toastError(error.message)
        })
    },
    updateState(id) {
      this.$emit('update-state', id)
    },
  },
  watch: {
    visible() {
      if (this.visible) this.getListContributionMessages()
    },
  },
}
</script>
