// AI-GENERATED — not an architecture reference
import { BFormGroup, BFormInput } from 'bootstrap-vue-next'
import { defineComponent, inject, ref, watch } from 'vue'

type EditableGroup = { valueChanged: () => void; invalidValues: () => void }

export const EditableGroupableLabel = defineComponent({
  name: 'EditableGroupableLabel',
  props: {
    modelValue: {
      type: String,
      required: false,
      default: null,
    },
    label: {
      type: String,
      required: true,
    },
    idName: {
      type: String,
      required: true,
    },
  },
  emits: ['update:model-value'],
  setup(props, { emit }) {
    // Provided by the EditableGroup this label sits in; without one there is nobody to tell.
    const editableGroup = inject<EditableGroup | null>('editableGroup', null)

    const inputValue = ref<unknown>(props.modelValue)
    const originalValue = inputValue.value

    watch(inputValue, () => {
      if (inputValue.value !== originalValue) {
        editableGroup?.valueChanged()
      } else {
        editableGroup?.invalidValues()
      }
      emit('update:model-value', inputValue.value)
    })

    return () => (
      <BFormGroup label={props.label} labelFor={props.idName}>
        <BFormInput
          id={props.idName}
          modelValue={props.modelValue}
          onUpdate:modelValue={(value) => {
            inputValue.value = value
          }}
        />
      </BFormGroup>
    )
  },
})
