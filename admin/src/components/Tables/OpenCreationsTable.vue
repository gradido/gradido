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

<script>
import RowDetails from '../RowDetails'
import ContributionMessagesList from '../ContributionMessages/ContributionMessagesList'
import { useDateFormatter } from '@/composables/useDateFormatter'
import { creationGroupLabels, creationGroupOption } from '@/utils/creationGroupLabel'

const iconMap = {
  IN_PROGRESS: 'question-square',
  PENDING: 'bell-fill',
  CONFIRMED: 'check',
  DELETED: 'trash',
  DENIED: 'x-circle',
}

export default {
  name: 'OpenCreationsTable',
  components: {
    RowDetails,
    ContributionMessagesList,
  },
  props: {
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
  },
  emits: [
    'assign-group',
    'update-contributions',
    'reload-contribution',
    'update-status',
    'show-overlay',
    'search-for-email',
    'crea-evaluate',
    'resubmission-saved',
  ],
  data() {
    return {
      slotIndex: 0,
      openRow: null,
      groupChangeModal: false,
      pendingGroupChange: { contributionId: null, tag: '', fromLabel: '', toLabel: '' },
      // What the group dropdowns show, by contribution id, while a change is waiting for its
      // answer. A picked group only lands here -- the contribution itself is not touched until
      // the backend confirms it. See displayedCreationGroup() for why this is kept by hand.
      groupSelection: {},
    }
  },
  computed: {
    // "no group" plus one entry per canonical group, written the way groups are written
    // everywhere else.
    groupSelectOptions() {
      return [
        { value: '', text: this.$t('contribution.noGroup') },
        ...this.creationGroups.map(creationGroupOption),
      ]
    },
  },
  watch: {
    // Fresh contributions are the truth again, so the shown picks have done their job.
    items() {
      this.groupSelection = {}
    },
    // A refused change never reached the database -- put the dropdowns back.
    groupChangeFailures() {
      this.groupSelection = {}
    },
  },
  mounted() {
    this.addClipboardListener()
  },
  beforeUnmount() {
    this.removeClipboardListener()
  },
  methods: {
    ...useDateFormatter(),
    myself(item) {
      return item.userId === this.$store.state.moderator.id
    },
    // The Crea button appears for other people's contributions; on the "all" tab
    // (creaOpenOnly) it is limited to still-open ones (IN_PROGRESS / PENDING) -- the
    // blue rows a moderator can still act on.
    showCreaButton(item) {
      if (this.myself(item)) return false
      if (!this.creaOpenOnly) return true
      return item.contributionStatus === 'IN_PROGRESS' || item.contributionStatus === 'PENDING'
    },
    getStatusIcon(status) {
      return iconMap[status] ? iconMap[status] : 'default-icon'
    },
    rowClass(item, type) {
      if (!item || type !== 'row') return
      if (item.contributionStatus === 'CONFIRMED') return 'table-success'
      if (item.contributionStatus === 'DENIED') return 'table-warning'
      if (item.contributionStatus === 'DELETED') return 'table-danger'
      if (item.contributionStatus === 'IN_PROGRESS') return 'table-primary'
      if (item.contributionStatus === 'PENDING') return 'table-primary'
    },
    updateStatus(id) {
      this.$emit('update-status', id)
    },
    reloadContribution(id) {
      this.$emit('reload-contribution', id)
    },
    updateContributions() {
      this.$emit('update-contributions')
    },
    rowToggleDetails(row, index) {
      const isSameRow = this.openRow && this.openRow.index === row.index
      const isSameSlot = index === this.slotIndex

      if (isSameRow && isSameSlot) {
        row.toggleDetails()
        this.openRow = null
      } else {
        if (this.openRow) {
          this.openRow.toggleDetails()
        }
        row.toggleDetails()
        this.slotIndex = index
        this.openRow = row
      }
    },
    // Group functions: the group is editable while the contribution is still being worked
    // on. Once it is confirmed, denied or deleted it is closed and the group is part of the
    // record — the backend enforces the same list, this only decides what to offer.
    canEditGroup(item) {
      return ['PENDING', 'IN_PROGRESS'].includes(item.contributionStatus)
    },
    currentCreationGroup(item) {
      return item.creationGroups?.[0]?.tag ?? ''
    },
    // A dropdown is a real DOM control: the browser applies the pick itself, so an unchanged
    // bound value gives Vue nothing to patch and the pick stays on screen even when it was
    // never saved. Keeping the shown value in our own state makes dropping a pick a real
    // change again, which is what pulls the dropdown back to the group the contribution has.
    displayedCreationGroup(item) {
      return this.groupSelection[item.id] ?? this.currentCreationGroup(item)
    },
    groupOptionLabel(tag) {
      return this.groupSelectOptions.find((option) => option.value === tag)?.text ?? tag
    },
    // Moving a contribution to another group is easy to do by accident and can hand it to a
    // different moderator, so it goes through a confirmation rather than firing on pick.
    onGroupPicked(item, tag) {
      const current = this.currentCreationGroup(item)
      if (tag === current) {
        return
      }
      this.groupSelection[item.id] = tag
      this.pendingGroupChange = {
        contributionId: item.id,
        tag,
        // Name every group the contribution currently has, not just the one the dropdown
        // happens to show. A legacy contribution whose text names two groups carries both,
        // and saving replaces the whole set -- the dialog has to say what is being given up.
        fromLabel: (item.creationGroups ?? []).length
          ? item.creationGroups.map((group) => this.groupOptionLabel(group.tag)).join(', ')
          : this.groupOptionLabel(''),
        toLabel: this.groupOptionLabel(tag),
      }
      this.groupChangeModal = true
    },
    // Every way out of the dialog ends here -- the OK and cancel buttons, the X, Escape and a
    // click on the backdrop. Only "ok" carries the change out; everything else drops it, so no
    // exit can leave a group on screen that was never saved.
    onGroupModalHide(event) {
      if (event.trigger === 'ok') {
        this.confirmGroupChange()
      } else {
        this.cancelGroupChange()
      }
    },
    // Deliberately keeps the picked group on screen: it stays until the fresh contributions
    // arrive, so the dropdown does not flick back to the old group and forward again. If the
    // backend refuses, groupChangeFailures brings it back.
    confirmGroupChange() {
      const { contributionId, tag } = this.pendingGroupChange
      this.$emit('assign-group', { contributionId, tags: tag ? [tag] : [] })
      this.resetGroupChange()
    },
    cancelGroupChange() {
      this.dropGroupSelection()
      this.resetGroupChange()
    },
    resetGroupChange() {
      this.pendingGroupChange = { contributionId: null, tag: '', fromLabel: '', toLabel: '' }
      this.groupChangeModal = false
    },
    // Forget the shown pick and let the contribution speak for itself again.
    dropGroupSelection() {
      const { contributionId } = this.pendingGroupChange
      if (contributionId !== null) {
        delete this.groupSelection[contributionId]
      }
    },
    // Group functions: the groups a contribution belongs to, shown above the text. The form
    // itself is decided once in utils/creationGroupLabel.
    groupLabel(item) {
      return creationGroupLabels(item.creationGroups)
    },
    isAddCommentToMemo(item) {
      return item.closedBy > 0 || item.moderatorId > 0 || item.updatedBy > 0
    },
    getMemoComment(item) {
      let comment = ''
      if (item.closedBy > 0) {
        if (item.contributionStatus === 'CONFIRMED') {
          comment = this.$t('contribution.confirmedBy', { name: item.closedByUserName })
        } else if (item.contributionStatus === 'DENIED') {
          comment = this.$t('contribution.deniedBy', { name: item.closedByUserName })
        } else if (item.contributionStatus === 'DELETED') {
          comment = this.$t('contribution.deletedBy', { name: item.closedByUserName })
        }
      }

      if (item.updatedBy > 0) {
        if (comment.length) {
          comment += ' | '
        }
        comment += this.$t('moderator.memo-modified', { name: item.updatedByUserName })
      }

      if (item.moderatorId > 0) {
        if (comment.length) {
          comment += ' | '
        }
        comment += this.$t('contribution.createdBy', { name: item.moderatorUserName })
      }
      return comment
    },
    addClipboardListener() {
      document.addEventListener('copy', this.handleCopy)
    },
    removeClipboardListener() {
      document.removeEventListener('copy', this.handleCopy)
    },
    handleCopy(event) {
      // get from user selected text
      const selectedText = window.getSelection().toString()

      if (selectedText) {
        // remove hashtags
        const cleanedText = selectedText.replace(/#([\p{L}\p{N}_-]+)/gu, '')
        event.clipboardData.setData('text/plain', cleanedText)
        event.preventDefault()
      }
    },
  },
}
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
