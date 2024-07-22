<template>
  <div>
    <div class="d-flex">
      <BFormInput
        type="text"
        class="test-input-criteria"
        v-model="currentValue"
        :placeholder="placeholderText"
      />
      <div append class="test-click-clear-criteria" @click="onClear">
        <BInputGroupText class="pointer h-100">
          <IIcBaselineClose />
        </BInputGroupText>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { BInputGroupText, BFormInput } from 'bootstrap-vue-next'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()

const placeholderText = computed(() => props.placeholder || t('user_search'))

const onClear = () => {
  currentValue.value = ''
}

const currentValue = ref(props.modelValue)

watch(currentValue, (newValue) => {
  emit('update:modelValue', newValue)
})

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue !== currentValue.value) {
      currentValue.value = newValue
    }
  },
)
</script>
