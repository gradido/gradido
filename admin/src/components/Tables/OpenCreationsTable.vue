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
      <template #cell(bookmark)="row">
        <div v-if="!myself(row.item)">
          <BButton
            variant="danger"
            size="md"
            class="me-2"
            @click="$emit('show-overlay', row.item, 'delete')"
          >
            <IBiTrash />
          </BButton>
        </div>
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
        {{ row.value }}
        <small v-if="isAddCommentToMemo(row.item)">
          <hr />
          {{ getMemoComment(row.item) }}
        </small>
      </template>
      <template #cell(editCreation)="row">
        <div v-if="!myself(row.item)">
          <BButton
            v-if="row.item.moderatorId"
            variant="info"
            size="md"
            :index="0"
            class="me-2"
            @click="rowToggleDetails(row, 0)"
          >
            <IBiX v-if="row.detailsShowing" />
            <IBiPencilSquare v-else />
          </BButton>
          <BButton v-else @click="rowToggleDetails(row, 0)">
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
        <BButton v-if="row.item.messagesCount > 0" @click="rowToggleDetails(row, 0)">
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
          <template #show-creation>
            <div v-if="row.item.moderatorId">
              <edit-creation-formular
                v-if="row.item.confirmedAt === null"
                type="singleCreation"
                :item="row.item"
                :row="row"
                :creation-user-data="creationUserData"
                @update-creation-data="$emit('update-contributions')"
              />
            </div>
            <div v-else>
              <contribution-messages-list
                :contribution="row.item"
                :resubmission-at="row.item.resubmissionAt"
                :hide-resubmission="hideResubmission"
                @update-status="updateStatus"
                @reload-contribution="reloadContribution"
                @update-contributions="updateContributions"
                @search-for-email="$emit('search-for-email', $event)"
              />
            </div>
          </template>
        </row-details>
      </template>
    </BTableLite>
  </div>
</template>

<script>
import RowDetails from '../RowDetails'
import EditCreationFormular from '../EditCreationFormular'
import ContributionMessagesList from '../ContributionMessages/ContributionMessagesList'
import { useDateFormatter } from '@/composables/useDateFormatter'

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
    EditCreationFormular,
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
  },
  emits: [
    'update-contributions',
    'reload-contribution',
    'update-status',
    'show-overlay',
    'search-for-email',
  ],
  data() {
    return {
      slotIndex: 0,
      openRow: null,
      creationUserData: {},
    }
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
        this.creationUserData = row.item
      }
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
}
</style>
