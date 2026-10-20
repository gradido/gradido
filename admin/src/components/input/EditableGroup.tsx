import { BButton, BFormGroup, type ButtonVariant } from 'bootstrap-vue-next'
import { computed, defineComponent, provide, ref, type SlotsType } from 'vue'
import { useI18n } from 'vue-i18n'
import IBiPencilFill from '~icons/bi/pencil-fill'

export const EditableGroup = defineComponent({
  name: 'EditableGroup',
  props: {
    allowEdit: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['save', 'reset'],
  slots: Object as SlotsType<{
    view: { isEditing: boolean }
    edit: { isEditing: boolean; 'onUpdate:modelValue': () => void }
  }>,
  setup(props, { emit, slots }) {
    const { t } = useI18n()

    const isEditing = ref(false)
    const isValueChanged = ref(false)

    // ⚠️ 'prime' is no Bootstrap variant, and nothing styles btn-prime: the edit button shows
    // unstyled. Kept as it was; 'primary' would change how the button looks.
    const variant = computed(() =>
      isEditing.value ? 'success' : ('prime' as string as ButtonVariant),
    )

    const enableEdit = () => {
      isEditing.value = true
    }
    const valueChanged = () => {
      isValueChanged.value = true
    }
    const invalidValues = () => {
      isValueChanged.value = false
    }
    const save = () => {
      emit('save')
      isEditing.value = false
      isValueChanged.value = false
    }
    const close = () => {
      emit('reset')
      isEditing.value = false
      isValueChanged.value = false
    }

    provide('editableGroup', { valueChanged, invalidValues })

    return () => (
      <div>
        {isEditing.value
          ? slots.edit?.({ isEditing: isEditing.value, 'onUpdate:modelValue': valueChanged })
          : slots.view?.({ isEditing: isEditing.value })}
        {props.allowEdit && !isEditing.value ? (
          <BFormGroup>
            <BButton variant={variant.value} onClick={enableEdit}>
              <IBiPencilFill /> {t('edit')}
            </BButton>
          </BFormGroup>
        ) : props.allowEdit && isEditing.value ? (
          <BFormGroup>
            <BButton
              variant={variant.value}
              disabled={!isValueChanged.value}
              class='save-button'
              onClick={save}
            >
              {t('save')}
            </BButton>
            <BButton variant='secondary' class='close-button ms-2' onClick={close}>
              {t('close')}
            </BButton>
          </BFormGroup>
        ) : null}
      </div>
    )
  },
})
