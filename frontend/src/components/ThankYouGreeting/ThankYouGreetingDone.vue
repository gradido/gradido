<!-- AI-GENERATED — not an architecture reference -->
<template>
  <div class="thank-you-greeting-done" data-test="thank-you-greeting-done">
    <div class="tyg-done-head page-text">
      <!-- A photo of the member's own: the picture the page made of it a moment ago, not one
           fetched from the server. -->
      <img
        v-if="hasPhoto && created.picture"
        class="tyg-done-motif"
        :src="created.picture"
        :alt="photoAlt"
        :width="THANK_YOU_MOTIF_WIDTH"
        :height="THANK_YOU_MOTIF_HEIGHT"
        data-test="thank-you-greeting-done-photo"
      />
      <!-- ⛔ An <img>, never the SVG inlined: the motifs share the ids of their gradients. -->
      <img
        v-else-if="motif"
        class="tyg-done-motif"
        :src="motif.src"
        :alt="motif.name"
        :width="THANK_YOU_MOTIF_WIDTH"
        :height="THANK_YOU_MOTIF_HEIGHT"
        data-test="thank-you-greeting-done-motif"
      />
      <div class="tyg-done-head-text">
        <h2
          ref="titleElement"
          class="h4 mb-1 tyg-done-title"
          tabindex="-1"
          data-test="thank-you-greeting-done-title"
        >
          {{ title }}
        </h2>
        <div class="tyg-done-muted small" data-test="thank-you-greeting-done-waits">
          {{ $t('thank-you-greeting.done.waits-until', { date: $d(validUntilDate, 'short') }) }}
        </div>
      </div>
    </div>

    <div class="tyg-done-card bg-white app-box-shadow gradido-border-radius">
      <!-- Where an address is known the card holds the mail to it and nothing else (Bernd,
           02.11.2026): the member came for that, and the other buttons stood in the way. Sharing,
           copying and paper stay in the menu of the link in the list, as the page says below. -->
      <!-- The device's share sheet where it has one; elsewhere this copies the sentence. -->
      <BButton
        v-if="!emailAddress"
        variant="gradido"
        class="tyg-done-button"
        data-test="thank-you-greeting-share"
        @click="share"
      >
        {{ $t('gdd_per_link.share') }}
      </BButton>
      <!-- A real link: the browser itself opens the mail program from the tap, and the tap puts
           the picture into the clipboard (useSendByEmail). -->
      <BButton
        :variant="emailAddress ? 'gradido' : 'outline-secondary'"
        class="tyg-done-button"
        :href="emailHref"
        role="link"
        aria-describedby="tyg-done-email-hint"
        data-test="thank-you-greeting-email"
        @click="copyPicture"
      >
        {{
          emailAddress
            ? $t('gdd_per_link.by-email-to', { address: emailAddress })
            : $t('gdd_per_link.by-email')
        }}
      </BButton>
      <p
        id="tyg-done-email-hint"
        class="tyg-done-email-hint tyg-done-muted mb-0"
        data-test="thank-you-greeting-email-hint"
      >
        {{ emailHint }}
      </p>
      <BButton
        v-if="!emailAddress"
        variant="outline-secondary"
        class="tyg-done-button"
        :disabled="!canCopyLink"
        data-test="thank-you-greeting-copy"
        @click="copyLink"
      >
        {{ $t('gdd_per_link.copy-link') }}
      </BButton>
      <!-- On paper (ZE-017, F8): the same greeting as an A4 sheet that folds into a card. A group
           of its own under the two ways the link travels, with the sentence that says what
           becomes of the sheet. Neither button is taken away while a sheet is being made -- a
           disabled button loses the keyboard's place; the composable makes one sheet of two taps.
           ⛔ Only a greeting goes onto paper: a plain link has its cheque, elsewhere. -->
      <div
        v-if="isGreeting && !emailAddress"
        class="tyg-done-paper"
        role="group"
        aria-labelledby="tyg-done-paper-title"
      >
        <div
          id="tyg-done-paper-title"
          class="tyg-done-paper-title"
          data-test="thank-you-greeting-paper-title"
        >
          {{ $t('thank-you-greeting.paper.title') }}
        </div>
        <BButton
          variant="outline-secondary"
          class="tyg-done-button"
          data-test="thank-you-greeting-print"
          @click="printGreetingSheet"
        >
          {{ $t('thank-you-greeting.paper.print') }}
        </BButton>
        <!-- The quiet way, a line of text: the same sheet as a picture. Where the device's share
             sheet asked for a tap of its own, this is that tap -- in the chat's words. -->
        <BButton
          variant="link"
          class="tyg-done-save"
          data-test="thank-you-greeting-save"
          @click="saveGreetingSheet"
        >
          {{ saveWaits ? $t('chatThread.imageSaveAgain') : $t('thank-you-greeting.paper.save') }}
        </BButton>
        <p
          class="tyg-done-paper-hint tyg-done-muted mb-0"
          data-test="thank-you-greeting-paper-hint"
        >
          {{ $t('thank-you-greeting.paper.hint') }}
        </p>
      </div>
    </div>

    <div class="tyg-done-sentence page-text">
      <div class="tyg-done-label">
        {{
          isGreeting
            ? $t('thank-you-greeting.done.sentence-lead')
            : $t('thank-you-greeting.done.sentence-lead-plain')
        }}
      </div>
      <!-- Exactly what goes out, so what the member reads here is what arrives. -->
      <blockquote class="tyg-done-quote" data-test="thank-you-greeting-share-text">
        {{ linkText }}
      </blockquote>
      <!-- With an address the text goes into the member's own mail program, where it can be
           adjusted and added to (E-045) -- with a greeting and without one. Shared, it is the
           sentence the share sheet sends. -->
      <p class="tyg-done-muted small mb-0" data-test="thank-you-greeting-edit-hint">
        {{
          emailAddress
            ? $t('thank-you-greeting.done.edit-hint-email')
            : isGreeting
              ? $t('thank-you-greeting.done.edit-hint')
              : $t('thank-you-greeting.done.edit-hint-plain')
        }}
      </p>
    </div>

    <div class="tyg-done-foot tyg-done-muted small page-text">
      <!-- With a photo the sentence names it: whoever has the link sees the photo. -->
      <p data-test="thank-you-greeting-link-hint">
        {{
          hasPhoto
            ? $t('thank-you-greeting.done.link-hint-photo')
            : $t('thank-you-greeting.done.link-hint')
        }}
      </p>
      <p class="mb-0" data-test="thank-you-greeting-find-again">
        {{
          $t('thank-you-greeting.done.find-again', {
            transactions: $t('navigation.transactions'),
            links: $t('gdd_per_link.links_sum'),
          })
        }}
      </p>
    </div>

    <!-- One more of the same for the next person (ZE-030), under everything: the page begins a
         new greeting with all this one carried, and asks only whom it is for. Outlined, as
         "Karte drucken" is, and as wide as its words. -->
    <div class="tyg-done-another">
      <BButton
        variant="outline-secondary"
        data-test="thank-you-greeting-another"
        @click="emit('another')"
      >
        {{ $t('thank-you-greeting.done.another') }}
      </BButton>
    </div>
  </div>
</template>

<script setup>
/**
 * A thank-you greeting is made: share it, copy its link -- or print it.
 *
 * Everything here is the server's answer to `createTransactionLink` -- the link, until when
 * it waits, whom it is for -- not what the form held. The one thing that is the page's own is
 * the photo of a greeting that carries one (`created.picture`): the server says THAT there is a
 * photo, and the page shows the one it made.
 *
 * The sentence that goes out with the link is in the first person and carries neither the
 * sender's words nor the amount (ZE-017, F3): those stand on the card, behind the link. It
 * stands here word for word, because it is what the other person reads first.
 *
 * On paper the greeting is a sheet that folds into a card, printed or saved as a picture
 * (useThankYouGreetingSheet). Its photo, where it carries one, is the same `created.picture`.
 *
 * "Noch einen für jemand anderen" makes nothing here: it asks the page for a new greeting
 * (`another`), and the page begins one with what this one carried.
 *
 * "Per E-Mail" opens the member's own mail program (useSendByEmail). The send form leads here too,
 * for a thank-you to somebody without an account (pages/Send.vue): with the address in
 * `emailAddress`, where the mail is all the card holds, and without a greeting where no picture was
 * chosen -- a plain link, whose text then carries the amount and the message.
 */
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useWalletStore } from '@/store/useWalletStore'
import { BButton } from 'bootstrap-vue-next'
import { useCopyLinks } from '@/composables/useCopyLinks'
import { useSendByEmail } from '@/composables/useSendByEmail'
import { useThankYouGreetingSheet } from '@/composables/useThankYouGreetingSheet'
import { focusStepHeading } from '@/utils/focusStepHeading'
import { memberAlias } from '@/utils/gradidoAddress'
import {
  THANK_YOU_MOTIF_HEIGHT,
  THANK_YOU_MOTIF_WIDTH,
  thankYouMotif,
} from '@/utils/thankYouMotifs'

const props = defineProps({
  // `createTransactionLink` as it answered: link, amount, memo, validUntil, greeting -- and
  // `picture`, the photo as the page made it, where the greeting carries one.
  created: { type: Object, required: true },
  // Whom the mail is for, where the member named somebody: only in the memory of the page.
  emailAddress: { type: String, default: '' },
})

const emit = defineEmits(['another'])

const { t } = useI18n()
const store = useWalletStore()

const isGreeting = computed(() => Boolean(props.created.greeting))
const motif = computed(() => thankYouMotif(props.created.greeting?.motif, t))
const hasPhoto = computed(() => props.created.greeting?.hasPicture === true)
// Whose photo it is, by the name the card shows: the member's own user name (NU-021).
const photoAlt = computed(() =>
  t('thank-you-greeting.photo-of', {
    name: memberAlias(store.username, store.gradidoID),
  }),
)
const recipientName = computed(() => props.created.greeting?.recipientName ?? '')
const title = computed(() => {
  if (props.emailAddress) {
    return t('thank-you-greeting.done.title-for-address', { address: props.emailAddress })
  }
  if (!isGreeting.value) return t('thank-you-greeting.done.title-plain')
  return recipientName.value
    ? t('thank-you-greeting.done.title-for', { name: recipientName.value })
    : t('thank-you-greeting.done.title')
})
const validUntilDate = computed(() => new Date(props.created.validUntil))

// A greeting that is made does not change: the composable takes it as it is now.
// ⚠️ `null` for a plain link, not an empty object: that is true, and would give it the greeting's
// sentence, without the amount and without the words.
const { canCopyLink, copyLink, linkText, shortLinkText, share } = useCopyLinks({
  link: props.created.link,
  amount: props.created.amount,
  memo: props.created.memo,
  validUntil: props.created.validUntil,
  greeting: props.created.greeting ?? null,
})

// The picture for the clipboard: the one this page shows. Made as soon as the view stands, because
// the tap has to write it at once.
const {
  href: emailHref,
  hint: emailHint,
  copyPicture,
  preparePicture,
} = useSendByEmail({
  text: linkText,
  shortText: shortLinkText,
  greeting: props.created.greeting ?? null,
  address: () => props.emailAddress,
  picture: () => (hasPhoto.value ? props.created.picture : null) ?? motif.value?.src ?? null,
})
// From the send form this is a step of that page, without a change of address to bring it into view
// and with the button that led here gone: the title takes the focus (the way of a greeting has its
// own page for this).
const titleElement = ref(null)
onMounted(() => {
  preparePicture()
  if (props.emailAddress) focusStepHeading(titleElement.value)
})

// The same greeting on paper. This page can offer a second tap where the share sheet wants one.
const { saveWaits, printGreetingSheet, saveGreetingSheet } = useThankYouGreetingSheet(
  {
    id: props.created.id,
    link: props.created.link,
    amount: props.created.amount,
    memo: props.created.memo,
    validUntil: props.created.validUntil,
    greeting: props.created.greeting ?? {},
    picture: props.created.picture ?? null,
  },
  { secondTap: true },
)
</script>

<style lang="scss" scoped>
/* Block comments only: lightningcss parses SFC style blocks and a double slash is not a
   comment to it. */
.tyg-done-head {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 1rem;
}

/* The motif small, at its own proportions; its ground is light in both themes. A photo stands
   in the same room and fills it. */
.tyg-done-motif {
  flex-shrink: 0;
  width: 96px;
  height: auto;
  aspect-ratio: 36 / 25;
  border-radius: 10px;
  background: #fbf3de;
  box-shadow: 0 4px 12px rgb(90 70 30 / 18%);
  object-fit: cover;
}

.tyg-done-head-text {
  min-width: 0;
  overflow-wrap: anywhere;
}

/* A heading is no control: it takes the focus for the screen reader, and shows no frame for it. */
.tyg-done-title {
  outline: none;
}

.tyg-done-muted {
  color: var(--bs-secondary-color, #6c757d);
  line-height: 1.5;
}

/* The buttons one under the other. */
.tyg-done-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 1.25rem;
  padding: 1.25rem;
}

/* On paper: a group of its own, set as the card sets its buttons. */
.tyg-done-paper {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* Its word between two fine lines. */
.tyg-done-paper-title {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-top: 6px;
  color: var(--bs-secondary-color, #6c757d);
  font-size: 0.8125rem;
  font-weight: 600;
  text-align: center;
}

.tyg-done-paper-title::before,
.tyg-done-paper-title::after {
  flex: 1;
  height: 1px;
  background: var(--bs-border-color, #dee2e6);
  content: '';
}

/* A button is as wide as the card on a phone and no wider than the sheet of the step before
   (24rem, .tyg-paper) -- on a desk the card is as wide as the page, and a button that wide is a
   bar. Narrower ones stand in the middle, where the buttons of the other steps stand. */
.tyg-done-button {
  align-self: center;
  width: min(24rem, 100%);

  /* An address on the button is one unbreakable run unless it has a hyphen: without this it leaves
     the button and the card on a phone, white on white once past the gold. */
  overflow-wrap: anywhere;
  text-wrap: balance;
}

/* A line of text, not a third button: as wide as its words, in the middle. */
.tyg-done-save {
  align-self: center;
  padding: 2px 0;
  font-size: 0.9375rem;
}

/* What becomes of the sheet, in lines an eye can follow. */
.tyg-done-paper-hint,
.tyg-done-email-hint {
  align-self: center;
  max-width: 34rem;
  margin-top: 2px;
  font-size: 0.8125rem;
  text-align: center;
}

/* What the tap does, under its button: lines of about the same length, no word alone on the last. */
.tyg-done-email-hint {
  text-wrap: balance;
}

.tyg-done-label {
  margin-bottom: 8px;
  font-size: 0.875rem;
  font-weight: 600;
}

/* The message as it goes out: its own lines, and a link that may break anywhere rather than
   run out of the page on a phone. */
.tyg-done-quote {
  margin: 0 0 8px;
  padding: 12px 14px;
  border: 1px solid var(--bs-border-color, #dee2e6);
  border-radius: 14px;
  background: var(--bs-body-bg, #fff);
  font-size: 0.875rem;
  line-height: 1.55;
  white-space: pre-line;
  overflow-wrap: anywhere;
}

.tyg-done-foot {
  margin-top: 1.25rem;
}

.tyg-done-foot p {
  margin-bottom: 6px;
}

/* "Noch einen für jemand anderen": under everything, in the middle, as wide as its words. */
.tyg-done-another {
  display: flex;
  justify-content: center;
  margin-top: 1.5rem;
}
</style>
