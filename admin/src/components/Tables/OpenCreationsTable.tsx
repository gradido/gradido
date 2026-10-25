// AI-GENERATED — not an architecture reference
import { BButton, BModal, BTableLite } from 'bootstrap-vue-next'
import {
  computed,
  defineComponent,
  onBeforeUnmount,
  onMounted,
  type PropType,
  ref,
  watch,
} from 'vue'
import { useI18n } from 'vue-i18n'
import { MemberAvatar } from '@/components/MemberAvatar'
import { ThemedSelect } from '@/components/ThemedSelect'
import { useDateFormatter } from '@/composables/useDateFormatter'
import { memberAvatarProps } from '@/composables/useMemberAvatars'
import { openMemberAvatarZoom } from '@/composables/useMemberAvatarZoom'
// The one size a face has in this interface, the same as in the wallet.
import { LIST_AVATAR_SIZE } from '@/constants'
import { useAdminStore } from '@/store/useAdminStore'
import { creationGroupLabels, creationGroupOption } from '@/utils/creationGroupLabel'
import { isTheModerator } from '@/utils/theModerator'
import IBiArrowDown from '~icons/bi/arrow-down'
import IBiArrowUp from '~icons/bi/arrow-up'
import IBiBellFill from '~icons/bi/bell-fill'
import IBiChatDots from '~icons/bi/chat-dots'
import IBiCheck from '~icons/bi/check'
import IBiCheckLg from '~icons/bi/check-lg'
import IBiPencilFill from '~icons/bi/pencil-fill'
import IBiQuestionLg from '~icons/bi/question-lg'
import IBiQuestionSquare from '~icons/bi/question-square'
import IBiSearch from '~icons/bi/search'
import IBiTrash from '~icons/bi/trash'
import IBiX from '~icons/bi/x'
import IBiXCircle from '~icons/bi/x-circle'
import IBiXLg from '~icons/bi/x-lg'
import IIcRoundPriorityHigh from '~icons/ic/round-priority-high'
import creaLogo from '../../../public/img/crea-logo.jpg'
import {
  ContributionMessagesList,
  type Contribution as MessagesListContribution,
} from '../ContributionMessages/ContributionMessagesList'
import { RowDetails } from '../RowDetails'
import './OpenCreationsTable.css'

type CreationGroup = { id?: number; tag: string; name?: string | null }

type Member = {
  alias?: string
  firstName?: string
  lastName?: string
  gradidoID: string
  communityUuid?: string
  emailContact?: { email: string }
}

export type Contribution = {
  id: number
  memo: string
  userId: number
  amount?: string
  contributionDate?: string
  createdAt: string
  closedAt?: string | null
  contributionStatus: string
  messagesCount: number
  user?: Member | null
  creationGroups?: CreationGroup[]
  resubmissionAt?: string | null
  closedBy?: number
  closedByUserName?: string
  moderatorId?: number | null
  moderatorUserName?: string
  updatedBy?: number
  updatedByUserName?: string
  // The newest message of the conversation with the member (the server leaves the moderators'
  // internal notes out): its kind and whether a moderator wrote it. Null without a conversation.
  lastMessageType?: 'DIALOG' | 'HISTORY' | null
  lastMessageByModerator?: boolean | null
}

type Row = {
  item: Contribution
  index: number
  value: unknown
  detailsShowing: boolean
  toggleDetails: () => void
}

type PendingGroupChange = {
  contributionId: number | null
  tag: string
  fromLabel: string
  toLabel: string
}

export const OpenCreationsTable = defineComponent({
  name: 'OpenCreationsTable',
  props: {
    items: {
      type: Array as PropType<Contribution[]>,
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
    // Whether this tab offers Crea to this moderator at all. At the desk the page decides it by
    // leaving the column out; a phone card has no columns, so it is told.
    showCrea: {
      type: Boolean,
      default: false,
    },
    // The "all" tab mixes the states. At the desk a column of its own says which one a row is
    // in; a phone card says it in its head.
    showStatus: {
      type: Boolean,
      default: false,
    },
    creationGroups: {
      type: Array as PropType<CreationGroup[]>,
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
  setup(props, { emit }) {
    const store = useAdminStore()
    const { t } = useI18n()
    const { formatDateOrDash } = useDateFormatter()

    const slotIndex = ref(0)
    const openRow = ref<Row | null>(null)
    const groupChangeModal = ref(false)
    const pendingGroupChange = ref<PendingGroupChange>({
      contributionId: null,
      tag: '',
      fromLabel: '',
      toLabel: '',
    })
    // What the group dropdowns show, by contribution id, while a change is waiting for its
    // answer. A picked group only lands here -- the contribution itself is not touched until
    // the backend confirms it. See displayedCreationGroup() for why this is kept by hand.
    const groupSelection = ref<Record<number, string>>({})

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
    const avatarFor = (user: Member) => memberAvatarProps(user)

    // What the picture is called for a screen reader: the alias, because that is what the
    // row shows beside it.
    const memberName = (user: Member) =>
      user?.alias || `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim()

    const openPicture = (user: Member) => {
      // Without a name the plain wording: `avatar.zoom-picture` would otherwise read
      // "Picture of " with a hole where the member should be (coderabbit, #3890).
      const name = memberName(user)
      openMemberAvatarZoom({
        member: user,
        src: memberAvatarProps(user).src,
        label: name ? t('avatar.zoom-picture', { name }) : t('avatar.zoom-picture-plain'),
      })
    }

    const myself = (item: Contribution) => isTheModerator(store.moderator, item.user)

    // The Crea button appears for other people's contributions; on the "all" tab
    // (creaOpenOnly) it is limited to still-open ones (IN_PROGRESS / PENDING) -- the
    // blue rows a moderator can still act on.
    const showCreaButton = (item: Contribution) => {
      if (myself(item)) {
        return false
      }
      if (!props.creaOpenOnly) {
        return true
      }
      return item.contributionStatus === 'IN_PROGRESS' || item.contributionStatus === 'PENDING'
    }

    const rowClass = (item: Contribution | null, type: string) => {
      if (!item || type !== 'row') {
        return
      }
      if (item.contributionStatus === 'CONFIRMED') {
        return 'table-success'
      }
      if (item.contributionStatus === 'DENIED') {
        return 'table-warning'
      }
      if (item.contributionStatus === 'DELETED') {
        return 'table-danger'
      }
      if (item.contributionStatus === 'IN_PROGRESS') {
        return 'table-primary'
      }
      if (item.contributionStatus === 'PENDING') {
        return 'table-primary'
      }
    }

    const updateStatus = (id: number) => {
      emit('update-status', id)
    }
    const reloadContribution = (id: number) => {
      emit('reload-contribution', id)
    }
    const updateContributions = () => {
      emit('update-contributions')
    }

    const rowToggleDetails = (row: Row, index: number) => {
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
    const canEditGroup = (item: Contribution) =>
      ['PENDING', 'IN_PROGRESS'].includes(item.contributionStatus)

    const currentCreationGroup = (item: Contribution) => item.creationGroups?.[0]?.tag ?? ''

    // A dropdown is a real DOM control: the browser applies the pick itself, so an unchanged
    // bound value gives Vue nothing to patch and the pick stays on screen even when it was
    // never saved. Keeping the shown value in our own state makes dropping a pick a real
    // change again, which is what pulls the dropdown back to the group the contribution has.
    const displayedCreationGroup = (item: Contribution) =>
      groupSelection.value[item.id] ?? currentCreationGroup(item)

    const groupOptionLabel = (tag: string) =>
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
    const onGroupPicked = (item: Contribution, tag: string) => {
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
          ? (item.creationGroups ?? []).map((group) => groupOptionLabel(group.tag)).join(', ')
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
    const onGroupModalHide = (event: { trigger?: string | null }) => {
      if (event.trigger === 'ok') {
        confirmGroupChange()
      } else {
        cancelGroupChange()
      }
    }

    // Group functions: the groups a contribution belongs to, shown above the text. The form
    // itself is decided once in utils/creationGroupLabel.
    const groupLabel = (item: Contribution) => creationGroupLabels(item.creationGroups)

    const isAddCommentToMemo = (item: Contribution) =>
      (item.closedBy ?? 0) > 0 || (item.moderatorId ?? 0) > 0 || (item.updatedBy ?? 0) > 0

    const getMemoComment = (item: Contribution) => {
      let comment = ''
      if ((item.closedBy ?? 0) > 0) {
        if (item.contributionStatus === 'CONFIRMED') {
          comment = t('contribution.confirmedBy', { name: item.closedByUserName })
        } else if (item.contributionStatus === 'DENIED') {
          comment = t('contribution.deniedBy', { name: item.closedByUserName })
        } else if (item.contributionStatus === 'DELETED') {
          comment = t('contribution.deletedBy', { name: item.closedByUserName })
        }
      }

      if ((item.updatedBy ?? 0) > 0) {
        if (comment.length) {
          comment += ' | '
        }
        comment += t('moderator.memo-modified', { name: item.updatedByUserName })
      }

      if ((item.moderatorId ?? 0) > 0) {
        if (comment.length) {
          comment += ' | '
        }
        comment += t('contribution.createdBy', { name: item.moderatorUserName })
      }
      return comment
    }

    const handleCopy = (event: ClipboardEvent) => {
      // get from user selected text
      const selectedText = window.getSelection()?.toString()

      if (selectedText) {
        // remove hashtags
        const cleanedText = selectedText.replace(/#([\p{L}\p{N}_-]+)/gu, '')
        event.clipboardData?.setData('text/plain', cleanedText)
        event.preventDefault()
      }
    }

    onMounted(() => {
      document.addEventListener('copy', handleCopy)
    })
    onBeforeUnmount(() => {
      document.removeEventListener('copy', handleCopy)
    })

    const statusIcon = (status: string) => {
      if (status === 'IN_PROGRESS') {
        return <IBiQuestionSquare />
      }
      if (status === 'PENDING') {
        return <IBiBellFill />
      }
      if (status === 'CONFIRMED') {
        return <IBiCheck />
      }
      if (status === 'DENIED') {
        return <IBiXCircle />
      }
      if (status === 'DELETED') {
        return (
          <IBiTrash
            class='p-1'
            width='24'
            height='24'
            style='background-color: #dc3545; color: white'
          />
        )
      }
      return null
    }

    // Still being worked on: a moderator can still decide it.
    const isOpen = (item: Contribution) =>
      item.contributionStatus === 'PENDING' || item.contributionStatus === 'IN_PROGRESS'

    // Decided and done: confirmed, denied or deleted.
    const isClosed = (item: Contribution) =>
      ['CONFIRMED', 'DENIED', 'DELETED'].includes(item.contributionStatus)

    // A conversation with the member: the server names its last message, the moderators'
    // internal notes left out. `messagesCount` counts those notes as well.
    const hasConversation = (item: Contribution) => item.lastMessageType != null

    // What is going on with a contribution, for its details button (Bernd, 24.10.2026). In
    // progress, which only a question to the member makes it: a question waits. Open, and the
    // member had the last word: their answer, or their change of the contribution, which leaves a
    // history entry (the server tells both, `lastMessageType` and `lastMessageByModerator`). A
    // conversation with nothing waiting in it. Or nothing: no conversation at all.
    const detailsState = (item: Contribution) => {
      if (item.contributionStatus === 'IN_PROGRESS') {
        return 'question'
      }
      if (item.contributionStatus === 'PENDING' && item.lastMessageByModerator === false) {
        return item.lastMessageType === 'HISTORY' ? 'changed' : 'answer'
      }
      return hasConversation(item) ? 'conversation' : null
    }

    // The one symbol of the details button, at the desk and on a card. While the row is open, the
    // arrow turned up, whatever the row holds: the button closes it, and the row's own button at
    // its end could go (Bernd, 24.10.2026). Closed: what is going on, and without a conversation
    // the arrow that opens the row, as on the closed tabs.
    // White and without a frame of its own: the button is the frame, and a diamond around one
    // sign, a disc behind another and a circle around a third made the column restless (Bernd,
    // 25.10.2026). Only what waits for the moderation stands out, in a bright yellow
    // (.details-signal): the member's answer and the member's change. The answer's mark is a bold
    // one, as heavy as the pencil -- Bootstrap's own came out thinner than the question mark.
    const detailsIcon = (item: Contribution, showing: boolean) => {
      if (showing) {
        return <IBiArrowUp />
      }
      switch (detailsState(item)) {
        case 'question':
          return <IBiQuestionLg />
        case 'answer':
          return <IIcRoundPriorityHigh class='details-signal' />
        case 'changed':
          return <IBiPencilFill class='details-signal' />
        case 'conversation':
          return <IBiChatDots />
        default:
          return <IBiArrowDown />
      }
    }

    // Its name, for a screen reader and as a tooltip: the word, and what the symbol shows where it
    // shows more than the way into the row (coderabbit, #4193); while the row is open, what a press
    // does then, as the fold of the member search says it.
    const detailsName = (item: Contribution, showing: boolean) => {
      if (showing) {
        return t('hide_details')
      }
      switch (detailsState(item)) {
        case 'question':
          return `${t('details')} – ${t('contribution.detailsState.question')}`
        case 'answer':
          return `${t('details')} – ${t('contribution.detailsState.answer')}`
        case 'changed':
          return `${t('details')} – ${t('contribution.detailsState.changed')}`
        case 'conversation':
          return `${t('details')} – ${t('contribution.detailsState.conversation')}`
        default:
          return t('details')
      }
    }

    // The group of a contribution: a dropdown where it can still be changed, its name otherwise.
    const groupControl = (item: Contribution) =>
      canEditGroup(item) ? (
        <ThemedSelect
          modelValue={displayedCreationGroup(item)}
          options={groupSelectOptions.value}
          // no prop of ThemedSelect: it lands on its element, as it did
          {...({ size: 'sm' } as object)}
          class='group-select'
          aria-label={t('contribution.changeGroup')}
          onUpdate:modelValue={(tag: string) => onGroupPicked(item, tag)}
        />
      ) : (
        <div class='fw-bold'>
          {groupLabel(item) ? (
            <span>{groupLabel(item)}</span>
          ) : (
            <span class='fw-normal fst-italic text-muted'>{t('contribution.noGroup')}</span>
          )}
        </div>
      )

    return () => (
      <div class='open-creations-table'>
        <BTableLite
          items={props.items}
          fields={props.fields as never}
          captionTop
          striped
          hover
          stacked='lg'
          tbodyTrClass={rowClass as never}
        >
          {{
            'cell(contributionStatus)': (row: Row) => statusIcon(row.item.contributionStatus),
            // The action buttons of a row carry an icon and nothing else, so title and
            // aria-label are the only thing that names them: a tooltip for the moderator, an
            // accessible name for a screen reader. Both reuse the key the column header already
            // uses, so a button is called what the column above it is called. The filter button
            // further down has carried this since it was written; the rest of the row had not.
            'cell(bookmark)': (row: Row) =>
              !myself(row.item) ? (
                <div>
                  <BButton
                    variant='danger'
                    size='md'
                    class='me-2'
                    title={t('delete')}
                    aria-label={t('delete')}
                    onClick={() => emit('show-overlay', row.item, 'delete')}
                  >
                    <IBiTrash />
                  </BButton>
                </div>
              ) : null,
            // The filter by the member's e-mail, in a column of its own so it can be reached
            // without opening a contribution first. Its own column rather than an icon beside the
            // name: the name column wraps, and a click target that moves with the text is hard to
            // hit. The details row had the same filter as a funnel beside the address; it went on
            // 16.10.2026 (Bernd: the same function twice, the magnifier is enough).
            'cell(searchUser)': (row: Row) =>
              row.item.user?.emailContact ? (
                <BButton
                  variant='link'
                  class='p-0 border-0 text-primary'
                  title={t('filter.byEmail')}
                  aria-label={t('filter.byEmail')}
                  onClick={() => emit('search-for-email', row.item.user?.emailContact?.email)}
                >
                  <IBiSearch />
                </BButton>
              ) : null,
            'cell(name)': (row: Row) =>
              row.item.user ? (
                <span>
                  {row.item.user.firstName} {row.item.user.lastName}{' '}
                  {row.item.user.alias ? (
                    <small>
                      <hr /> {row.item.user.alias}
                    </small>
                  ) : null}
                </span>
              ) : null,
            // The member's face under the amount, where the row has room (Bernd, 12.09.2026).
            // The moderation talks to a person, and a name plus a number reads like a case. It
            // opens the picture at full size on a tap, where there is one to open.
            'cell(amount)': (row: Row) => {
              const user = row.item.user
              return [
                <div>{row.value}</div>,
                user ? (
                  <MemberAvatar
                    class='mt-2'
                    size={LIST_AVATAR_SIZE}
                    name={memberName(user)}
                    {...avatarFor(user)}
                    onZoom={() => openPicture(user)}
                  />
                ) : null,
              ]
            },
            'cell(memo)': (row: Row) => [
              <div class='mb-1'>{groupControl(row.item)}</div>,
              ' ',
              row.value,
              ' ',
              isAddCommentToMemo(row.item) ? (
                <small class='no-select'>
                  <hr /> {getMemoComment(row.item)}
                </small>
              ) : null,
            ],
            'cell(creaEvaluate)': (row: Row) =>
              showCreaButton(row.item) ? (
                <div>
                  <BButton
                    variant='link'
                    class='crea-logo-btn me-2'
                    title={t('crea.column')}
                    onClick={() => emit('crea-evaluate', row.item)}
                  >
                    <img src={creaLogo} alt={t('crea.column')} class='crea-logo-img' />
                  </BButton>
                </div>
              ) : null,
            // A contribution a moderator entered on someone's behalf is moderated like any other,
            // so it gets the same button and the same message badges. It used to get an edit
            // button of its own here, which also hid the badges -- an unanswered message on one
            // of these was invisible. See the row-details slot for the other half of that split.
            'cell(editCreation)': (row: Row) =>
              !myself(row.item) ? (
                <div>
                  <BButton
                    title={detailsName(row.item, row.detailsShowing)}
                    aria-label={detailsName(row.item, row.detailsShowing)}
                    aria-expanded={row.detailsShowing ? 'true' : 'false'}
                    onClick={() => rowToggleDetails(row, 0)}
                  >
                    {detailsIcon(row.item, row.detailsShowing)}
                  </BButton>
                </div>
              ) : null,
            // The closed tabs' details column: the same button in every row. Without a
            // conversation it used to be a bare arrow, which no keyboard reached and which had no
            // name (coderabbit, #4194).
            'cell(chatCreation)': (row: Row) => (
              <BButton
                title={detailsName(row.item, row.detailsShowing)}
                aria-label={detailsName(row.item, row.detailsShowing)}
                aria-expanded={row.detailsShowing ? 'true' : 'false'}
                onClick={() => rowToggleDetails(row, 0)}
              >
                {detailsIcon(row.item, row.detailsShowing)}
              </BButton>
            ),
            'cell(deny)': (row: Row) =>
              !myself(row.item) ? (
                <div>
                  <BButton
                    variant='warning'
                    size='md'
                    class='me-2'
                    title={t('deny')}
                    aria-label={t('deny')}
                    onClick={() => emit('show-overlay', row.item, 'deny')}
                  >
                    <IBiX />
                  </BButton>
                </div>
              ) : null,
            'cell(confirm)': (row: Row) =>
              !myself(row.item) ? (
                <div>
                  <BButton
                    variant='success'
                    size='md'
                    class='me-2'
                    title={t('save')}
                    aria-label={t('save')}
                    onClick={() => emit('show-overlay', row.item, 'confirm')}
                  >
                    <IBiCheck />
                  </BButton>
                </div>
              ) : null,
            // The two cells of the card a row becomes on a phone (CreationConfirm hands them in
            // place of the desk's columns, the table stacks them). The head: the face, the name
            // and the alias, the amount and the date; for a closed contribution when it was
            // created and closed, which the desk shows in two columns of its own.
            'cell(phoneHead)': (row: Row) => {
              const item = row.item
              const user = item.user
              // Two columns, two rows: the face and the name, then under the face the filter by
              // the member's address -- it finds this member's contributions -- and under the name
              // the group, flush with it (Bernd, 24.10.2026).
              return (
                <div class='phone-head'>
                  <div class='phone-face'>
                    {user ? (
                      <MemberAvatar
                        size={LIST_AVATAR_SIZE}
                        name={memberName(user)}
                        {...avatarFor(user)}
                        onZoom={() => openPicture(user)}
                      />
                    ) : null}
                  </div>
                  {/* min-width 0: a long alias is cut off here instead of widening the card. */}
                  <div style='min-width: 0'>
                    <div class='d-flex justify-content-between gap-2'>
                      <span class='fw-semibold text-break'>
                        {props.showStatus ? (
                          <span class='me-1'>{statusIcon(item.contributionStatus)}</span>
                        ) : null}
                        {user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() : ''}
                      </span>
                      <span class='fw-semibold text-nowrap'>{`${item.amount} GDD`}</span>
                    </div>
                    <div class='d-flex justify-content-between gap-2'>
                      <span class='small text-truncate' style='min-width: 0'>
                        {user?.alias ?? ''}
                      </span>
                      <span class='small text-nowrap'>
                        {formatDateOrDash(item.contributionDate)}
                      </span>
                    </div>
                    {isClosed(item) ? (
                      <div class='small text-body-secondary'>
                        {`${t('createdAt')} ${formatDateOrDash(item.createdAt)} · ${t('contributions.closed')} ${formatDateOrDash(item.closedAt)}`}
                      </div>
                    ) : null}
                  </div>
                  <div class='phone-search'>
                    {user?.emailContact ? (
                      <BButton
                        variant='link'
                        class='phone-icon-btn text-primary'
                        title={t('filter.byEmail')}
                        aria-label={t('filter.byEmail')}
                        onClick={() => emit('search-for-email', user.emailContact?.email)}
                      >
                        <IBiSearch />
                      </BButton>
                    ) : null}
                  </div>
                  <div class='phone-group'>{groupControl(item)}</div>
                </div>
              )
            },
            // The text of the card in full width, below its head, with what the desk adds to it.
            'cell(phoneMemo)': (row: Row) => [
              row.item.memo,
              ' ',
              isAddCommentToMemo(row.item) ? (
                <small class='no-select'>
                  <hr /> {getMemoComment(row.item)}
                </small>
              ) : null,
            ],
            // The buttons of the card, symbols only, in one row (Bernd, 24.10.2026). At the left
            // what takes an open contribution off the list, the bin and the denial, which belong
            // together; at the right Crea, the details and, last, the confirmation, far from the
            // bin. A word for each stands in its tooltip and its accessible name. Each sends what
            // its cell at the desk sends. The moderator's own open contribution offers neither
            // its details nor a decision, as the desk's tab "Offen" does not.
            'cell(phoneActions)': (row: Row) => {
              const item = row.item
              const decide = isOpen(item) && !myself(item)
              return (
                <div class='phone-actions d-flex align-items-center gap-2'>
                  {decide ? (
                    <BButton
                      variant='danger'
                      class='phone-icon-btn'
                      title={t('delete')}
                      aria-label={t('delete')}
                      onClick={() => emit('show-overlay', item, 'delete')}
                    >
                      <IBiTrash />
                    </BButton>
                  ) : null}
                  {decide ? (
                    <BButton
                      variant='warning'
                      class='phone-icon-btn'
                      title={t('deny')}
                      aria-label={t('deny')}
                      onClick={() => emit('show-overlay', item, 'deny')}
                    >
                      <IBiXLg />
                    </BButton>
                  ) : null}
                  <div class='d-flex align-items-center gap-2 ms-auto'>
                    {props.showCrea && showCreaButton(item) ? (
                      <BButton
                        variant='link'
                        class='crea-logo-btn phone-icon-btn'
                        title={t('crea.column')}
                        onClick={() => emit('crea-evaluate', item)}
                      >
                        <img src={creaLogo} alt={t('crea.column')} class='crea-logo-img' />
                      </BButton>
                    ) : null}
                    {isOpen(item) && myself(item) ? null : (
                      <BButton
                        class='phone-icon-btn'
                        title={detailsName(item, row.detailsShowing)}
                        aria-label={detailsName(item, row.detailsShowing)}
                        aria-expanded={row.detailsShowing ? 'true' : 'false'}
                        onClick={() => rowToggleDetails(row, 0)}
                      >
                        {detailsIcon(item, row.detailsShowing)}
                      </BButton>
                    )}
                    {decide ? (
                      <BButton
                        variant='success'
                        class='phone-icon-btn'
                        title={t('contribution.confirm')}
                        aria-label={t('contribution.confirm')}
                        onClick={() => emit('show-overlay', item, 'confirm')}
                      >
                        <IBiCheckLg />
                      </BButton>
                    ) : null}
                  </div>
                </div>
              )
            },
            'row-details': (row: Row) => (
              <RowDetails slotName='show-creation'>
                {{
                  // Every contribution opens the same panel, whoever wrote it. A moderator-entered
                  // one used to open an edit form instead, gated on confirmedAt -- a field the list
                  // query no longer asks for, so the gate has been permanently false and the panel
                  // permanently empty, on every tab. Moderating one of these means talking to the
                  // member, which is what this panel is for, and the backend has allowed it all
                  // along: neither writing a message nor changing the text checks who created it.
                  'show-creation': () => (
                    <ContributionMessagesList
                      // The row of the list query, which asks for the member with what the
                      // panel reads; the template handed it on without that being checked.
                      contribution={row.item as unknown as MessagesListContribution}
                      resubmissionAt={row.item.resubmissionAt}
                      hideResubmission={props.hideResubmission}
                      onUpdate-status={updateStatus}
                      onReload-contribution={reloadContribution}
                      onUpdate-contributions={updateContributions}
                      onResubmission-saved={(event: unknown) => emit('resubmission-saved', event)}
                    />
                  ),
                }}
              </RowDetails>
            ),
          }}
        </BTableLite>

        <BModal
          id='change-group-modal'
          v-model={groupChangeModal.value}
          title={t('contribution.changeGroup')}
          okTitle={t('contribution.changeGroupConfirm')}
          cancelTitle={t('overlay.cancel')}
          onHide={onGroupModalHide as never}
        >
          <p>
            {t('contribution.changeGroupQuestion', {
              from: pendingGroupChange.value.fromLabel,
              to: pendingGroupChange.value.toLabel,
            })}
          </p>
          <p class='fst-italic text-muted mb-0'>{t('contribution.changeGroupHint')}</p>
        </BModal>
      </div>
    )
  },
})
