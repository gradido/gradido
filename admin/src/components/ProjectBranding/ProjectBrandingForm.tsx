// AI-GENERATED — not an architecture reference
import { useQuery } from '@vue/apollo-composable'
import {
  BButton,
  BForm,
  BFormCheckbox,
  BFormGroup,
  BFormInvalidFeedback,
  BModal,
} from 'bootstrap-vue-next'
import { computed, defineComponent, type PropType, reactive, ref, watch, withModifiers } from 'vue'
import { useI18n } from 'vue-i18n'
import { type AnySchema, boolean, number, object, string } from 'yup'
import { ValidatedInput } from '@/components/input/ValidatedInput'
import { ListHumhubSpaces } from '@/components/ProjectBranding/ListHumhubSpaces'
import { spaceWithNameAndDescription } from '@/graphql/projectBranding.graphql'

type ProjectBranding = Record<string, unknown> & { id?: number }

export const ProjectBrandingForm = defineComponent({
  name: 'ProjectBrandingForm',
  props: {
    modelValue: { type: Object as PropType<ProjectBranding>, required: true },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const form = reactive<Record<string, unknown>>({ ...props.modelValue })
    const isModalVisible = ref(false)
    const errorMessage = ref('')
    const { t } = useI18n()
    watch(
      () => props.modelValue,
      (newValue) => Object.assign(form, newValue),
    )
    const name = computed(() => form.name as string)
    const alias = computed(() => form.alias as string)
    const description = computed(() => form.description as string)
    const spaceId = computed(() => form.spaceId as number)
    const newUserToSpace = computed(() => form.newUserToSpace)
    const logoUrl = computed(() => form.logoUrl as string)

    // show space
    const { result } = useQuery(spaceWithNameAndDescription, () => ({ id: spaceId.value }), {
      enabled: !!spaceId.value,
    })

    const selectedSpaceText = computed(() => {
      if (!spaceId.value) {
        return t('projectBranding.selectSpace')
      }
      if (!result.value?.space) {
        return t('projectBranding.noAccessRightSpace', { spaceId: spaceId.value })
      }
      return t('projectBranding.chosenSpace', { space: result.value.space.name })
    })

    const validationSchema = object({
      name: string().min(3).max(255).required(),
      alias: string()
        .matches(/^[a-z0-9-_]+$/, {
          message: 'Alias can only contain lowercase letters, numbers, hyphens, and underscores.',
        })
        .min(3)
        .max(32)
        .required(),
      description: string().nullable().optional(),
      spaceId: number().nullable().optional(),
      spaceUrl: string().url('Space URL must be a valid URL.').max(255).nullable().optional(),
      newUserToSpace: boolean().optional(),
      logoUrl: string().url('Logo URL must be a valid URL.').max(255).nullable().optional(),
    })

    // each field of the form validates with its own part of the schema
    const rulesOf = (field: keyof typeof validationSchema.fields) =>
      validationSchema.fields[field] as AnySchema

    function chooseSpace(value: { id: number; url: string }) {
      updateField(value.id, 'spaceId')
      updateField(value.url, 'spaceUrl')
    }

    function updateField(value: unknown, name: string) {
      form[name] = value
    }
    function submit() {
      validationSchema
        .validate(form, { stripUnknown: true })
        .then((cleanedForm) => {
          emit('update:modelValue', { ...cleanedForm, id: props.modelValue.id })
        })
        .catch((err) => {
          errorMessage.value = err.message
        })
    }

    function resetForm() {
      if (props.modelValue.id === undefined) {
        Object.assign(form, {
          name: '',
          alias: '',
          description: undefined,
          spaceId: undefined,
          spaceUrl: undefined,
          newUserToSpace: false,
          logoUrl: undefined,
        })
        return
      } else {
        Object.assign(form, props.modelValue)
      }
      errorMessage.value = ''
    }

    return () => (
      <div class='project-branding-form'>
        {/* the native submit of the form, BForm hands it on as an attribute */}
        <BForm onSubmit={withModifiers(submit, ['prevent'])}>
          <ValidatedInput
            modelValue={name.value}
            name='name'
            label={t('name')}
            rules={rulesOf('name')}
            class='mb-3'
            onUpdate:modelValue={updateField}
          />
          <ValidatedInput
            modelValue={alias.value}
            name='alias'
            label={t('alias')}
            rules={rulesOf('alias')}
            class='mb-3'
            onUpdate:modelValue={updateField}
          />
          <ValidatedInput
            modelValue={description.value}
            name='description'
            label={t('description')}
            rules={rulesOf('description')}
            // ⚠️ the string "true", as the template wrote it -- truthy, so a textarea
            {...{ textarea: 'true' }}
            class='mb-3'
            onUpdate:modelValue={updateField}
          />
          <BButton
            variant='outline-secondary'
            class='mb-3'
            // no prop of BButton: it lands on the element
            title={result.value?.space.description}
            onClick={() => {
              isModalVisible.value = true
            }}
          >
            {selectedSpaceText.value}
          </BButton>
          <BFormGroup
            label={t('projectBranding.newUserToSpace')}
            labelFor='newUserToSpace-input-field'
            class='mb-3'
          >
            <BFormCheckbox
              id='newUserToSpace-input-field'
              modelValue={newUserToSpace.value as string}
              name='newUserToSpace'
              value='true'
              uncheckedValue='false'
              onUpdate:modelValue={(value) => updateField(value, 'newUserToSpace')}
            >
              {t('projectBranding.newUserToSpaceTooltip')}
            </BFormCheckbox>
          </BFormGroup>
          <ValidatedInput
            modelValue={logoUrl.value}
            name='logoUrl'
            label={t('logo')}
            rules={rulesOf('logoUrl')}
            class='mb-3'
            onUpdate:modelValue={updateField}
          />
          {errorMessage.value ? (
            <BFormInvalidFeedback class='d-block mb-3'>{errorMessage.value}</BFormInvalidFeedback>
          ) : null}
          <div class='d-flex gap-2'>
            <BButton type='submit' variant='primary'>
              {t('save')}
            </BButton>
            <BButton type='reset' variant='secondary' onClick={resetForm}>
              {t('reset')}
            </BButton>
          </div>
        </BForm>
        <BModal v-model={isModalVisible.value} title={t('projectBranding.selectSpace')} noFooter>
          <ListHumhubSpaces modelValue={spaceId.value} onChooseSpace={chooseSpace} />
        </BModal>
      </div>
    )
  },
})
