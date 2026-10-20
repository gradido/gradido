// AI-GENERATED — not an architecture reference
import { BFormInput, BInputGroupText } from 'bootstrap-vue-next'
import { computed, defineComponent, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import IIcBaselineClose from '~icons/ic/baseline-close'

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

    // `append` is spread in: an attribute without a value, as the template had it, which the
    // types of a <div> do not know.
    return () => (
      <div>
        <div class='d-flex'>
          <BFormInput
            v-model={currentValue.value}
            type='text'
            class='test-input-criteria'
            placeholder={placeholderText.value}
          />
          <div {...{ append: '' }} class='test-click-clear-criteria' onClick={onClear}>
            <BInputGroupText class='pointer h-100'>
              <IIcBaselineClose />
            </BInputGroupText>
          </div>
        </div>
      </div>
    )
  },
})
