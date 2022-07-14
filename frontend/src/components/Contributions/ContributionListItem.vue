<template>
  <div>
    <slot>
      <div class="border p-3 w-100 mb-1" :class="`border-${variant}`">
        <div class="d-inline-flex">
          <div class="mr-2"><b-icon :icon="icon" :variant="variant" class="h2"></b-icon></div>
          <div class="mr-2" :class="type != 'deleted' ? 'font-weight-bold' : ''">
            {{ amount | GDD }}
          </div>
          {{ $t('math.minus') }}
          <div class="mx-2">{{ $d(new Date(date), 'short') }}</div>
        </div>
        <div class="mr-2">{{ memo }}</div>
        <div v-if="type === 'pending'" class="text-right pointer">
          <b-icon icon="pencil" class="h2"></b-icon>
        </div>
        <div v-if="type === 'deleted'" class="text-right pointer">
          <b-icon icon="trash-fill" class="h2"></b-icon>
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
      if (this.deletedAt !== null) return 'deleted'
      if (this.confirmedAt !== null) return 'confirmed'
      return 'pending'
    },
    icon() {
      if (this.deletedAt !== null) return 'x-circle'
      if (this.confirmedAt !== null) return 'check'
      return 'bell-fill'
    },
    variant() {
      if (this.deletedAt !== null) return 'danger'
      if (this.confirmedAt !== null) return 'success'
      return 'primary'
    },
    date() {
      if (this.deletedAt !== null) return this.deletedAt
      if (this.confirmedAt !== null) return this.confirmedAt
      return this.createdAt
    },
  },
}
</script>
