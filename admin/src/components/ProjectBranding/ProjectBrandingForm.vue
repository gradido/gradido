<template>
  <div class="project-branding-form">
    <BForm @submit.prevent="submit">
      <ValidatedInput
        :model-value="name"
        name="name"
        :label="$t('name')"
        :rules="validationSchema.fields.name"
        class="mb-3"
        @update:model-value="updateField"
      />
      <ValidatedInput
        :model-value="alias"
        name="alias"
        :label="$t('alias')"
        :rules="validationSchema.fields.alias"
        class="mb-3"
        @update:model-value="updateField"
      />
      <ValidatedInput
        :model-value="description"
        name="description"
        :label="$t('description')"
        :rules="validationSchema.fields.description"
        textarea="true"
        class="mb-3"
        @update:model-value="updateField"
      />
      <BButton
        variant="outline-secondary"
        class="mb-3"
        :title="result?.space.description"
        @click="isModalVisible = true"
      >
        {{ selectedSpaceText }}
      </BButton>
      <BFormGroup
        :label="$t('projectBranding.newUserToSpace')"
        label-for="newUserToSpace-input-field"
        class="mb-3"
      >
        <BFormCheckbox
          id="newUserToSpace-input-field"
          :model-value="newUserToSpace"
          name="newUserToSpace"
          value="true"
          unchecked-value="false"
          @update:model-value="(value) => updateField(value, 'newUserToSpace')"
        >
          {{ $t('projectBranding.newUserToSpaceTooltip') }}
        </BFormCheckbox>
      </BFormGroup>
      <ValidatedInput
        :model-value="logoUrl"
        name="logoUrl"
        :label="$t('logo')"
        :rules="validationSchema.fields.logoUrl"
        class="mb-3"
        @update:model-value="updateField"
      />
      <BFormInvalidFeedback v-if="errorMessage" class="d-block mb-3">
        {{ errorMessage }}
      </BFormInvalidFeedback>
      <div class="d-flex gap-2">
        <BButton type="submit" variant="primary">{{ $t('save') }}</BButton>
        <BButton type="reset" variant="secondary" @click="resetForm">{{ $t('reset') }}</BButton>
      </div>
    </BForm>
    <BModal v-model="isModalVisible" title="Select Space" hide-footer>
      <ListHumhubSpaces :model-value="spaceId" @choose-space="chooseSpace" />
    </BModal>
  </div>
</template>

<script setup>
import ValidatedInput from '@/components/input/ValidatedInput'
import ListHumhubSpaces from '@/components/ProjectBranding/ListHumhubSpaces.vue'
import { useI18n } from 'vue-i18n'
import { reactive, computed, watch, ref } from 'vue'
import { object, string, boolean, number } from 'yup'
import { useQuery } from '@vue/apollo-composable'
import gql from 'graphql-tag'

const props = defineProps({
  modelValue: { type: Object, required: true },
})

const form = reactive({ ...props.modelValue })
const isModalVisible = ref(false)
const errorMessage = ref('')
const { t } = useI18n()
watch(
  () => props.modelValue,
  (newValue) => Object.assign(form, newValue),
)
const name = computed(() => form.name)
const alias = computed(() => form.alias)
const description = computed(() => form.description)
const spaceId = computed(() => form.spaceId)
const newUserToSpace = computed(() => form.newUserToSpace)
const logoUrl = computed(() => form.logoUrl)
// show space
const getSpace = gql`
  query ($id: ID!) {
    space(id: $id) {
      name
      description
    }
  }
`
const { result } = useQuery(getSpace, () => ({ id: spaceId.value }), {
  enabled: computed(() => !!spaceId.value),
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

function chooseSpace(value) {
  updateField(value.id, 'spaceId')
  updateField(value.url, 'spaceUrl')
}

function updateField(value, name) {
  form[name] = value
}
const emit = defineEmits(['update:modelValue'])
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
</script>
