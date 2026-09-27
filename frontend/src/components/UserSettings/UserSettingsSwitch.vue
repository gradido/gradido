<template>
  <div
    ref="root"
    class="form-user-switch"
    :class="{ 'is-locked': props.locked }"
    @click.capture="onLockedClick"
    @click="onClick"
  >
    <BFormCheckbox
      test="BFormCheckbox"
      name="check-button"
      :disabled="disabled"
      :aria-label="props.label"
      switch
      :model-value="props.defer ? value : props.initialValue"
      @update:model-value="onChange"
    />
  </div>
</template>
<script setup>
import { ref, computed, watch, watchPostEffect } from 'vue'
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
  // Held where it stands, and a tap or Space says why (notAllowedText). Not the native
  // disabled attribute: Tab skips a disabled control, so a keyboard could never reach it and
  // learn why it does not move. The matching page holds findability until there is a home.
  locked: { type: Boolean, default: false },
  // The switch's name for a screen reader; the words beside it are not tied to it.
  label: { type: String, default: undefined },
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

// On the way down, before the checkbox takes the click: cancelled there, the switch does
// not move and reports no change. The keyboard arrives here too - Space on a checkbox is a
// click.
const onLockedClick = (event) => {
  if (!props.locked) return
  event.preventDefault()
  if (props.notAllowedText) toastError(props.notAllowedText)
}

// For a screen reader, the lock is said on the input itself. Set here and not passed to
// BFormCheckbox: bootstrap-vue-next 0.26.8 copies extra attributes to its input once, when
// it is created, and never again - and the lock comes later, when the page has heard where
// the member lives. Its own props follow as usual: the name goes in as ariaLabel.
const root = ref(null)
watchPostEffect(() => {
  const input = root.value?.querySelector('input')
  if (!input) return
  if (props.locked) input.setAttribute('aria-disabled', 'true')
  else input.removeAttribute('aria-disabled')
})

const emit = defineEmits(['value-changed'])
</script>

<style scoped>
/* The look of a disabled switch (Bootstrap dims it to half), for a switch that still takes
   the tap. */
.is-locked :deep(.form-check-input) {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
