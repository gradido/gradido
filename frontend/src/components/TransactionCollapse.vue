<template>
  <div class="gdt-transaction-collapse py-4 mb-4 gradido-no-border">
    <BRow class="gdt-list-collapse-header-text mb-3">
      <BCol class="collapse-headline">
        <b>{{ getLinesByType.headline }}</b>
      </BCol>
    </BRow>
    <BRow class="gdt-list-collapse-box--all">
      <BCol cols="12" lg="4" md="4">
        <div class="collapse-first">{{ getLinesByType.first }}</div>
        <div class="collapse-second">{{ getLinesByType.second }}</div>
      </BCol>
      <BCol offset="1" offset-md="0" offset-lg="0">
        <div class="collapse-firstMath">{{ getLinesByType.firstMath }}</div>
        <div class="collapse-secondMath">
          {{ getLinesByType.secondMath }}
        </div>
      </BCol>
    </BRow>
  </div>
</template>
<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { GdtEntryType } from '@/graphql/enums'

const props = defineProps({
  amount: { type: Number },
  gdtEntryType: { type: String, default: GdtEntryType.FORM },
  factor: { type: Number },
  gdt: { type: Number },
})

const { t, n } = useI18n()

const getLinesByType = computed(() => {
  switch (props.gdtEntryType) {
    case GdtEntryType.FORM:
    case GdtEntryType.CVS:
    case GdtEntryType.ELOPAGE:
    case GdtEntryType.DIGISTORE:
    case GdtEntryType.CVS2: {
      return {
        headline: t('gdt.calculation'),
        first: t('gdt.factor'),
        firstMath: props.factor + ' GDT pro €',
        second: t('gdt.formula'),
        secondMath:
          n(props.amount, 'decimal') +
          ' € * ' +
          props.factor +
          ' GDT / € = ' +
          n(props.gdt, 'decimal') +
          ' GDT',
      }
    }
    case GdtEntryType.ELOPAGE_PUBLISHER: {
      return {
        headline: t('gdt.publisher'),
        first: null,
        firstMath: null,
        second: null,
        secondMath: null,
      }
    }
    case GdtEntryType.GLOBAL_MODIFICATOR: {
      return {
        headline: t('gdt.conversion-gdt-euro'),
        first: t('gdt.raise'),
        firstMath: props.factor * 100 + ' % ',
        second: t('gdt.conversion'),
        secondMath:
          n(props.amount, 'decimal') +
          ' GDT * ' +
          props.factor * 100 +
          ' % = ' +
          n(props.gdt, 'decimal') +
          ' GDT',
      }
    }
    default:
      throw new Error('no additional transaction info for this type: ' + props.gdtEntryType)
  }
})
</script>
