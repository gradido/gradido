<template>
  <div class="contribution-messages-formular">
    <small class="ps-2 pt-3">{{ $t('form.reply') }}</small>
    <div>
      <BForm @submit.prevent="onSubmit" @reset="onReset">
        <BFormTextarea
          id="textarea"
          :model-value="formText"
          :placeholder="$t('form.memo')"
          :rows="3"
          @update:model-value="formText = $event"
        />
        <BRow class="mt-4 mb-4">
          <BCol>
            <BButton type="reset" variant="secondary">{{ $t('form.cancel') }}</BButton>
          </BCol>
          <BCol class="text-end">
            <BButton type="submit" variant="gradido" :disabled="disabled">
              {{ $t('form.reply') }}
            </BButton>
          </BCol>
        </BRow>
      </BForm>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useMutation } from '@vue/apollo-composable'
import { useI18n } from 'vue-i18n'
import { createContributionMessage } from '@/graphql/mutations.js'
import { useAppToast } from '@/composables/useToast'

const props = defineProps({
  contributionId: {
    type: Number,
    required: true,
  },
})

const emit = defineEmits([
  'get-list-contribution-messages',
  'update-status',
  'add-contribution-message',
])

const { t } = useI18n()
const { toastSuccess, toastError } = useAppToast()

const { mutate: createContributionMessageMutation } = useMutation(createContributionMessage)

const formText = ref('')

const isSubmitting = ref(false)

const disabled = computed(() => {
  return formText.value === '' || isSubmitting.value
})

async function onSubmit() {
  isSubmitting.value = true
  try {
    const result = await createContributionMessageMutation({
      contributionId: props.contributionId,
      message: formText.value,
    })

    // emit('get-list-contribution-messages', false)
    formText.value = ''
    emit('update-status', props.contributionId)
    emit('add-contribution-message', result.data.createContributionMessage)
    toastSuccess(t('message.reply'))
  } catch (error) {
    toastError(error.message)
  } finally {
    isSubmitting.value = false
  }
}

function onReset() {
  formText.value = ''
}
</script>
