<template>
  <div class="federation-visualize-item">
    <BRow>
      <BCol>
        <variant-icon :icon="icon" :variant="variant" />
      </BCol>
      <BCol class="ml-1">{{ item.apiVersion }}</BCol>
      <BCol>
        <span v-b-tooltip="`${item.createdAt}`">
          {{ distanceDate(item.createdAt) }}
        </span>
      </BCol>
      <BCol>
        <span v-b-tooltip="`${item.lastAnnouncedAt}`">
          {{ distanceDate(item.lastAnnouncedAt) }}
        </span>
      </BCol>
      <BCol>
        <span v-b-tooltip="`${item.verifiedAt}`">
          {{ distanceDate(item.verifiedAt) }}
        </span>
      </BCol>
      <BCol>
        <span v-b-tooltip="`${item.lastErrorAt}`">
          {{ distanceDate(item.lastErrorAt) }}
        </span>
      </BCol>
    </BRow>
  </div>
</template>
<script>
import { formatDistanceToNow } from 'date-fns'
import { useDateLocale } from '@/composables/useDateLocale'
import VariantIcon from '@/components/VariantIcon.vue'

export default {
  name: 'FederationVisualizeItem',
  components: { VariantIcon },
  props: {
    item: { type: Object },
  },
  computed: {
    verified() {
      return new Date(this.item.verifiedAt) >= new Date(this.item.lastAnnouncedAt)
    },
    icon() {
      return this.verified ? 'check' : 'x-circle'
    },
    variant() {
      return this.verified ? 'success' : 'danger'
    },
  },
  methods: {
    distanceDate(dateString) {
      return dateString
        ? formatDistanceToNow(new Date(dateString), {
            includeSecond: true,
            addSuffix: true,
            locale: useDateLocale(),
          })
        : ''
    },
  },
}
</script>
