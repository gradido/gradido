<template>
  <div class="contribution-list-item">
    <slot>
      <div class="border p-3 w-100 mb-1" :class="`border-${variant}`">
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
                @click="$emit('closeAllOpenCollapse'), getListContributionMessages"
              ></b-icon>
            </div>
          </div>
        </div>
        <div v-if="messagesCount > 0">
          <b-button
            v-if="state === 'IN_PROGRESS'"
            v-b-toggle="collapsId"
            variant="warning"
            @click="$emit('closeAllOpenCollapse'), getListContributionMessages"
          >
            {{ $t('contribution.alert.answerQuestion') }}
          </b-button>
          <b-collapse :id="collapsId" class="mt-2">
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
      </div>
    </slot>
  </div>
</template>
<script>
import ContributionMessagesList from '@/components/ContributionMessages/ContributionMessagesList.vue'
import { listContributionMessages } from '../../graphql/queries.js'

export default {
  name: 'ContributionListItem',
  components: {
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
    state: {
      type: String,
      required: false,
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
    }
  },
  computed: {
    icon() {
      if (this.deletedAt) return 'x-circle'
      if (this.confirmedAt) return 'check'
      return 'bell-fill'
    },
    variant() {
      if (this.deletedAt) return 'danger'
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
  },
  methods: {
    deleteContribution(item) {
      this.$bvModal.msgBoxConfirm(this.$t('contribution.delete')).then(async (value) => {
        if (value) this.$emit('delete-contribution', item)
      })
    },
    getListContributionMessages() {
      // console.log('getListContributionMessages', this.contributionId)
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
}
</script>
