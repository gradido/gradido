<template>
  <div class="contribution-list-item">
    <slot>
      <div class="border p-3 w-100 mb-1" :class="`border-${variant}`">
        <div class="d-inline-flex">
          <div class="mr-2"><b-icon :icon="icon" :variant="variant" class="h2"></b-icon></div>
          <div v-if="firstName" class="mr-3">{{ firstName }} {{ lastName }}</div>
          <div class="mr-2" :class="type != 'deleted' ? 'font-weight-bold' : ''">
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
        <div v-if="type === 'pending' && !firstName" class="d-flex flex-row-reverse">
          <div
            class="pointer ml-5"
            @click="
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
          <div class="pointer" @click="deleteContribution({ id })">
            <b-icon icon="trash" class="h2"></b-icon>
          </div>
          <div v-if="inProcess && type === 'pending'" class="pointer">
            <b-icon v-b-toggle="collapsId" icon="chat-dots" class="h2 mr-5"></b-icon>
          </div>
        </div>

        <div v-if="inProcess && type === 'pending'">
          <b-button v-if="inProcess && id > 36" v-b-toggle="collapsId" variant="primary">
            Bitte beantworte die Nachfrage
          </b-button>
          <b-collapse :id="collapsId" class="mt-2">
            <b-card>
              <contribution-messages-list />
            </b-card>
          </b-collapse>
        </div>
      </div>
    </slot>
  </div>
</template>
<script>
import ContributionMessagesList from '@/components/ContributionMessages/ContributionMessagesList.vue'

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
  },
  data() {
    return {
      inProcess: true,
    }
  },
  computed: {
    type() {
      if (this.deletedAt) return 'deleted'
      if (this.confirmedAt) return 'confirmed'
      return 'pending'
    },
    icon() {
      if (this.deletedAt) return 'x-circle'
      if (this.confirmedAt) return 'check'
      return 'bell-fill'
    },
    variant() {
      if (this.deletedAt) return 'danger'
      if (this.confirmedAt) return 'success'
      return 'primary'
    },
    date() {
      // if (this.deletedAt) return this.deletedAt
      // if (this.confirmedAt) return this.confirmedAt
      // return this.contributionDate
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
  },
}
</script>
