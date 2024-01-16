<template>
  <div class="federation-visualize-item">
    <b-row>
      <b-col><b-icon :icon="icon" :variant="variant" class="mr-4"></b-icon></b-col>
      <b-col class="ml-1">{{ item.apiVersion }}</b-col>
      <b-col v-b-tooltip="item.createdAt">{{ distanceDate(item.createdAt) }}</b-col>
      <b-col v-b-tooltip="item.lastAnnouncedAt">{{ distanceDate(item.lastAnnouncedAt) }}</b-col>
      <b-col v-b-tooltip="item.verifiedAt">{{ distanceDate(item.verifiedAt) }}</b-col>
      <b-col v-b-tooltip="item.lastErrorAt">{{ distanceDate(item.lastErrorAt) }}</b-col>
    </b-row>
  </div>
</template>
<script>
import { formatDistanceToNow } from 'date-fns'
import { de, enUS as en, fr, es, nl } from 'date-fns/locale'

const locales = { en, de, es, fr, nl }

export default {
  name: 'FederationVisualizeItem',
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
            locale: locales[this.$i18n.locale],
          })
        : ''
    },
  },
}
</script>
