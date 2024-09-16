<template>
  <div class="duration-row">
    <BRow>
      <BCol cols="6" lg="4" md="6" sm="6">
        <div>{{ $t('decay.past_time') }}</div>
      </BCol>
      <BCol offset="0" class="text-end me-0">
        <span v-if="duration">{{ duration }}</span>
      </BCol>
    </BRow>
  </div>
</template>
<script>
import { formatDistance } from 'date-fns'
import { enUS as en, de, es, fr, nl } from 'date-fns/locale'

const locales = { en, de, es, fr, nl }

export default {
  name: 'DurationRow',
  props: {
    decayStart: {
      type: String,
      required: true,
    },
    decayEnd: {
      type: String,
      required: true,
    },
  },
  computed: {
    duration() {
      return formatDistance(new Date(this.decayEnd), new Date(this.decayStart), {
        locale: locales[this.$i18n.locale],
      })
    },
  },
}
</script>
