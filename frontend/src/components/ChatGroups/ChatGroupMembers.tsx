// AI-GENERATED — not an architecture reference
import { useMutation } from '@vue/apollo-composable'
import { BButton, BModal, type ButtonVariant } from 'bootstrap-vue-next'
import { computed, defineComponent, nextTick, type PropType, ref, useId, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppAvatar } from '@/components/AppAvatar'
import { ChatGroupPicker } from '@/components/ChatGroups/ChatGroupPicker'
import {
  CHAT_GROUP_TITLE_MAX,
  chatGroupPartMark,
  chatGroupRefusal,
  chatGroupTitle,
  isChatGroupTitle,
} from '@/components/ChatGroups/chatGroupDisplay'
import type { Contact, ContactUser } from '@/components/Contacts/contactDisplay'
import { Name } from '@/components/TransactionRows/Name'
import { avatarZoomBindings } from '@/composables/useAvatarZoom'
import { memberAvatarProps } from '@/composables/useMemberAvatars'
import { LIST_AVATAR_SIZE } from '@/constants'
import {
  addChatGroupMembers,
  leaveChatGroup,
  removeChatGroupMember,
  renameChatGroup,
  setChatGroupModerator,
} from '@/graphql/chatGroups.graphql'
import { useWalletStore } from '@/store/useWalletStore'
import { CHAT_GROUP_MODERATOR, CHAT_GROUP_OWNER, managesChatGroup } from '@/utils/chatGroupRoles'
import { chatMemberKey } from '@/utils/chatMemberKey'
import { memberAlias } from '@/utils/gradidoAddress'
import IBiX from '~icons/bi/x'
import IMdiDotsVertical from '~icons/mdi/dots-vertical'
import IMdiPlus from '~icons/mdi/plus'
import classes from './ChatGroupMembers.module.scss'

/** The group as the list delivers it: what the dialog reads of it. */
type MembersGroup = {
  groupUuid: string
  title: string
  role?: string | null
  [field: string]: unknown
}

/** One member as chatGroupMembersQuery answers. */
export type GroupMember = { user: ContactUser; role?: string | null; [field: string]: unknown }

/** Which view the dialog shows. */
type View = 'list' | 'add' | 'rename' | 'leave' | 'remove'

/** A class in both spellings: the plain name, which the specs read, and the module's, which carries the rule. */
const cls = (name: string) => [name, classes[name]]

/**
 * The members of a group (P5) and what the member may do about them (E-050 F4): the owner takes
 * people in and out, makes up to five moderators and renames; a moderator takes people in, takes
 * plain members out and renames; everybody may leave.
 *
 * `group` is the group as the list delivers it (its uuid, its name, the member's own part);
 * `members` its members as chatGroupMembersQuery answers, the longest-standing first; `contacts`
 * the contact list the page holds, to take people in from.
 *
 * `changed`: the members or the name are different now -- the window asks for the members again,
 * and the page for its list. `left`: the member is out of the group.
 */
export const ChatGroupMembers = defineComponent({
  name: 'ChatGroupMembers',
  props: {
    modelValue: { type: Boolean, default: false },
    group: { type: Object as PropType<MembersGroup>, required: true },
    members: { type: Array as PropType<GroupMember[]>, required: true },
    loaded: { type: Boolean, default: true },
    contacts: { type: Array as PropType<Contact[]>, required: true },
  },
  /**
   * `changed`: a step went through, the window asks for the members again. `left`: the member left
   * the group. `openMember`: somebody else's name was tapped (E-053) -- the user of that row.
   */
  emits: ['update:modelValue', 'changed', 'left', 'openMember'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const store = useWalletStore()
    const menuId = `${useId()}-menu`
    const nameId = `${useId()}-name`

    const { mutate: takeIn } = useMutation(addChatGroupMembers)
    const { mutate: takeOut } = useMutation(removeChatGroupMember)
    const { mutate: leave } = useMutation(leaveChatGroup)
    const { mutate: moderate } = useMutation(setChatGroupModerator)
    const { mutate: rename } = useMutation(renameChatGroup)

    /** The member's own part in the group, as the list delivers it. */
    const role = computed(() => props.group.role)
    const manages = computed(() => managesChatGroup(role.value))

    /** By the Gradido ID, as the group's window asks it (every member is of this community, E-026). */
    const isMe = (user: ContactUser | null | undefined) =>
      String(user?.gradidoID ?? '').toLowerCase() === String(store.gradidoID ?? '').toLowerCase()

    /**
     * Whom the member may do something with (E-050 F4): the owner with everybody else; a moderator
     * with a plain member; nobody with themselves -- leaving is its own button.
     */
    const touchable = (member: GroupMember) => {
      if (isMe(member.user) || member.role === CHAT_GROUP_OWNER) {
        return false
      }
      if (role.value === CHAT_GROUP_OWNER) {
        return true
      }
      return role.value === CHAT_GROUP_MODERATOR && member.role !== CHAT_GROUP_MODERATOR
    }

    /** One row a member: the face through the lists' helper, "Du (Bernd)" for oneself. */
    const rows = computed(() =>
      props.members.map((member, index) => {
        const base = memberAvatarProps(member.user)
        const alias = memberAlias(member.user.alias, member.user.gradidoID)
        const me = isMe(member.user)
        return {
          member,
          index,
          id: chatMemberKey(member.user),
          alias,
          me,
          name: me ? t('chatGroup.memberYou', { name: alias }) : alias,
          part: chatGroupPartMark(member.role, { t }),
          avatar: { ...base, ...avatarZoomBindings(member.user, base) },
          touchable: touchable(member),
        }
      }),
    )
    type Row = (typeof rows.value)[number]

    /** Which view the dialog shows: the list, 'add', 'rename', 'leave' or 'remove'. */
    const view = ref<View>('list')
    const menuFor = ref<string | null>(null)
    const chosen = ref<ContactUser[]>([])
    const newTitle = ref('')
    /** The member the question before taking somebody out is about. */
    const toRemove = ref<Row | null>(null)
    const busy = ref(false)
    const problem = ref('')
    /** The refusal's line under a member's keys, to bring it into sight. */
    const problemLine = ref<HTMLElement | null>(null)
    /** In the list a refusal stands in the open row, under the keys it came from. */
    const problemInRow = computed(() => view.value === 'list' && menuFor.value !== null)

    /** Opens a member's keys, or closes them. What was refused under other keys goes with them. */
    const toggleMenu = (row: Row) => {
      menuFor.value = menuFor.value === row.id ? null : row.id
      problem.value = ''
    }

    const openView = (next: View) => {
      view.value = next
      menuFor.value = null
      problem.value = ''
      if (next === 'add') {
        chosen.value = []
      }
      if (next === 'rename') {
        newTitle.value = props.group.title
      }
    }

    /** Every opening shows the list, with nothing left over from the last one. */
    watch(
      () => props.modelValue,
      (open) => {
        if (open) {
          openView('list')
        }
      },
    )

    const viewTitle = computed(() => {
      switch (view.value) {
        case 'add':
          return t('chatGroup.addMembers')
        case 'rename':
          return t('chatGroup.renameTitle')
        case 'leave':
          return t('chatGroup.leaveTitle', { name: props.group.title })
        case 'remove':
          return t('chatGroup.removeTitle', { name: toRemove.value?.alias ?? '' })
        default:
          return t('chatGroup.membersTitle', { n: props.members.length })
      }
    })

    /**
     * Who takes over where the owner leaves: the longest-standing moderator, else the
     * longest-standing member (the server's rule, P5a) -- the list comes longest-standing first.
     */
    const successor = computed(() => {
      const others = props.members.filter((member) => !isMe(member.user))
      const next =
        others.find((member) => member.role === CHAT_GROUP_MODERATOR) ?? others[0] ?? null
      return next ? memberAlias(next.user.alias, next.user.gradidoID) : ''
    })

    /** The question's sentence: what the step means, and that only somebody else can undo it. */
    const questionText = computed(() => {
      if (view.value === 'remove') {
        return t('chatGroup.removeBody', { name: toRemove.value?.alias ?? '' })
      }
      if (role.value === CHAT_GROUP_OWNER && successor.value) {
        return t('chatGroup.leaveBodyOwner', { name: successor.value })
      }
      return t('chatGroup.leaveBody')
    })

    const goText = computed(() => {
      switch (view.value) {
        case 'add':
          return t('chatGroup.addGo')
        case 'rename':
          return t('chatGroup.renameGo')
        case 'remove':
          return t('chatGroup.remove')
        default:
          return t('chatGroup.leave')
      }
    })

    const canGo = computed(() => {
      if (busy.value) {
        return false
      }
      if (view.value === 'add') {
        return chosen.value.length > 0
      }
      if (view.value === 'rename') {
        return (
          isChatGroupTitle(newTitle.value) && chatGroupTitle(newTitle.value) !== props.group.title
        )
      }
      return true
    })

    const refOf = (user: ContactUser) => ({
      gradidoID: user.gradidoID,
      communityUuid: user.communityUuid ?? null,
    })

    /**
     * One step against the server. The dialog waits while it is on its way; what went wrong stands
     * in the dialog, in the member's words (chatGroupRefusal).
     */
    const step = async (ask: () => unknown, then: () => void) => {
      if (busy.value) {
        return
      }
      busy.value = true
      problem.value = ''
      try {
        await ask()
        then()
      } catch (error) {
        problem.value = chatGroupRefusal(error as Error, { t })
      } finally {
        busy.value = false
      }
    }

    /**
     * The question before taking somebody out -- not while a step is on its way (coderabbit,
     * #4013): its refusal would then stand under the question about somebody else.
     */
    const askRemove = (row: Row) => {
      if (busy.value) {
        return
      }
      toRemove.value = row
      openView('remove')
    }

    const setModerator = async (row: Row, moderator: boolean) => {
      if (busy.value) {
        return
      }
      await step(
        () =>
          moderate({
            groupUuid: props.group.groupUuid,
            member: refOf(row.member.user),
            moderator,
          }),
        () => {
          menuFor.value = null
          emit('changed')
        },
      )
      // A refusal belongs under the keys of the member it is about, whatever was opened or closed
      // while the answer was on its way -- and into sight, in a list that scrolls.
      if (!problem.value || view.value !== 'list') {
        return
      }
      menuFor.value = row.id
      await nextTick()
      problemLine.value?.scrollIntoView?.({ block: 'nearest' })
    }

    const go = () => {
      if (!canGo.value) {
        return
      }
      const groupUuid = props.group.groupUuid
      switch (view.value) {
        case 'add':
          step(
            () => takeIn({ groupUuid, members: chosen.value.map(refOf) }),
            () => {
              openView('list')
              emit('changed')
            },
          )
          break
        case 'rename':
          step(
            () => rename({ groupUuid, title: chatGroupTitle(newTitle.value) }),
            () => {
              openView('list')
              emit('changed')
            },
          )
          break
        case 'remove':
          step(
            () => takeOut({ groupUuid, member: refOf((toRemove.value as Row).member.user) }),
            () => {
              toRemove.value = null
              openView('list')
              emit('changed')
            },
          )
          break
        default:
          step(
            () => leave({ groupUuid }),
            () => {
              emit('update:modelValue', false)
              emit('left')
            },
          )
      }
    }

    const setOpen = (open: boolean) => emit('update:modelValue', open)

    /** The list. */
    const renderList = () => (
      <>
        {manages.value ? (
          <button
            type='button'
            class={cls('chat-group-members-add')}
            data-test='chat-group-members-add'
            onClick={() => openView('add')}
          >
            <IMdiPlus aria-hidden='true' />
            {t('chatGroup.addMembers')}
          </button>
        ) : null}
        <ul class={cls('chat-group-members-list')} data-test='chat-group-members-list'>
          {rows.value.map((row) => (
            <li
              key={row.id}
              class={cls('chat-group-member')}
              data-test={`chat-group-member-${row.member.user.gradidoID}`}
            >
              <div class={cls('chat-group-member-line')}>
                {/* At the size of every list, and it opens large where there is a picture: it
                    stands outside any button here. */}
                <AppAvatar size={LIST_AVATAR_SIZE} color='#fff' {...row.avatar} />
                <div class={cls('chat-group-member-words')}>
                  {/* Somebody else's name leads to them (E-053) -- the page knows whether they are
                      a contact: their window over this one, else the send form. One's own is
                      words. */}
                  <div class={cls('chat-group-member-name')} data-test='chat-group-member-name'>
                    {!row.me ? (
                      <Name
                        linkedUser={row.member.user}
                        withCommunity={false}
                        onOpen={(user: unknown) => emit('openMember', user)}
                      />
                    ) : (
                      row.name
                    )}
                  </div>
                  {row.member.user.communityName ? (
                    <span
                      class={cls('chat-group-member-sub')}
                      data-test='chat-group-member-community'
                    >
                      {row.member.user.communityName}
                    </span>
                  ) : null}
                </div>
                {row.part ? (
                  <span
                    class={[
                      cls('chat-group-member-part'),
                      row.member.role === CHAT_GROUP_OWNER ? cls('is-owner') : '',
                    ]}
                    data-test='chat-group-member-part'
                  >
                    {row.part}
                  </span>
                ) : null}
                {/* What the member may do with this one (E-050 F4): the owner with everybody else,
                    a moderator with a plain member. A disclosure, not an ARIA menu: its entries
                    are plain buttons under the row, reached with Tab. */}
                {row.touchable ? (
                  <button
                    type='button'
                    class={cls('chat-group-member-more')}
                    aria-label={t('chatGroup.memberMenu', { name: row.alias })}
                    title={t('chatGroup.memberMenu', { name: row.alias })}
                    aria-expanded={menuFor.value === row.id ? 'true' : 'false'}
                    aria-controls={`${menuId}-${row.index}`}
                    data-test='chat-group-member-more'
                    onClick={() => toggleMenu(row)}
                  >
                    <IMdiDotsVertical aria-hidden='true' />
                  </button>
                ) : null}
              </div>
              {menuFor.value === row.id ? (
                <div
                  id={`${menuId}-${row.index}`}
                  class={cls('chat-group-member-menu')}
                  data-test='chat-group-member-menu'
                >
                  {/* Two written-out keys for the two ways, for the i18n lint. */}
                  {role.value === CHAT_GROUP_OWNER ? (
                    <button
                      type='button'
                      data-test='chat-group-member-moderator'
                      aria-disabled={busy.value ? 'true' : 'false'}
                      onClick={() => setModerator(row, row.member.role !== CHAT_GROUP_MODERATOR)}
                    >
                      {row.member.role === CHAT_GROUP_MODERATOR
                        ? t('chatGroup.moderatorOff')
                        : t('chatGroup.moderatorOn')}
                    </button>
                  ) : null}
                  <button
                    type='button'
                    class={cls('is-danger')}
                    data-test='chat-group-member-remove'
                    aria-disabled={busy.value ? 'true' : 'false'}
                    onClick={() => askRemove(row)}
                  >
                    {t('chatGroup.remove')}
                  </button>
                  {/* What went wrong with a step from these keys stands right under them: under
                      the list it stood below the last member, out of sight in any group longer
                      than the dialog. */}
                  {problem.value ? (
                    <p
                      ref={(el) => {
                        problemLine.value = el as HTMLElement | null
                      }}
                      class={cls('chat-group-member-problem')}
                      role='alert'
                      data-test='chat-group-members-problem'
                    >
                      {problem.value}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
        {!props.loaded ? (
          <p class={cls('chat-group-members-quiet')} data-test='chat-group-members-loading'>
            {t('chatGroup.membersLoading')}
          </p>
        ) : null}
      </>
    )

    /** Taking people in: the member's own contacts, those in the group already left out. */
    const renderAdd = () => (
      <>
        <ChatGroupPicker
          modelValue={chosen.value}
          contacts={props.contacts}
          excluded={props.members.map((member) => member.user)}
          onUpdate:modelValue={(picked: ContactUser[]) => {
            chosen.value = picked
          }}
        />
        <p class='small text-muted mt-3 mb-0' data-test='chat-group-members-add-hint'>
          {t('chatGroup.addHint')}
        </p>
      </>
    )

    /** A new name. */
    const renderRename = () => (
      <>
        <label class='form-label' for={nameId}>
          {t('chatGroup.name')}
        </label>
        <input
          id={nameId}
          v-model={newTitle.value}
          type='text'
          class='form-control'
          maxlength={CHAT_GROUP_TITLE_MAX}
          autocomplete='off'
          data-test='chat-group-members-name'
        />
      </>
    )

    /** The question before leaving, or before taking somebody out. */
    const renderQuestion = () => (
      <p class='mb-0' data-test='chat-group-members-question'>
        {questionText.value}
      </p>
    )

    const renderView = () => {
      switch (view.value) {
        case 'list':
          return renderList()
        case 'add':
          return renderAdd()
        case 'rename':
          return renderRename()
        default:
          return renderQuestion()
      }
    }

    /* The members of a group (P5, the mockup), over the group's window as the picture's editor
       stands over the contact window: its own BModal, stacked. A sheet on a phone, a dialog whose
       list scrolls on a desk. No header -- the title stands in the body, the dialog is named by
       `aria-label` -- and the cross at the top, as in the windows.

       One dialog, four views: the list; taking people in; a new name; and the question before a
       step that only somebody else can undo (leaving, taking somebody out). */
    // The slots as the tag's child, not as `v-slots` on it: modalProps.spec reads the names on
    // the opening tag and holds them against the installed BModal.
    return () => (
      <BModal
        modelValue={props.modelValue}
        fullscreen='sm'
        scrollable
        lazy
        no-header
        aria-label={viewTitle.value}
        data-test='chat-group-members'
        onUpdate:modelValue={setOpen}
      >
        {{
          default: () => (
            <>
              <div class={cls('chat-group-members-top')}>
                <p class='h5 mb-0' data-test='chat-group-members-title'>
                  {viewTitle.value}
                </p>
                <button
                  type='button'
                  class={cls('chat-group-members-close')}
                  aria-label={t('form.close')}
                  title={t('form.close')}
                  data-test='chat-group-members-close'
                  onClick={() => emit('update:modelValue', false)}
                >
                  <IBiX />
                </button>
              </div>

              {renderView()}

              {problem.value && !problemInRow.value ? (
                <p class='mt-3 mb-0' role='alert' data-test='chat-group-members-problem'>
                  {problem.value}
                </p>
              ) : null}
            </>
          ),
          footer: () =>
            view.value === 'list' ? (
              <>
                {manages.value ? (
                  <BButton
                    variant='secondary'
                    data-test='chat-group-members-rename'
                    onClick={() => openView('rename')}
                  >
                    {t('chatGroup.rename')}
                  </BButton>
                ) : null}
                <BButton
                  variant='outline-danger'
                  data-test='chat-group-members-leave'
                  onClick={() => openView('leave')}
                >
                  {t('chatGroup.leave')}
                </BButton>
              </>
            ) : (
              <>
                <BButton
                  variant='secondary'
                  data-test='chat-group-members-back'
                  onClick={() => openView('list')}
                >
                  {view.value === 'add' || view.value === 'rename' ? t('back') : t('form.cancel')}
                </BButton>
                {/* The step itself. `aria-disabled` while it cannot be taken or is on its way. */}
                <BButton
                  variant={
                    view.value === 'leave' || view.value === 'remove'
                      ? 'danger'
                      : ('gradido' as ButtonVariant)
                  }
                  class={cls('chat-group-members-go')}
                  aria-disabled={canGo.value ? 'false' : 'true'}
                  data-test='chat-group-members-go'
                  onClick={go}
                >
                  {goText.value}
                </BButton>
              </>
            ),
        }}
      </BModal>
    )
  },
})
