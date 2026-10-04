<template>
  <div class="transaction-link mb-2">
    <!-- No surface of its own (Bernd, 22.09.2026). The row stood on the grey rounded card of
         `gradido-custom-background`, which has no side padding: once the link's circle was
         gone (below), the text began right at the card's edge and ran into its rounded
         corners in light mode. In dark mode that card took the list's own colour and was
         never seen. Without it both modes look alike. -->
    <!-- ⛔ One line at every width, and that is only possible because the link's own circle
         is gone (Bernd, 12.09.2026: "Der Kreis mit dem schrägen Link kann komplett wegfallen.
         Damit wird die Zeilenbreite größer, und damit passt auch mehr in eine Zeile rein.").
         The row it replaces was a label table -- amount, memo, date and decay each in a
         5/12 + 7/12 pair -- which on a phone left the labels 100 points to work with: the
         amount broke across two lines, the memo read as a ragged block, and the menu, on
         `cols=12`, dropped onto a line of its own at the bottom (Bernd, 12.09.2026, with
         pictures). Measured against the served stylesheet in the wallet's own column
         structure: at 375 and 390 points every row is one line and 81 points high, even
         with "+ 1.000,00 GDD" standing beside "Abgelaufen am"; at 320 the state word takes
         two lines and nothing leaves the window. -->
    <div
      class="row align-items-center transaction-link-row pt-2 pb-2"
      :class="{ 'light-gray-text': !validLink }"
    >
      <!-- Where a booking carries the counterparty's name, a link carries the only thing it
           can be about: whether it can still be redeemed, and until when. `min-w-0` for the
           same reason as in the booking row -- a `col` floors at its own content, so without
           it a long state word would push the amount and the menu off the line. -->
      <div class="col min-w-0">
        <div class="fw-bold min-w-0" data-test="link-validity">{{ validityLabel }}</div>
        <span class="small">{{ $d(new Date(validUntil), 'short') }}</span>
        <span class="ms-4 small">{{ $d(new Date(validUntil), 'time') }}</span>
      </div>
      <!-- `col-auto`, so the amount takes what it needs and no more; the state column beside
           it grows into the rest. No heading over it -- the same decision the summary row one
           level up already carries: the amount says its own sign and unit.
           An expired link shows no decay (Bernd, 22.09.2026). Once it has expired, the server
           reports its hold as the amount itself (`transactionLinkListDecayed`), so the line
           could only ever say 0, and a 0 there only confused. -->
      <div class="col-auto">
        <div class="fw-bold" data-test="link-amount">{{ $filters.GDD(amount) }}</div>
        <div v-if="validLink" class="small" data-test="link-decay">
          <IBiDropletHalf height="13" class="mb-1" />
          {{ $filters.GDD(decay) }}
        </div>
        <!-- ⛔ The line stays, empty. The row centres its columns, so the decay line is what
             holds the amount level with the state word. Without it the amount dropped 9.6
             points on the desk, between the state word and the date. Moving it up with
             `align-self-start` missed by 3.4 there: the menu is the row's tallest column at 50
             points, so no column top is the state word's top. With an empty line of the same
             class the amount stands where an open link's does -- measured the same at 1280,
             and 0.4 points lower at 375, where the droplet makes the decay line a little
             taller than a line of text. -->
        <div v-else class="small" aria-hidden="true" data-test="link-decay-spacer">&nbsp;</div>
      </div>
      <div class="col-auto d-flex justify-content-end align-items-center">
        <BDropdown no-caret right aria-expanded="false" size="sm">
          <template #button-content>
            <!-- ⚠️ `link-menu-opener` is read by the summary row above: a tap on the menu
                 must not also close the list it stands in. -->
            <IBiThreeDotsVertical class="link-menu-opener" />
          </template>

          <BDropdownItem v-if="validLink" class="test-copy-link" @click.stop="copyLink">
            <IBiClipboard />
            {{ $t('gdd_per_link.copy-link') }}
          </BDropdownItem>
          <!-- The device's share sheet where it has one; elsewhere this copies the text, which
               is what the entry it replaces did. -->
          <BDropdownItem v-if="validLink" class="pt-3 test-share-link" @click.stop="share">
            <IBiShare />
            {{ $t('gdd_per_link.share') }}
          </BDropdownItem>
          <!-- A greeting can go onto paper (ZE-017, F8): an A4 sheet that folds into a card,
               printed or saved as a picture -- the day after it was written, on another computer.
               ⛔ Only a greeting, and only while its link is open: a plain link keeps its menu,
               and an expired greeting offers this as little as sharing, the cheque and the code. -->
          <BDropdownItem
            v-if="validLink && greeting"
            class="pt-3 test-print-greeting"
            @click.stop="printGreetingSheet()"
          >
            <IBiPrinter />
            {{ $t('thank-you-greeting.paper.print') }}
          </BDropdownItem>
          <BDropdownItem
            v-if="validLink && greeting"
            class="pt-3 test-save-greeting"
            @click.stop="saveGreetingSheet()"
          >
            <IBiImage />
            {{ $t('thank-you-greeting.paper.save') }}
          </BDropdownItem>
          <BDropdownItem
            v-if="validLink"
            class="pt-3 test-download-cheque"
            @click.stop="downloadThankYouCheque()"
          >
            <IBiDownload />
            {{ $t('thank-you-cheque.download') }}
          </BDropdownItem>
          <BDropdownItem
            v-if="validLink"
            class="pt-3 pb-3 test-qr-code"
            @click.stop="toggleQrModal"
          >
            <IBiQrCode class="filter"></IBiQrCode>
            {{ $t('qrCode') }}
          </BDropdownItem>
          <!-- Every link of the member's own can be made once more -- an open one and one that has
               run out, a greeting and a plain link (ZE-030): for somebody whose link ran out,
               and for the next person. ⛔ This makes nothing. It opens the way a link is made,
               with what this one carries standing in its fields, and the member makes the new
               link there: so there is no window here and no question. -->
          <BDropdownItem class="pb-3 test-duplicate-link" @click.stop="duplicate">
            <IBiFiles />
            {{ $t('gdd_per_link.duplicate') }}
          </BDropdownItem>
          <BDropdownItem class="test-delete-link" @click.stop="toggleDeleteModal">
            <IBiTrash />
            {{ $t('delete') }}
          </BDropdownItem>
        </BDropdown>
      </div>
      <!-- ⛔ The break has to be SAID here. The booking row gets one for free from the
           `offset` under its face: offset plus width push the memo past the line. This row
           has no face and no offset, so without this the memo sits BESIDE the row on the
           desk -- measured, it did, before this div existed. -->
      <div class="w-100" />
      <!-- No heading over the memo -- italics and the muted colour say what it is, as in the
           booking row. It stands whole rather than cut to one line: a booking can be opened
           to read the rest, a link row cannot, so a clipped memo would be readable nowhere. -->
      <div class="col-12 mt-1 transaction-link-memo-col">
        <!-- A thank-you greeting says so here, with its motif small and whom it is for.
             ⛔ Here, in the memo's block, not in the row above: that row is one line at every
             width and stays as it is -- no picture and no circle before it (see the notes at
             the row). The motif as an <img>, never inlined: the motifs share gradient ids. -->
        <div v-if="greeting" class="transaction-link-greeting" data-test="link-greeting">
          <!-- A photo of the member's own in the place of a motif: its small rendition, asked
               for by the id of the link once the row is in sight. The room is as small as a
               motif's here, so what there is to say of a photo that is gone stands beside it. -->
          <thank-you-greeting-photo
            v-if="greeting.hasPicture"
            class="transaction-link-greeting-motif"
            :link-id="id"
            :alt="photoAlt"
          />
          <img
            v-else-if="motif"
            class="transaction-link-greeting-motif"
            :src="motif.src"
            :alt="motif.name"
            :width="THANK_YOU_MOTIF_WIDTH"
            :height="THANK_YOU_MOTIF_HEIGHT"
          />
          <span class="transaction-link-greeting-label" data-test="link-greeting-label">
            {{ greetingLabel }}
            <span
              v-if="photoMissing"
              class="transaction-link-greeting-missing"
              data-test="link-greeting-photo-missing"
            >
              {{ $t('chatThread.imageMissing') }}
            </span>
          </span>
        </div>
        <div class="transaction-link-memo" data-test="link-memo"><memo-text :memo="memo" /></div>
      </div>
    </div>
    <app-modal :model-value="showQrModal" @update:model-value="toggleQrModal">
      <BCard header-tag="header" footer-tag="footer">
        <template #header>
          <h6 class="mb-0">{{ $t('qrCode') }}</h6>
        </template>
        <BCardText>
          <figure-qr-code class="text-center" :link="link" />
        </BCardText>
        <template #footer>
          <em>{{ link }}</em>
        </template>
      </BCard>
    </app-modal>
    <app-modal
      id="delete-link-modal"
      :model-value="showDeleteLinkModal"
      ok-only
      @update:model-value="toggleDeleteModal"
      @on-ok="deleteLink"
    >
      <BCard header-tag="header" footer-tag="footer">
        <h6 class="mb-0">{{ $t('gdd_per_link.delete-the-link') }}</h6>
        <br />
        <em>{{ link }}</em>
      </BCard>
    </app-modal>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useMutation } from '@vue/apollo-composable'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { useAppToast } from '@/composables/useToast'
import { useCopyLinks } from '@/composables/useCopyLinks'
import { greetingPicture } from '@/composables/useGreetingPictures'
import { useLinkDraft } from '@/composables/useLinkDraft'
import { useThankYouCheque } from '@/composables/useThankYouCheque'
import { useThankYouGreetingSheet } from '@/composables/useThankYouGreetingSheet'
import { deleteTransactionLink } from '@/graphql/mutations'
import MemoText from '@/components/TransactionRows/MemoText'
import AppModal from '@/components/AppModal'
import FigureQrCode from '@/components/QrCode/FigureQrCode'
import ThankYouGreetingPhoto from '@/components/ThankYouGreeting/ThankYouGreetingPhoto.vue'
import { memberAlias } from '@/utils/gradidoAddress'
import { SEND_TYPES } from '@/utils/sendTypes'
import {
  THANK_YOU_MOTIF_HEIGHT,
  THANK_YOU_MOTIF_WIDTH,
  thankYouMotif,
} from '@/utils/thankYouMotifs'

const props = defineProps({
  holdAvailableAmount: { type: String, required: true },
  id: { type: Number, required: true },
  amount: { type: Number, required: true },
  validUntil: { type: String, required: true },
  link: { type: String, required: true },
  memo: { type: String, required: true },
  // What makes the link a thank-you greeting -- motif, line, whom it is for, and whether it
  // carries a photo in the place of a motif; null for a plain link.
  greeting: { type: Object, default: null },
})

const showQrModal = ref(false)
const showDeleteLinkModal = ref(false)

const emit = defineEmits(['reset-transaction-link-list'])

const { t } = useI18n()
const store = useStore()
const { toastSuccess, toastError } = useAppToast()
// A greeting is shared with its own sentence, the one its result page showed (useCopyLinks).
const { copyLink, share } = useCopyLinks({
  amount: props.amount,
  validUntil: props.validUntil,
  link: props.link,
  memo: props.memo,
  greeting: props.greeting,
})
// The cheque is drawn from scratch here: the window that shows the code is closed while
// this menu is open, so there is nothing on screen to copy the code from.
const { downloadThankYouCheque } = useThankYouCheque({
  amount: props.amount,
  validUntil: props.validUntil,
  link: props.link,
  memo: props.memo,
})

// The sheet a greeting is printed on, drawn when it is asked for. Its photo, where it carries
// one, is fetched at that tap, by the id and the code of this link. A menu has no place to offer
// a second tap: where the device's share sheet wants one, the picture is downloaded.
const { printGreetingSheet, saveGreetingSheet } = useThankYouGreetingSheet({
  id: props.id,
  amount: props.amount,
  validUntil: props.validUntil,
  link: props.link,
  memo: props.memo,
  greeting: props.greeting,
})

const { mutate: deleteTransactionLinkMutation } = useMutation(deleteTransactionLink)

const router = useRouter()
const linkDraft = useLinkDraft()

/**
 * "Duplizieren": what this row shows of its link is handed to the way a link is made, and that
 * way is opened -- the page of the thank-you greeting for a greeting, the send form on its link
 * tab for a plain link. The id goes along for the photo of a greeting.
 *
 * ⛔ Handed over in memory (useLinkDraft), and the address names the way and nothing else: an
 * amount, a memo and the name of a third person do not belong into the browser's history.
 *
 * A way that is not reached leaves nothing behind -- the member tapped on while the page was
 * loading, or it could not be loaded: what was handed over is taken back, so that it cannot
 * stand in those fields on a later visit that asked for nothing.
 */
async function duplicate() {
  const { greeting } = props
  const handed = linkDraft.put({
    id: props.id,
    amount: props.amount,
    memo: props.memo,
    greeting: greeting && {
      motif: greeting.motif ?? null,
      line: greeting.line ?? null,
      recipientName: greeting.recipientName ?? null,
      hasPicture: greeting.hasPicture === true,
    },
  })
  let reached = false
  try {
    const failure = await router.push(
      greeting ? '/thank-you-greeting' : { path: '/send', query: { art: SEND_TYPES.link } },
    )
    reached = !failure
  } finally {
    if (!reached) linkDraft.drop(handed)
  }
}

const motif = computed(() => thankYouMotif(props.greeting?.motif, t))
// The list is the member's own: the photo of a greeting in it is theirs, under their user name.
const photoAlt = computed(() =>
  t('thank-you-greeting.photo-of', {
    name: memberAlias(store.state.username, store.state.gradidoID),
  }),
)
// The server gave nothing for the photo (useGreetingPictures): the chat's sentence says so.
const photoMissing = computed(
  () => props.greeting?.hasPicture === true && greetingPicture(props.id)?.state === 'missing',
)
const greetingLabel = computed(() =>
  props.greeting?.recipientName
    ? t('thank-you-greeting.list.for', { name: props.greeting.recipientName })
    : t('thank-you-greeting.name'),
)

const decay = computed(() => `${props.amount - props.holdAvailableAmount}`)
const validLink = computed(() => new Date(props.validUntil) > new Date())
// The two words the row can lead with, and they are the ones this wallet already says about
// a link -- taken over from the date row this template replaces, not invented here.
const validityLabel = computed(() =>
  validLink.value ? t('gdd_per_link.validUntil') : t('gdd_per_link.expiredOn'),
)

async function deleteLink() {
  try {
    await deleteTransactionLinkMutation({ id: props.id })
    toastSuccess(t('gdd_per_link.deleted'))
    emit('reset-transaction-link-list')
  } catch (err) {
    toastError(err.message)
  }
}

const toggleDeleteModal = () => {
  showDeleteLinkModal.value = !showDeleteLinkModal.value
}

const toggleQrModal = () => {
  showQrModal.value = !showQrModal.value
}
</script>
<style>
.qr-button {
  position: relative;
  right: 20px;
}

.filter {
  filter: opacity(0.6);
}
</style>
<style scoped lang="scss">
.light-gray-text {
  color: #adb5bd !important;
}

/* See the note at the state column: a Bootstrap `col` floors at its own content, so the
   name column of the booking row carries the same guard under the same name. */
.min-w-0 {
  min-width: 0;
}

.transaction-link-row {
  /* The menu column is the button plus the row's gutters. Measured at 56 points, not the
     4.5rem the booking row reserves for its collapse arrow -- that arrow is bigger, and
     copying its figure here cost the state word exactly the 16 points it needs to stay on
     one line at 375. */
  --link-menu-col: 3.5rem;
}

/* The mark of a greeting above its memo: the motif small, and whom it is for. It names no
   colour, so it takes the row's -- an expired row's grey included. */
.transaction-link-greeting {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 4px;
  font-weight: 600;
  overflow-wrap: anywhere;
}

/* At the motifs' own proportions (36 : 25); their ground is light in both themes. A photo, and
   its room before it has come, stand in the same place. */
.transaction-link-greeting-motif {
  flex-shrink: 0;
  width: 46px;
  height: auto;
  aspect-ratio: 36 / 25;
  border-radius: 6px;
  background: #fbf3de;
}

/* An expired row recedes as a whole, the picture with it. */
.light-gray-text .transaction-link-greeting-motif {
  opacity: 0.55;
}

.transaction-link-greeting-label {
  min-width: 0;
}

/* What there is to say of a photo that is gone, under the label: quieter than the label, in the
   row's own colour. (Plain ASCII in this block: with any other letter in it sass heads the
   stylesheet with a charset rule, and TransactionLink.darkMode.spec.js reads that as a part of
   the first selector.) */
.transaction-link-greeting-missing {
  display: block;
  font-size: 0.8125rem;
  font-weight: 400;
}

.transaction-link-memo {
  font-style: italic;
  color: var(--bs-secondary-color, #6c757d);

  /* A memo may hold a web address, and an address is one unbreakable run. Without this it
     would decide how wide the row has to be. */
  overflow-wrap: anywhere;
}

/* An expired row recedes as a whole, the memo with it (Bernd, 23.09.2026). The memo's own
   colour above beats the grey the row hands down -- a colour set on an element always beats an
   inherited one, however !important it was where it came from -- so it stayed muted: darker
   than the rest of the row in light mode, brighter in dark mode. Inheriting gives it the row's
   grey in both, the dark one too, since that is set on the row itself. A web address in the
   memo keeps its link colour: links here are not underlined, so a grey one would read as text. */
.light-gray-text .transaction-link-memo {
  color: inherit;
}

/* From `md` on the memo stops short of the amount instead of running the whole width, which
   Bernd found out of balance in the booking row on 11.09.2026 ("nicht so breit ... wie die
   Spalte"). A floor, not an exact meeting point: the amount's column is as wide as its
   content, so this leaves air rather than touching it. On the phone the memo keeps the whole
   width -- there is nothing beside it. */
@media (width >= 768px) {
  .transaction-link-memo-col {
    width: calc(100% * 9 / 12 - var(--link-menu-col));
  }
}
</style>
