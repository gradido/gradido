<template>
  <div class="form-user-switch" @click="onClick">
    <BFormCheckbox
      test="BFormCheckbox"
      name="check-button"
      :disabled="disabled"
      switch
      :model-value="props.initialValue"
      @update:model-value="onChange"
    />
  </div>
</template>
<script setup>
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import { updateUserInfos } from '@/graphql/mutations'
import { useMutation } from '@vue/apollo-composable'
import { BFormCheckbox } from 'bootstrap-vue-next'
import { useAppToast } from '@/composables/useToast'

const store = useStore()
const { toastSuccess, toastError } = useAppToast()

const props = defineProps({
  initialValue: { type: Boolean, default: false },
  attrName: { type: String },
  enabledText: { type: String },
  disabledText: { type: String },
  disabled: { type: Boolean, default: false },
  notAllowedText: { type: String, default: undefined },
})

const value = ref(props.initialValue)

const isDisabled = computed(() => {
  return props.disabled
})

const { mutate: updateUserData } = useMutation(updateUserInfos)

const onChange = async (evtPayload) => {
  if (isDisabled.value) return
  const variables = []
  variables[props.attrName] = evtPayload
  try {
    await updateUserData({ ...variables })
    store.commit(props.attrName, evtPayload)
    emit('value-changed', evtPayload)
    toastSuccess(evtPayload ? props.enabledText : props.disabledText)
  } catch (error) {
    value.value = props.initialValue
    toastError(error.message)
  }
}

const onClick = () => {
  if (props.notAllowedText && props.disabled) {
    toastError(props.notAllowedText)
  }
}

const emit = defineEmits(['value-changed'])
</script>
