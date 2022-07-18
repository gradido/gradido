<template>
  <div>
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
        <div class="mr-2">{{ memo }}</div>
        <div
          v-if="type === 'pending' && !firstName"
          class="text-right pointer"
          @click="
            $emit('update-contribution-form', {
              id: id,
              createdAt: createdAt,
              memo: memo,
              amount: amount,
            })
          "
        >
          <b-icon icon="pencil" class="h2"></b-icon>
        </div>
      </div>
    </slot>
  </div>
</template>
<script>
export default {
  name: 'ContributionListItem',
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
      require: false,
    },
    lastName: {
      type: String,
      require: false,
    },
    createdAt: {
      type: String,
    },
    deletedAt: {
      type: String,
    },
    confirmedBy: {
      type: Number,
    },
    confirmedAt: {
      type: String,
    },
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
      if (this.deletedAt) return this.deletedAt
      if (this.confirmedAt) return this.confirmedAt
      return this.createdAt
    },
  },
  methods: {
    updateContributionForm(item) {
      this.$emit('update-contribution-form', item)
    },
  },
}
</script>
