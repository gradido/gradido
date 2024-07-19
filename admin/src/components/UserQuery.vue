<template>
  <div>
    <div class="d-flex">
      <BFormInput
        type="text"
        class="test-input-criteria"
        v-model="currentValue"
        :placeholder="placeholderText"
      />
      <div append class="test-click-clear-criteria" @click="clearValue">
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
  value: { type: String, default: '' },
  placeholder: { type: String, default: '' },
})

const emit = defineEmits(['input'])

const { t } = useI18n()

const currentValue = ref(props.value)

const placeholderText = computed(() => props.placeholder || t('user_search'))

const clearValue = () => {
  currentValue.value = ''
}

watch(currentValue, (newValue) => {
  if (props.value !== newValue) {
    emit('input', newValue)
  }
})
</script>
