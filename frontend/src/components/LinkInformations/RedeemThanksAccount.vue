<!-- AI-GENERATED — not an architecture reference -->
<template>
  <div class="redeem-thanks-open-account">
    <!-- The house's strip, as above the registration form ("… hat Dir Gradido gezeigt"): who
         sent the thank-you, with the greeting's picture small. A plain link has no picture. -->
    <p class="alert gradido-border-radius redeem-thanks-strip" data-test="redeem-thanks-strip">
      <img
        v-if="motif"
        class="redeem-thanks-strip-picture"
        :src="motif.src"
        alt=""
        :width="THANK_YOU_MOTIF_WIDTH"
        :height="THANK_YOU_MOTIF_HEIGHT"
        data-test="redeem-thanks-strip-motif"
      />
      <span>{{ $t('redeem-thanks.account-strip', { name: senderName }) }}</span>
    </p>
    <h2 class="h4 redeem-thanks-title" data-test="redeem-thanks-title">
      {{ $t('redeem-thanks.account-title') }}
    </h2>
    <p class="redeem-thanks-account-text" data-test="redeem-thanks-account-text">
      {{ $t('redeem-thanks.account-text') }}
    </p>
    <BForm class="redeem-thanks-form" role="form" @submit.prevent="onSubmit">
      <!-- The fields of the registration form, with its checks and its words (AccountFields).
           The sentence under the passwords names who sees that the confirmation is missing
           until it is there (E-020). -->
      <account-fields with-password :guarantor-name="senderName" :first-name="firstName" />
      <div class="redeem-thanks-actions">
        <!-- The word of the card (F4: nothing small under it). Locked while the page opens the
             account, signs in and books: a second tap asks nothing. -->
        <BButton
          type="submit"
          class="redeem-thanks-accept"
          :disabled="!formMeta.valid || accepting"
          :variant="!formMeta.valid ? 'gradido-disable' : 'gradido'"
          data-test="redeem-thanks-open-account"
        >
          {{ $t('redeem-thanks.accept') }}
        </BButton>
      </div>
    </BForm>
    <!-- The way in for somebody who has an account, as under the thank-you. -->
    <slot />
  </div>
</template>

<script setup>
/**
 * "Konto anlegen", on the page a thank-you arrived on (ZE-017 F5): whoever accepts it and has
 * no account opens one right here -- name, address, password -- and the page signs them in and
 * books the thank-you in one go (pages/TransactionLink.vue).
 *
 * This view only asks. It hands what was typed to the page with `submit` and keeps none of it:
 * ⛔ the password stands in the form alone -- not in the address, not in the store (which is
 * mirrored to localStorage), not in a message.
 *
 * "Vorname" starts with whom the greeting is for, where that is a single word ("Sarah", not
 * "Sarah und Claude") long enough to be a first name here.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useForm } from 'vee-validate'
import { BButton, BForm } from 'bootstrap-vue-next'
import AccountFields from '@/components/Auth/AccountFields'
import { memberAlias } from '@/utils/gradidoAddress'
import {
  THANK_YOU_MOTIF_HEIGHT,
  THANK_YOU_MOTIF_WIDTH,
  thankYouMotif,
} from '@/utils/thankYouMotifs'

const props = defineProps({
  linkData: { type: Object, required: true },
  // The page is opening the account, signing in or booking: the button waits.
  accepting: { type: Boolean, default: false },
})

const emit = defineEmits(['submit'])

const { t } = useI18n()

// As on the sheet: under their user name, never under their real name (NU-021).
const senderName = computed(() =>
  memberAlias(props.linkData.senderUser?.alias, props.linkData.senderUser?.gradidoID),
)

const motif = computed(() => thankYouMotif(props.linkData.greeting?.motif, t))

// The shortest first name the form takes (AccountFields: `min: 3`).
const FIRST_NAME_MIN = 3
const firstName = (() => {
  const name = (props.linkData.greeting?.recipientName ?? '').trim()
  return name.length >= FIRST_NAME_MIN && !/\s/.test(name) ? name : ''
})()

// The fields register themselves with this form (AccountFields).
const { meta: formMeta, handleSubmit } = useForm()

const onSubmit = handleSubmit((values) => {
  if (props.accepting) return
  emit('submit', {
    firstName: values.firstname,
    lastName: values.lastname,
    email: values.email,
    password: values.newPassword,
  })
})
</script>

<style lang="scss" scoped>
/* Block comments only: lightningcss parses SFC style blocks and a double slash is not a
   comment to it. The sizes are in em of the card's own size, as in RedeemThanks. */

/* The strip: the picture small on the left, the sentence beside it -- left-aligned, like the
   strip above the registration form, though the view around it is centred. */
.redeem-thanks-strip {
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
}

.redeem-thanks-strip-picture {
  flex: none;
  width: 64px;
  height: auto;
  border-radius: 6px;
}

.redeem-thanks-account-text {
  margin: 0 0 16px;
  font-size: 0.875em;
  line-height: 1.5;
  text-wrap: balance;
}

/* A form reads from the left: labels, fields, the sentence and the consent. */
.redeem-thanks-form {
  text-align: left;
}

/* The sentence under the passwords, in the size of the small sentences of this card: at the
   size it has on the registration form it is five lines on a phone, between the passwords and
   the consent. */
.redeem-thanks-form :deep(.account-fields-hint) {
  font-size: 0.875em;
  line-height: 1.5;
}
</style>
