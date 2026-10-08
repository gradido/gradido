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
<script setup>
import { computed } from 'vue'
import { formatDistanceToNow } from 'date-fns'
import { useDateLocale } from '@/composables/useDateLocale'
import VariantIcon from '@/components/VariantIcon.vue'

const props = defineProps({
  item: { type: Object },
})

const verified = computed(
  () => new Date(props.item.verifiedAt) >= new Date(props.item.lastAnnouncedAt),
)
const icon = computed(() => (verified.value ? 'check' : 'x-circle'))
const variant = computed(() => (verified.value ? 'success' : 'danger'))

const distanceDate = (dateString) =>
  dateString
    ? formatDistanceToNow(new Date(dateString), {
        includeSecond: true,
        addSuffix: true,
        locale: useDateLocale(),
      })
    : ''
</script>
