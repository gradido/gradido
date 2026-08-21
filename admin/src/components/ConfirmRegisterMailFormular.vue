<template>
  <div class="component-confirm-register-mail">
    <div class="shadow p-3 mb-5 bg-white rounded">
      <div v-if="props.checked">{{ $t('unregister_mail.text_true') }}</div>
      <div v-else>
        {{
          props.dateLastSend === ''
            ? $t('unregister_mail.never_sent', { email: email })
            : $t('unregister_mail.text_false', { date: props.dateLastSend, email: email })
        }}
        <!-- Using components -->
        <BInputGroup :prepend="$t('unregister_mail.info')" class="mt-3">
          <BFormInput v-model="email" readonly />
          <BButton variant="outline-success" append class="test-button" @click="sendRegisterMail">
            {{ $t('unregister_mail.button') }}
          </BButton>
        </BInputGroup>

        <!-- The other way out when the mail never arrives: a typo at registration. Only
             while the address was never confirmed - a confirmed address is the member's own
             to change, from their settings. The row is corrected in place, not historised:
             a mistyped address was never anybody's key. The fetched status decides, not the
             table row, which may be older than the confirmation. -->
        <div v-if="!status || !status.currentConfirmed" class="mt-4" data-test="email-replace">
          <div class="fw-bold">{{ $t('unregister_mail.replace.title') }}</div>
          <div class="small text-muted mb-2">{{ $t('unregister_mail.replace.hint') }}</div>
          <div
            v-if="status && status.elopageBuysOnCurrent"
            class="alert alert-warning small"
            data-test="email-replace-warning"
          >
            {{ $t('unregister_mail.replace.elopage_warning', { email: email }) }}
          </div>
          <BInputGroup>
            <BFormInput
              v-model="replacement"
              type="email"
              :placeholder="$t('unregister_mail.replace.placeholder')"
              data-test="email-replace-input"
            />
            <BButton
              variant="outline-danger"
              :disabled="!replacement"
              data-test="email-replace-button"
              @click="replaceEmail"
            >
              {{ $t('unregister_mail.replace.button') }}
            </BButton>
          </BInputGroup>
        </div>
      </div>

      <!-- What the support needs beside the current address: the address the GDT server is
           asked with, and a change that is under way. Shown only when it says something
           the current address does not. -->
      <div v-if="status" class="mt-3 small" data-test="email-status">
        <div v-if="status.gdtEmail !== email" data-test="email-gdt">
          {{ $t('unregister_mail.gdt_email', { email: status.gdtEmail }) }}
        </div>
        <div v-if="status.pendingEmail" data-test="email-pending">
          {{
            $t('unregister_mail.pending', {
              email: status.pendingEmail,
              date: status.pendingSince ? $d(new Date(status.pendingSince), 'long') : '',
            })
          }}
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { computed, ref } from 'vue'
import { sendActivationEmail } from '../graphql/sendActivationEmail'
import { adminEmailStatus } from '../graphql/adminEmailStatus'
import { adminReplaceUnconfirmedEmail } from '../graphql/adminReplaceUnconfirmedEmail'
import { BButton, BFormInput, BInputGroup } from 'bootstrap-vue-next'
import { useI18n } from 'vue-i18n'
import { useMutation, useQuery } from '@vue/apollo-composable'
import { useAppToast } from '@/composables/useToast'

const props = defineProps({
  checked: {
    type: Boolean,
  },
  email: {
    type: String,
  },
  dateLastSend: {
    type: String,
  },
  userId: {
    type: Number,
    default: null,
  },
})

const emit = defineEmits(['email-replaced'])

const { t } = useI18n()
const { toastError, toastSuccess } = useAppToast()

const email = ref(props.email)
const replacement = ref('')

const { mutate: activateEmail } = useMutation(sendActivationEmail)
const { mutate: replaceMutation } = useMutation(adminReplaceUnconfirmedEmail)

// Keyed by the member, so every row of the table has a cache entry of its own.
const { result: statusResult, refetch: refetchStatus } = useQuery(
  adminEmailStatus,
  () => ({ userId: props.userId }),
  () => ({ enabled: props.userId !== null, fetchPolicy: 'cache-and-network' }),
)
const status = computed(() => statusResult.value?.adminEmailStatus ?? null)

const sendRegisterMail = async () => {
  try {
    await activateEmail({
      email: email.value,
    })
    toastSuccess(t('unregister_mail.success', { email: email.value }))
  } catch (error) {
    toastError(t('unregister_mail.error', { message: error.message }))
  }
}

const replaceEmail = async () => {
  try {
    const { data } = await replaceMutation({
      userId: props.userId,
      email: replacement.value,
    })
    email.value = data.adminReplaceUnconfirmedEmail
    replacement.value = ''
    emit('email-replaced', email.value)
    toastSuccess(t('unregister_mail.replace.success', { email: email.value }))
    await refetchStatus()
  } catch (error) {
    toastError(t('unregister_mail.error', { message: error.message }))
  }
}
</script>
<style>
.input-group-text {
  background-color: rgb(255 252 205);
}
</style>
