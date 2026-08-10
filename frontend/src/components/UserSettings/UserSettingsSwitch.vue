<template>
  <div class="form-user-switch" @click="onClick">
    <BFormCheckbox
      test="BFormCheckbox"
      name="check-button"
      :disabled="disabled"
      switch
      :model-value="props.defer ? value : props.initialValue"
      @update:model-value="onChange"
    />
  </div>
</template>
<script setup>
import { ref, computed, watch } from 'vue'
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
  // Off by default, so a page that says nothing keeps saving on the spot. The
  // matching page sets it: there this switch belongs to a set that reaches the
  // server together, when someone presses save.
  defer: { type: Boolean, default: false },
})

// While deferring, nothing commits to the store, so initialValue would not move
// and the switch would flick straight back under the finger. It shows this local
// value instead — and follows initialValue again once the page has saved.
const value = ref(props.initialValue)
watch(
  () => props.initialValue,
  (next) => {
    value.value = next
  },
)

const isDisabled = computed(() => {
  return props.disabled
})

const { mutate: updateUserData } = useMutation(updateUserInfos)

const onChange = async (evtPayload) => {
  if (isDisabled.value) return
  if (props.defer) {
    // Tell the page, save nothing.
    value.value = evtPayload
    emit('value-changed', evtPayload)
    return
  }
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
