// AI-GENERATED — not an architecture reference
import { useMutation } from '@vue/apollo-composable'
import { BFormCheckbox } from 'bootstrap-vue-next'
import { computed, defineComponent, ref, watch, watchPostEffect } from 'vue'
import { useAppToast } from '@/composables/useToast'
import { updateUserInfos } from '@/graphql/mutations'
import { useWalletStore } from '@/store/useWalletStore'
import classes from './UserSettingsSwitch.module.scss'

export const UserSettingsSwitch = defineComponent({
  name: 'UserSettingsSwitch',
  props: {
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
  },
  emits: ['value-changed'],
  setup(props, { emit }) {
    const store = useWalletStore()
    const { toastSuccess, toastError } = useAppToast()

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

    const onChange = async (evtPayload: boolean) => {
      if (isDisabled.value) {
        return
      }
      if (props.defer) {
        // Tell the page, save nothing.
        value.value = evtPayload
        emit('value-changed', evtPayload)
        return
      }
      const attrName = props.attrName as string
      try {
        await updateUserData({ [attrName]: evtPayload })
        // The switch is named after the field it stands for, and each of them is set as it is.
        store.$patch({ [attrName]: evtPayload })
        emit('value-changed', evtPayload)
        toastSuccess(evtPayload ? props.enabledText : props.disabledText)
      } catch (error) {
        value.value = props.initialValue
        toastError((error as Error).message)
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
    const onLockedClick = (event: Event) => {
      if (!props.locked) {
        return
      }
      event.preventDefault()
      if (props.notAllowedText) {
        toastError(props.notAllowedText)
      }
    }

    // For a screen reader, the lock is said on the input itself. Set here and not passed to
    // BFormCheckbox: bootstrap-vue-next 0.26.8 copies extra attributes to its input once, when
    // it is created, and never again - and the lock comes later, when the page has heard where
    // the member lives. Its own props follow as usual: the name goes in as ariaLabel.
    const root = ref<HTMLDivElement | null>(null)
    watchPostEffect(() => {
      const input = root.value?.querySelector('input')
      if (!input) {
        return
      }
      if (props.locked) {
        input.setAttribute('aria-disabled', 'true')
      } else {
        input.removeAttribute('aria-disabled')
      }
    })

    return () => (
      <div
        ref={root}
        class={['form-user-switch', classes['form-user-switch'], { 'is-locked': props.locked }]}
        onClick={onClick}
        // A capturing listener: Vue reads the `Capture` suffix at runtime, its element types
        // do not list it, so it goes in as a spread.
        {...{ onClickCapture: onLockedClick }}
      >
        <BFormCheckbox
          {...{ test: 'BFormCheckbox' }}
          name='check-button'
          disabled={props.disabled}
          ariaLabel={props.label}
          switch
          modelValue={props.defer ? value.value : props.initialValue}
          onUpdate:modelValue={(next) => onChange(next as boolean)}
        />
      </div>
    )
  },
})
