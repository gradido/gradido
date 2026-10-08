<template>
  <div class="collapse-links-list">
    <div class="d-flex">
      <div class="w-100">
        <hr />
        <div>
          <transaction-link
            v-for="item in transactionLinks"
            v-bind="item"
            :key="item.id"
            @reset-transaction-link-list="resetTransactionLinkList"
          />
          <div class="mb-3">
            <BButton
              v-if="!pending && transactionLinks.length < transactionLinkCount"
              class="test-button-load-more w-100 rounded-5"
              block
              variant="outline-primary"
              @click.stop="loadMoreLinks"
            >
              {{ buttonText }}
            </BButton>
            <div class="text-center">
              <IBiThreeDots v-if="pending" animation="cylon" font-scale="4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import TransactionLink from '@/components/TransactionLinks/TransactionLink'

const props = defineProps({
  transactionLinks: { type: Array, required: true },
  transactionLinkCount: {
    type: Number,
    required: true,
  },
  modelValue: { type: Number, required: true },
  pageSize: { type: Number, default: 5 },
  pending: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()

const buttonText = computed(() => {
  const i = props.transactionLinkCount - props.transactionLinks.length
  // ONE, not zero: the count is what the sentence is about, and every plural rule
  // reads 1 as the singular. Zero landed on the plural form in every language --
  // "die letzten 0 Links nachladen" -- because zero is not one.
  if (i === 1) return t('link-load', 1)
  if (i <= props.pageSize) return t('link-load', { n: i })
  return t('link-load-more', { n: props.pageSize })
})

const resetTransactionLinkList = () => {
  emit('update:modelValue', 0)
}
const loadMoreLinks = () => {
  emit('update:modelValue', props.modelValue + 1)
}
</script>
