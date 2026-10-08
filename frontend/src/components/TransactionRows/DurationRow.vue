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
<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatDistance } from 'date-fns'
import { enUS as en, de, es, fr, nl } from 'date-fns/locale'

const locales = { en, de, es, fr, nl }

const props = defineProps({
  decayStart: {
    type: String,
    required: true,
  },
  decayEnd: {
    type: String,
    required: true,
  },
})

const { locale } = useI18n()

const duration = computed(() =>
  formatDistance(new Date(props.decayEnd), new Date(props.decayStart), {
    locale: locales[locale.value],
  }),
)
</script>
