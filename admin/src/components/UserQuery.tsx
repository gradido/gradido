// AI-GENERATED — not an architecture reference
import { BFormInput } from 'bootstrap-vue-next'
import { computed, defineComponent, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import IIcBaselineClose from '~icons/ic/baseline-close'
import classes from './UserQuery.module.css'

export const UserQuery = defineComponent({
  name: 'UserQuery',
  props: {
    modelValue: { type: String, default: '' },
    placeholder: { type: String, default: '' },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
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

    // The × is a button with a name: a keyboard reaches it, and a screen reader says what it
    // does. It used to be a <div> with a click handler, which neither could use. It stands against
    // the field with the field's edge; it used to sit in a box of the input group, whose ground a
    // form elsewhere in the admin painted yellow (UserQuery.module.css).
    return () => (
      <div>
        <div class={['d-flex', classes.field]}>
          <BFormInput
            v-model={currentValue.value}
            type='text'
            class='test-input-criteria'
            placeholder={placeholderText.value}
          />
          <button
            type='button'
            class={['btn test-click-clear-criteria', classes.clearButton]}
            aria-label={t('search.clear')}
            title={t('search.clear')}
            onClick={onClear}
          >
            <IIcBaselineClose aria-hidden='true' />
          </button>
        </div>
      </div>
    )
  },
})
