<template>
  <div class="open-creations-table">
    <BTableLite
      :items="items"
      :fields="fields"
      caption-top
      striped
      hover
      stacked="md"
      :tbody-tr-class="rowClass"
    >
      <template #cell(contributionStatus)="row">
        <IBiQuestionSquare v-if="row.item.contributionStatus === 'IN_PROGRESS'" />
        <IBiBellFill v-else-if="row.item.contributionStatus === 'PENDING'" />
        <IBiCheck v-else-if="row.item.contributionStatus === 'CONFIRMED'" />
        <IBiXCircle v-else-if="row.item.contributionStatus === 'DENIED'" />
        <IBiTrash
          v-else-if="row.item.contributionStatus === 'DELETED'"
          class="p-1"
          width="24"
          height="24"
          style="background-color: #dc3545; color: white"
        />
      </template>
      <!-- The action buttons of a row carry an icon and nothing else, so title and aria-label
           are the only thing that names them: a tooltip for the moderator, an accessible name
           for a screen reader. Both reuse the key the column header already uses, so a button
           is called what the column above it is called. The filter button further down has
           carried this since it was written; the rest of the row had not. -->
      <template #cell(bookmark)="row">
        <div v-if="!myself(row.item)">
          <BButton
            variant="danger"
            size="md"
            class="me-2"
            :title="$t('delete')"
            :aria-label="$t('delete')"
            @click="$emit('show-overlay', row.item, 'delete')"
          >
            <IBiTrash />
          </BButton>
        </div>
      </template>
      <!-- The same filter that sits inside the details row, lifted into a column of its
           own so it can be reached without opening a contribution first. Its own column
           rather than an icon beside the name: the name column wraps, and a click target
           that moves with the text is hard to hit. -->
      <template #cell(searchUser)="row">
        <BButton
          v-if="row.item.user && row.item.user.emailContact"
          variant="link"
          class="p-0 border-0 text-primary"
          :title="$t('filter.byEmail')"
          :aria-label="$t('filter.byEmail')"
          @click="$emit('search-for-email', row.item.user.emailContact.email)"
        >
          <IBiSearch />
        </BButton>
      </template>
      <template #cell(name)="row">
        <span v-if="row.item.user">
          {{ row.item.user.firstName }} {{ row.item.user.lastName }}
          <small v-if="row.item.user.alias">
            <hr />
            {{ row.item.user.alias }}
          </small>
        </span>
      </template>
      <!-- The member's face under the amount, where the row has room (Bernd, 12.09.2026).
           The moderation talks to a person, and a name plus a number reads like a case. It
           opens the picture at full size on a tap, where there is one to open. -->
      <template #cell(amount)="row">
        <div>{{ row.value }}</div>
        <member-avatar
          v-if="row.item.user"
          class="mt-2"
          :size="LIST_AVATAR_SIZE"
          :name="memberName(row.item.user)"
          v-bind="avatarFor(row.item.user)"
          @zoom="openPicture(row.item.user)"
        />
      </template>
      <template #cell(memo)="row">
        <div class="mb-1">
          <ThemedSelect
            v-if="canEditGroup(row.item)"
            :model-value="displayedCreationGroup(row.item)"
            :options="groupSelectOptions"
            size="sm"
            class="group-select"
            :aria-label="$t('contribution.changeGroup')"
            @update:model-value="onGroupPicked(row.item, $event)"
          />
          <div v-else class="fw-bold">
            <span v-if="groupLabel(row.item)">{{ groupLabel(row.item) }}</span>
            <span v-else class="fw-normal fst-italic text-muted">
              {{ $t('contribution.noGroup') }}
            </span>
          </div>
        </div>
        {{ row.value }}
        <small v-if="isAddCommentToMemo(row.item)" class="no-select">
          <hr />
          {{ getMemoComment(row.item) }}
        </small>
      </template>
      <template #cell(creaEvaluate)="row">
        <div v-if="showCreaButton(row.item)">
          <BButton
            variant="link"
            class="crea-logo-btn me-2"
            :title="$t('crea.column')"
            @click="$emit('crea-evaluate', row.item)"
          >
            <img
              src="../../../public/img/crea-logo.jpg"
              :alt="$t('crea.column')"
              class="crea-logo-img"
            />
          </BButton>
        </div>
      </template>
      <!-- A contribution a moderator entered on someone's behalf is moderated like any other,
           so it gets the same button and the same message badges. It used to get an edit
           button of its own here, which also hid the badges -- an unanswered message on one of
           these was invisible. See the row-details slot for the other half of that split. -->
      <template #cell(editCreation)="row">
        <div v-if="!myself(row.item)">
          <BButton
            :title="$t('details')"
            :aria-label="$t('details')"
            @click="rowToggleDetails(row, 0)"
          >
            <IBiChatDots />
            <IBiExclamationCircleFill
              v-if="row.item.contributionStatus === 'PENDING' && row.item.messagesCount > 0"
              style="color: #ffc107"
            />
            <IBiQuestionDiamond
              v-if="row.item.contributionStatus === 'IN_PROGRESS' && row.item.messagesCount > 0"
              variant="warning"
              style="color: #ffc107"
              class="ps-1"
            />
          </BButton>
        </div>
      </template>
      <template #cell(chatCreation)="row">
        <BButton
          v-if="row.item.messagesCount > 0"
          :title="$t('details')"
          :aria-label="$t('details')"
          @click="rowToggleDetails(row, 0)"
        >
          <IBiChatDots />
        </BButton>
        <collapse-icon v-else :visible="row.detailsShowing" @click="rowToggleDetails(row, 0)" />
      </template>
      <template #cell(deny)="row">
        <div v-if="!myself(row.item)">
          <BButton
            variant="warning"
            size="md"
            class="me-2"
            :title="$t('deny')"
            :aria-label="$t('deny')"
            @click="$emit('show-overlay', row.item, 'deny')"
          >
            <IBiX />
          </BButton>
        </div>
      </template>
      <template #cell(confirm)="row">
        <div v-if="!myself(row.item)">
          <BButton
            variant="success"
            size="md"
            class="me-2"
            :title="$t('save')"
            :aria-label="$t('save')"
            @click="$emit('show-overlay', row.item, 'confirm')"
          >
            <IBiCheck />
          </BButton>
        </div>
      </template>
      <template #row-details="row">
        <row-details
          :row="row"
          type="show-creation"
          slot-name="show-creation"
          :index="0"
          @row-toggle-details="rowToggleDetails(row, 0)"
        >
          <!-- Every contribution opens the same panel, whoever wrote it. A moderator-entered
               one used to open an edit form instead, gated on confirmedAt -- a field the list
               query no longer asks for, so the gate has been permanently false and the panel
               permanently empty, on every tab. Moderating one of these means talking to the
               member, which is what this panel is for, and the backend has allowed it all
               along: neither writing a message nor changing the text checks who created it. -->
          <template #show-creation>
            <contribution-messages-list
              :contribution="row.item"
              :resubmission-at="row.item.resubmissionAt"
              :hide-resubmission="hideResubmission"
              @update-status="updateStatus"
              @reload-contribution="reloadContribution"
              @update-contributions="updateContributions"
              @search-for-email="$emit('search-for-email', $event)"
              @resubmission-saved="$emit('resubmission-saved', $event)"
            />
          </template>
        </row-details>
      </template>
    </BTableLite>

    <BModal
      id="change-group-modal"
      v-model="groupChangeModal"
      :title="$t('contribution.changeGroup')"
      :ok-title="$t('contribution.changeGroupConfirm')"
      :cancel-title="$t('overlay.cancel')"
      @hide="onGroupModalHide"
    >
      <p>
        {{
          $t('contribution.changeGroupQuestion', {
            from: pendingGroupChange.fromLabel,
            to: pendingGroupChange.toLabel,
          })
        }}
      </p>
      <p class="fst-italic text-muted mb-0">{{ $t('contribution.changeGroupHint') }}</p>
    </BModal>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import RowDetails from '../RowDetails'
import ContributionMessagesList from '../ContributionMessages/ContributionMessagesList'
import MemberAvatar from '@/components/MemberAvatar.vue'
import { memberAvatarProps } from '@/composables/useMemberAvatars'
import { openMemberAvatarZoom } from '@/composables/useMemberAvatarZoom'
import { creationGroupLabels, creationGroupOption } from '@/utils/creationGroupLabel'
// The one size a face has in this interface, the same as in the wallet.
import { LIST_AVATAR_SIZE } from '@/constants'

const props = defineProps({
  items: {
    type: Array,
    required: true,
  },
  fields: {
    type: Array,
    required: true,
  },
  hideResubmission: {
    type: Boolean,
    required: true,
  },
  resubmissionAt: {
    type: Date,
    required: false,
  },
  creaOpenOnly: {
    type: Boolean,
    default: false,
  },
  creationGroups: {
    type: Array,
    required: false,
    default: () => [],
  },
  // Counts the group changes the backend refused. A change that did not happen must not stay
  // on screen, and only the page that runs the mutation knows it failed.
  groupChangeFailures: {
    type: Number,
    required: false,
    default: 0,
  },
})

const emit = defineEmits([
  'assign-group',
  'update-contributions',
  'reload-contribution',
  'update-status',
  'show-overlay',
  'search-for-email',
  'crea-evaluate',
  'resubmission-saved',
])

const store = useStore()
const { t } = useI18n()

const slotIndex = ref(0)
const openRow = ref(null)
const groupChangeModal = ref(false)
const pendingGroupChange = ref({ contributionId: null, tag: '', fromLabel: '', toLabel: '' })
// What the group dropdowns show, by contribution id, while a change is waiting for its
// answer. A picked group only lands here -- the contribution itself is not touched until
// the backend confirms it. See displayedCreationGroup() for why this is kept by hand.
const groupSelection = ref({})

// "no group" plus one entry per canonical group, written the way groups are written
// everywhere else.
const groupSelectOptions = computed(() => [
  { value: '', text: t('contribution.noGroup') },
  ...props.creationGroups.map(creationGroupOption),
])

// Fresh contributions are the truth again, so the shown picks have done their job.
watch(
  () => props.items,
  () => {
    groupSelection.value = {}
  },
)
// A refused change never reached the database -- put the dropdowns back.
watch(
  () => props.groupChangeFailures,
  () => {
    groupSelection.value = {}
  },
)

/**
 * Everything the circle needs about this member, from ONE call -- letters, colour and
 * the picture where this device holds it (see the composable for why one call).
 */
const avatarFor = (user) => memberAvatarProps(user)

// What the picture is called for a screen reader: the alias, because that is what the
// row shows beside it.
const memberName = (user) =>
  user?.alias || `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim()

const openPicture = (user) => {
  // Without a name the plain wording: `avatar.zoom-picture` would otherwise read
  // "Picture of " with a hole where the member should be (coderabbit, #3890).
  const name = memberName(user)
  openMemberAvatarZoom({
    member: user,
    src: memberAvatarProps(user).src,
    label: name ? t('avatar.zoom-picture', { name }) : t('avatar.zoom-picture-plain'),
  })
}

const myself = (item) => item.userId === store.state.moderator.id

// The Crea button appears for other people's contributions; on the "all" tab
// (creaOpenOnly) it is limited to still-open ones (IN_PROGRESS / PENDING) -- the
// blue rows a moderator can still act on.
const showCreaButton = (item) => {
  if (myself(item)) return false
  if (!props.creaOpenOnly) return true
  return item.contributionStatus === 'IN_PROGRESS' || item.contributionStatus === 'PENDING'
}

const rowClass = (item, type) => {
  if (!item || type !== 'row') return
  if (item.contributionStatus === 'CONFIRMED') return 'table-success'
  if (item.contributionStatus === 'DENIED') return 'table-warning'
  if (item.contributionStatus === 'DELETED') return 'table-danger'
  if (item.contributionStatus === 'IN_PROGRESS') return 'table-primary'
  if (item.contributionStatus === 'PENDING') return 'table-primary'
}

const updateStatus = (id) => {
  emit('update-status', id)
}
const reloadContribution = (id) => {
  emit('reload-contribution', id)
}
const updateContributions = () => {
  emit('update-contributions')
}

const rowToggleDetails = (row, index) => {
  const isSameRow = openRow.value && openRow.value.index === row.index
  const isSameSlot = index === slotIndex.value

  if (isSameRow && isSameSlot) {
    row.toggleDetails()
    openRow.value = null
  } else {
    if (openRow.value) {
      openRow.value.toggleDetails()
    }
    row.toggleDetails()
    slotIndex.value = index
    openRow.value = row
  }
}

// Group functions: the group is editable while the contribution is still being worked
// on. Once it is confirmed, denied or deleted it is closed and the group is part of the
// record — the backend enforces the same list, this only decides what to offer.
const canEditGroup = (item) => ['PENDING', 'IN_PROGRESS'].includes(item.contributionStatus)

const currentCreationGroup = (item) => item.creationGroups?.[0]?.tag ?? ''

// A dropdown is a real DOM control: the browser applies the pick itself, so an unchanged
// bound value gives Vue nothing to patch and the pick stays on screen even when it was
// never saved. Keeping the shown value in our own state makes dropping a pick a real
// change again, which is what pulls the dropdown back to the group the contribution has.
const displayedCreationGroup = (item) => groupSelection.value[item.id] ?? currentCreationGroup(item)

const groupOptionLabel = (tag) =>
  groupSelectOptions.value.find((option) => option.value === tag)?.text ?? tag

const resetGroupChange = () => {
  pendingGroupChange.value = { contributionId: null, tag: '', fromLabel: '', toLabel: '' }
  groupChangeModal.value = false
}

// Forget the shown pick and let the contribution speak for itself again.
const dropGroupSelection = () => {
  const { contributionId } = pendingGroupChange.value
  if (contributionId !== null) {
    delete groupSelection.value[contributionId]
  }
}

// Moving a contribution to another group is easy to do by accident and can hand it to a
// different moderator, so it goes through a confirmation rather than firing on pick.
const onGroupPicked = (item, tag) => {
  const current = currentCreationGroup(item)
  if (tag === current) {
    return
  }
  groupSelection.value[item.id] = tag
  pendingGroupChange.value = {
    contributionId: item.id,
    tag,
    // Name every group the contribution currently has, not just the one the dropdown
    // happens to show. A legacy contribution whose text names two groups carries both,
    // and saving replaces the whole set -- the dialog has to say what is being given up.
    fromLabel: (item.creationGroups ?? []).length
      ? item.creationGroups.map((group) => groupOptionLabel(group.tag)).join(', ')
      : groupOptionLabel(''),
    toLabel: groupOptionLabel(tag),
  }
  groupChangeModal.value = true
}

// Deliberately keeps the picked group on screen: it stays until the fresh contributions
// arrive, so the dropdown does not flick back to the old group and forward again. If the
// backend refuses, groupChangeFailures brings it back.
const confirmGroupChange = () => {
  const { contributionId, tag } = pendingGroupChange.value
  emit('assign-group', { contributionId, tags: tag ? [tag] : [] })
  resetGroupChange()
}

const cancelGroupChange = () => {
  dropGroupSelection()
  resetGroupChange()
}

// Every way out of the dialog ends here -- the OK and cancel buttons, the X, Escape and a
// click on the backdrop. Only "ok" carries the change out; everything else drops it, so no
// exit can leave a group on screen that was never saved.
const onGroupModalHide = (event) => {
  if (event.trigger === 'ok') {
    confirmGroupChange()
  } else {
    cancelGroupChange()
  }
}

// Group functions: the groups a contribution belongs to, shown above the text. The form
// itself is decided once in utils/creationGroupLabel.
const groupLabel = (item) => creationGroupLabels(item.creationGroups)

const isAddCommentToMemo = (item) => item.closedBy > 0 || item.moderatorId > 0 || item.updatedBy > 0

const getMemoComment = (item) => {
  let comment = ''
  if (item.closedBy > 0) {
    if (item.contributionStatus === 'CONFIRMED') {
      comment = t('contribution.confirmedBy', { name: item.closedByUserName })
    } else if (item.contributionStatus === 'DENIED') {
      comment = t('contribution.deniedBy', { name: item.closedByUserName })
    } else if (item.contributionStatus === 'DELETED') {
      comment = t('contribution.deletedBy', { name: item.closedByUserName })
    }
  }

  if (item.updatedBy > 0) {
    if (comment.length) {
      comment += ' | '
    }
    comment += t('moderator.memo-modified', { name: item.updatedByUserName })
  }

  if (item.moderatorId > 0) {
    if (comment.length) {
      comment += ' | '
    }
    comment += t('contribution.createdBy', { name: item.moderatorUserName })
  }
  return comment
}

const handleCopy = (event) => {
  // get from user selected text
  const selectedText = window.getSelection().toString()

  if (selectedText) {
    // remove hashtags
    const cleanedText = selectedText.replace(/#([\p{L}\p{N}_-]+)/gu, '')
    event.clipboardData.setData('text/plain', cleanedText)
    event.preventDefault()
  }
}

onMounted(() => {
  document.addEventListener('copy', handleCopy)
})
onBeforeUnmount(() => {
  document.removeEventListener('copy', handleCopy)
})
</script>
<style>
.btn-warning {
  background-color: #e1a908;
  border-color: #e1a908;
}

.table-danger {
  --bs-table-bg: #e78d8d;
  --bs-table-striped-bg: #e57373;
  --bs-table-hover-bg: #e06a6a;
}

/* The group dropdown sits on a coloured contribution row. A white box would pull the eye
   away from the text it belongs to, so the control stays transparent and lets the row
   colour through -- striped, hovered or plain, it always matches by itself. It only firms
   up while it is being used. Element + class so it wins over .form-select whatever the
   stylesheet order is. */
.group-select {
  max-width: 28rem;
}

/* The inline picker is now a BDropdown (its option list follows the app theme in every
   browser, unlike a native <select> popup). Keep the toggle transparent so the row colour
   shows through; it only firms up while it is being used. */
.group-select > .btn.themed-select-toggle {
  background-color: transparent;
  border-color: rgb(0 0 0 / 12%);
}

.group-select > .btn.themed-select-toggle:hover,
.group-select > .btn.themed-select-toggle:focus,
.group-select.show > .btn.themed-select-toggle {
  background-color: rgb(255 255 255 / 35%);
  border-color: rgb(0 0 0 / 25%);
}

/* Crea logo used as the per-row trigger button (replaces the former robot icon) */
.crea-logo-btn {
  padding: 2px;
  border: none;
  border-radius: 20%;
  line-height: 0;
}

.crea-logo-btn:hover,
.crea-logo-btn:focus-visible {
  background-color: rgb(0 0 0 / 6%);
  box-shadow: none;
}

.crea-logo-img {
  display: block;
  width: 34px;
  height: 34px;
  object-fit: cover;
  border-radius: 20%;
}
</style>
