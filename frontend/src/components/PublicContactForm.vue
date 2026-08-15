<!-- AI-GENERATED — not an architecture reference -->
<template>
  <div class="public-contact-form">
    <div v-if="sent" class="text-center" data-test="public-contact-sent">
      {{ $t('public-profile.contact.sent') }}
    </div>

    <BForm v-else role="form" data-test="public-contact-form" @submit.prevent="onSubmit">
      <ValidatedInput
        id="public-contact-sender-name"
        :model-value="form.senderName"
        name="senderName"
        :label="$t('public-profile.contact.name')"
        :placeholder="$t('public-profile.contact.name')"
        :rules="validationSchema.fields.senderName"
        @update:model-value="updateField"
      />
      <ValidatedInput
        id="public-contact-sender-email"
        :model-value="form.senderEmail"
        name="senderEmail"
        :label="$t('public-profile.contact.email')"
        :placeholder="$t('public-profile.contact.email')"
        :rules="validationSchema.fields.senderEmail"
        @update:model-value="updateField"
      />
      <ValidatedInput
        id="public-contact-subject"
        :model-value="form.subject"
        name="subject"
        :label="$t('form.subject')"
        :placeholder="$t('form.subject')"
        :rules="validationSchema.fields.subject"
        @update:model-value="updateField"
      />
      <ValidatedInput
        id="public-contact-message"
        :model-value="form.message"
        name="message"
        :label="$t('form.message')"
        :placeholder="$t('form.message')"
        :rules="validationSchema.fields.message"
        textarea="true"
        :max-rows="14"
        @update:model-value="updateField"
      />

      <!-- The honeypot. Out of sight and out of the tab order, so a person never meets it;
           whoever fills it in gets the same confirmation as everybody else and no mail. -->
      <!-- No label: the bait a bot goes for is the field name, and a visible word here
           would be raw text nobody ever reads in any language. -->
      <div class="visually-hidden" aria-hidden="true">
        <input
          id="public-contact-website"
          v-model="form.website"
          type="text"
          name="website"
          tabindex="-1"
          autocomplete="off"
        />
      </div>

      <BButton
        block
        type="submit"
        variant="gradido"
        class="mt-3"
        :disabled="formIsInvalid || sending"
        data-test="public-contact-submit"
      >
        {{ $t('public-profile.contact.submit') }}
      </BButton>

      <div class="small mt-3">
        {{ $t('public-profile.contact.privacy') }}
        <BLink :href="`https://gradido.net/${$i18n.locale}/datenschutz/`" target="_blank">
          {{ $t('footer.privacy_policy') }}
        </BLink>
      </div>
    </BForm>
  </div>
</template>

<script setup>
/**
 * Say hello to the person behind a Gradido address, without an account.
 *
 * ## The confirmation is the same sentence every time
 *
 * Whether the address belongs to anybody, whether the message was thrown away, whether an
 * origin has written too often -- none of it reaches this component, because the mutation
 * answers everybody alike. That is not a shortcoming to work around: a contact form never
 * confirms delivery anyway, so the one thing this page must not do is the one thing nobody
 * expects of it.
 *
 * The only failure shown is the visitor's own connection. That says nothing about the
 * recipient, and hiding it would leave somebody staring at a form that swallowed their words.
 */
import { computed, reactive, ref } from 'vue'
import { useMutation } from '@vue/apollo-composable'
import { object } from 'yup'
import { BButton, BForm, BLink } from 'bootstrap-vue-next'
import { useI18n } from 'vue-i18n'
import ValidatedInput from '@/components/Inputs/ValidatedInput.vue'
import { sendPublicContactMessage } from '@/graphql/mutations'
import {
  message as messageSchema,
  senderEmail as senderEmailSchema,
  senderName as senderNameSchema,
  subject as subjectSchema,
} from '@/validationSchemas'
import { useAppToast } from '@/composables/useToast'

const props = defineProps({
  // The alias out of the address, handed down from the route. Never looked up anywhere.
  recipientIdentifier: {
    type: String,
    required: true,
  },
})

const { t } = useI18n()
const { toastError } = useAppToast()
const { mutate } = useMutation(sendPublicContactMessage)

const form = reactive({
  senderName: '',
  senderEmail: '',
  subject: '',
  message: '',
  website: '',
})
const sent = ref(false)
const sending = ref(false)

const validationSchema = computed(() =>
  object({
    senderName: senderNameSchema,
    senderEmail: senderEmailSchema,
    subject: subjectSchema,
    message: messageSchema,
  }),
)

// The honeypot is deliberately outside the schema: it must stay fillable, or a bot would be
// stopped by the disabled button instead of walking into it.
const formIsInvalid = computed(() => !validationSchema.value.isValidSync(form))

const updateField = (newValue, name) => {
  form[name] = newValue
}

async function onSubmit() {
  sending.value = true
  try {
    await mutate({
      recipientIdentifier: props.recipientIdentifier,
      senderName: form.senderName,
      senderEmail: form.senderEmail,
      subject: form.subject,
      message: form.message,
      website: form.website,
    })
    sent.value = true
  } catch {
    toastError(t('public-profile.contact.error'))
  } finally {
    sending.value = false
  }
}
</script>
