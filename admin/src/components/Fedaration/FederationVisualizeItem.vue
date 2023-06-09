<template>
  <div class="federation-visualize-item">
    <b-row>
      <b-col cols="1"><b-icon :icon="icon" :variant="variant" class="mr-4"></b-icon></b-col>
      <b-col>
        <div>{{ item.url }}</div>
        <small>{{ `${item.publicKey.substring(0, 26)}…` }}</small>
      </b-col>
      <b-col cols="2">{{ lastAnnouncedAt }}</b-col>
      <b-col cols="2">{{ createdAt }}</b-col>
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
  data() {
    return {
      formatDistanceToNow,
      locale: this.$i18n.locale,
    }
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
    lastAnnouncedAt() {
      if (this.item.lastAnnouncedAt) {
        return formatDistanceToNow(new Date(this.item.lastAnnouncedAt), {
          includeSecond: true,
          addSuffix: true,
          locale: locales[this.locale],
        })
      }
      return ''
    },
    createdAt() {
      if (this.item.createdAt) {
        return formatDistanceToNow(new Date(this.item.createdAt), {
          includeSecond: true,
          addSuffix: true,
          locale: locales[this.locale],
        })
      }
      return ''
    },
  },
}
</script>
