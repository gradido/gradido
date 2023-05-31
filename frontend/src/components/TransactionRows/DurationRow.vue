<template>
  <div class="duration-row">
    <b-row>
      <b-col cols="12" lg="4" md="4">
        <div>{{ $t('decay.past_time') }}</div>
      </b-col>
      <b-col offset="1" offset-md="0" offset-lg="0" class="text-right mr-5">
        <span v-if="duration">{{ duration }}</span>
      </b-col>
    </b-row>
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
