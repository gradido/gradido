<template>
  <div class="transaction-link gradido-custom-background mb-2">
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
           level up already carries: the amount says its own sign and unit. -->
      <div class="col-auto">
        <div class="fw-bold" data-test="link-amount">{{ $filters.GDD(amount) }}</div>
        <div v-if="decay" class="small" data-test="link-decay">
          <IBiDropletHalf height="13" class="mb-1" />
          {{ $filters.GDD(decay) }}
        </div>
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
          <BDropdownItem
            v-if="validLink"
            class="pt-3 test-copy-text"
            @click.stop="copyLinkWithText"
          >
            <IBiClipboardPlus />
            {{ $t('gdd_per_link.copy-link-with-text') }}
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
import { useAppToast } from '@/composables/useToast'
import { useCopyLinks } from '@/composables/useCopyLinks'
import { useThankYouCheque } from '@/composables/useThankYouCheque'
import { deleteTransactionLink } from '@/graphql/mutations'
import MemoText from '@/components/TransactionRows/MemoText'
import AppModal from '@/components/AppModal'
import FigureQrCode from '@/components/QrCode/FigureQrCode'

const props = defineProps({
  holdAvailableAmount: { type: String, required: true },
  id: { type: Number, required: true },
  amount: { type: Number, required: true },
  validUntil: { type: String, required: true },
  link: { type: String, required: true },
  memo: { type: String, required: true },
})

const showQrModal = ref(false)
const showDeleteLinkModal = ref(false)

const emit = defineEmits(['reset-transaction-link-list'])

const { t } = useI18n()
const { toastSuccess, toastError } = useAppToast()
const { copyLink, copyLinkWithText } = useCopyLinks({
  amount: props.amount,
  validUntil: props.validUntil,
  link: props.link,
  memo: props.memo,
})
// The cheque is drawn from scratch here: the window that shows the code is closed while
// this menu is open, so there is nothing on screen to copy the code from.
const { downloadThankYouCheque } = useThankYouCheque({
  amount: props.amount,
  validUntil: props.validUntil,
  link: props.link,
  memo: props.memo,
})

const { mutate: deleteTransactionLinkMutation } = useMutation(deleteTransactionLink)

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

.transaction-link-memo {
  font-style: italic;
  color: var(--bs-secondary-color, #6c757d);

  /* A memo may hold a web address, and an address is one unbreakable run. Without this it
     would decide how wide the row has to be. */
  overflow-wrap: anywhere;
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
