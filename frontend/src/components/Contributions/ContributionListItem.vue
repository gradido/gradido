<template>
  <div class="contribution-list-item bg-white appBoxShadow gradido-border-radius p-3">
    <slot>
      <div class="">
        <b-row>
          <b-col cols="2">
            <b-avatar
              v-if="firstName"
              :text="avatarText"
              :badge-variant="variant"
              size="4em"
              class="font-weight-bold"
            >
              <template #badge><b-icon :icon="icon"></b-icon></template>
            </b-avatar>
            <b-avatar v-else :icon="icon" :variant="variant" size="4em"></b-avatar>
          </b-col>
          <b-col>
            <div v-if="firstName" class="mr-3 font-weight-bold">{{ firstName }} {{ lastName }}</div>
            <div class="small">
              {{ $d(new Date(contributionDate), 'monthAndYear') }}
            </div>
            <div class="mt-3 h5">{{ $t('contributionText') }}</div>
            <div>{{ memo }}</div>
            <div v-if="state === 'IN_PROGRESS'" class="text-danger">
              {{ $t('contribution.alert.answerQuestion') }}
            </div>
            <!-- <div class="small">
            contributionDate {{ $d(new Date(contributionDate), 'monthAndYear') }}
          </div>
          <div class="small">createdAt {{ createdAt }}</div> -->
          </b-col>
          <b-col cols="3">
            <div class="small">{{ $t('creation') }}</div>
            <div class="font-weight-bold h2">{{ amount | GDD }}</div>
          </b-col>
          <b-col cols="1" @click="visible = !visible">
            <collapse-icon class="text-right" :visible="visible" v-if="messagesCount > 0" />
          </b-col>
        </b-row>
        <b-row class="mt-2">
          <b-col>
            <div
              v-if="!['CONFIRMED', 'DELETED'].includes(state) && !allContribution"
              class="pointer mr-3"
              @click="deleteContribution({ id })"
            >
              <b-icon icon="trash"></b-icon>
              {{ $t('delete') }}
            </div>
          </b-col>
          <b-col>
            <div
              v-if="!['CONFIRMED', 'DELETED'].includes(state) && !allContribution"
              class="pointer mr-3"
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
              {{ $t('edit') }}
            </div>
          </b-col>

          <b-col>
            <div v-if="messagesCount > 0" class="pointer">
              <b-icon icon="chat-dots" @click="visible = !visible"></b-icon>
              {{ $t('moderatorChat') }}
            </div>
          </b-col>
        </b-row>
      </div>
      <!-- <div class="border p-3 w-100 mb-1" :class="`border-${variant}`">
        <div>
          <div class="d-inline-flex">
            <div class="mr-2">
              <b-icon
                v-if="state === 'IN_PROGRESS'"
                icon="question-square"
                font-scale="2"
                variant="warning"
              ></b-icon>
              <b-icon v-else :icon="icon" :variant="variant" class="h2"></b-icon>
            </div>
            <div v-if="firstName" class="mr-3">{{ firstName }} {{ lastName }}</div>
            <div class="mr-2" :class="state !== 'DELETED' ? 'font-weight-bold' : ''">
              {{ amount | GDD }}
            </div>
            {{ $t('math.minus') }}
            <div class="mx-2">{{ $d(new Date(date), 'short') }}</div>
          </div>
          <div class="mr-2">
            <span>{{ $t('contribution.date') }}</span>
            <span>
              {{ $d(new Date(contributionDate), 'monthAndYear') }}
            </span>
          </div>
          <div class="mr-2">{{ memo }}</div>
          <div class="d-flex flex-row-reverse">
            <div
              v-if="!['CONFIRMED', 'DELETED'].includes(state) && !allContribution"
              class="pointer ml-5"
              @click="
                $emit('closeAllOpenCollapse'),
                  $emit('update-contribution-form', {
                    id: id,
                    contributionDate: contributionDate,
                    memo: memo,
                    amount: amount,
                  })
              "
            >
              <b-icon icon="pencil" class="h2"></b-icon>
            </div>
            <div
              v-if="!['CONFIRMED', 'DELETED'].includes(state) && !allContribution"
              class="pointer"
              @click="deleteContribution({ id })"
            >
              <b-icon icon="trash" class="h2"></b-icon>
            </div>
            <div v-if="messagesCount > 0" class="pointer">
              <b-icon
                v-b-toggle="collapsId"
                icon="chat-dots"
                class="h2 mr-5"
                @click="getListContributionMessages"
              ></b-icon>
            </div>
          </div>
        </div>
        <div v-if="messagesCount > 0">
          <b-button
            v-if="state === 'IN_PROGRESS'"
            v-b-toggle="collapsId"
            variant="warning"
            @click="getListContributionMessages"
          >
            {{ $t('contribution.alert.answerQuestion') }}
          </b-button>
          <b-collapse :id="collapsId" class="mt-2" v-model="visible">
            <b-card>
              <contribution-messages-list
                :messages="messages_get"
                :state="state"
                :contributionId="contributionId"
                @get-list-contribution-messages="getListContributionMessages"
                @update-state="updateState"
              />
            </b-card>
          </b-collapse>
        </div>
      </div> -->
      <b-collapse :id="collapsId" class="mt-2" v-model="visible">
        <b-card>
          <contribution-messages-list
            :messages="messages_get"
            :state="state"
            :contributionId="contributionId"
            @get-list-contribution-messages="getListContributionMessages"
            @update-state="updateState"
          />
        </b-card>
      </b-collapse>
    </slot>
  </div>
</template>
<script>
import CollapseIcon from '../TransactionRows/CollapseIcon'
import ContributionMessagesList from '@/components/ContributionMessages/ContributionMessagesList.vue'
import { listContributionMessages } from '../../graphql/queries.js'

export default {
  name: 'ContributionListItem',
  components: {
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
      if (this.deletedAt) return 'x-circle'
      if (this.deniedAt) return 'x-circle'
      if (this.confirmedAt) return 'check'
      if (this.state === 'IN_PROGRESS') return 'question-square'
      return 'bell-fill'
    },
    variant() {
      if (this.deletedAt) return 'danger'
      if (this.deniedAt) return 'danger'
      if (this.confirmedAt) return 'success'
      if (this.state === 'IN_PROGRESS') return 'warning'
      return 'primary'
    },
    date() {
      return this.createdAt
    },
    collapsId() {
      return 'collapse' + String(this.id)
    },
    avatarText() {
      return this.firstName[0] + this.lastName[0]
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
          // console.log('result', result.data.listContributionMessages.messages)
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
