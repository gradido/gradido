// AI-GENERATED — not an architecture reference
import { useApolloClient, useMutation } from '@vue/apollo-composable'
import { BModal } from 'bootstrap-vue-next'
import { computed, defineComponent, type PropType, provide, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { AppAvatar } from '@/components/AppAvatar'
import { ChatForwardDialog } from '@/components/Chat/ChatForwardDialog'
import { ChatNote } from '@/components/Chat/ChatNote'
import { ChatSearchBar } from '@/components/Chat/ChatSearchBar'
import { ChatThread, type ChatThreadHandle } from '@/components/Chat/ChatThread'
import { ChatVideoCall, type ChatVideoCallHandle } from '@/components/Chat/ChatVideoCall'
import { ChatWindowSizeToggle } from '@/components/Chat/ChatWindowSizeToggle'
import { ChatGroupMembers, type GroupMember } from '@/components/ChatGroups/ChatGroupMembers'
import {
  CHAT_GROUP_META_SEPARATOR,
  chatGroupAvatar,
  chatGroupOwnPart,
} from '@/components/ChatGroups/chatGroupDisplay'
import type { Contact, ContactUser } from '@/components/Contacts/contactDisplay'
import { useChatWindowNote } from '@/composables/useChatWindowNote'
import { useChatWindowSearch } from '@/composables/useChatWindowSearch'
import { useChatWindowSize } from '@/composables/useChatWindowSize'
import { fetchMemberAvatars, memberAvatarProps } from '@/composables/useMemberAvatars'
import { useSendReturn } from '@/composables/useSendReturn'
import { useAppToast } from '@/composables/useToast'
import { SMALL_FACE_SIZE } from '@/constants'
import { chatGroupMembersQuery, setChatGroupMuted } from '@/graphql/chatGroups.graphql'
import { useWalletStore } from '@/store/useWalletStore'
import { managesChatGroup } from '@/utils/chatGroupRoles'
import { chatMemberKey } from '@/utils/chatMemberKey'
import { CHAT_VIDEO_JOIN, CHAT_VIDEO_JOINED } from '@/utils/chatVideoApp'
import { noteChatVideoJoined } from '@/utils/chatVideoJoined'
import { memberAlias } from '@/utils/gradidoAddress'
import { SEND_TYPES } from '@/utils/sendTypes'
import IBiX from '~icons/bi/x'
import IMdiBellOffOutline from '~icons/mdi/bell-off-outline'
import IMdiBellOutline from '~icons/mdi/bell-outline'
import IMdiMagnify from '~icons/mdi/magnify'
import IMdiNoteText from '~icons/mdi/note-text'
import IMdiNoteTextOutline from '~icons/mdi/note-text-outline'
import IMdiVideoOutline from '~icons/mdi/video-outline'
import classes from './ChatGroupWindow.module.scss'

/** Somebody named in the group: who opened it, who wrote a message. */
type GroupUser = {
  gradidoID?: string | null
  communityUuid?: string | null
  communityName?: string | null
  alias?: string | null
}

/** One of `chatGroupsQuery`: what the window reads of it. */
type WindowGroup = {
  groupUuid: string
  title: string
  communityName?: string | null
  role?: string | null
  memberCount?: number
  mutedByMe?: boolean | null
  createdAt?: string
  createdBy?: GroupUser | null
  [field: string]: unknown
}

/** The group as the thread takes it, and what the thread hands on of a message. */
type ThreadProps = InstanceType<typeof ChatThread>['$props']
type ForwardProps = InstanceType<typeof ChatForwardDialog>['$props']
type Forwarded = NonNullable<ForwardProps['message']> & {
  senderUser?: GroupUser | null
  sender?: GroupUser | null
}

/** A class in both spellings: the plain name, which the specs read, and the module's, which carries the rule. */
const cls = (name: string) => [name, classes[name]]

/**
 * One chat group (P5), opened from the list on "Kontakte & Chat". One window for the page, as for
 * the contacts (KF-010).
 *
 * `group` is one of `chatGroupsQuery`: the page hands the newest it has, so a name or a part that
 * changed shows here as soon as the list is asked again.
 */
export const ChatGroupWindow = defineComponent({
  name: 'ChatGroupWindow',
  props: {
    modelValue: { type: Boolean, default: false },
    group: { type: Object as PropType<WindowGroup | null>, default: null },
    /** The contact list the page holds: whom the members' dialog may take in. */
    contacts: { type: Array as PropType<Contact[]>, default: () => [] },
  },
  /**
   * `changed`: something about the group is different now -- muted or lifted, a member in or out, a
   * part or the name changed, the member left -- and the page asks for its list again.
   *
   * `openMember`: a member whose name was tapped, in the list or over their message (E-053). The
   * page knows who is a contact, and opens their window over this one -- for somebody who is none
   * yet the window's first form, a first word in one tap (E-055).
   */
  emits: ['update:modelValue', 'changed', 'openMember'],
  setup(props, { emit }) {
    /**
     * A writer named over their message carries what the message says of them -- no community name,
     * which the list of members has. The group's own community is named with the group (it lives on
     * its founder's server, E-008), so a writer of that community is handed on with its name: the
     * window opened on them names their community as it does from the list (E-055). A writer of
     * another community goes as they are.
     */
    const openWriter = (user: GroupUser) => {
      const home = props.group?.createdBy?.communityUuid
      const sameCommunity =
        Boolean(home) &&
        String(user?.communityUuid ?? '').toLowerCase() === (home as string).toLowerCase()
      emit(
        'openMember',
        sameCommunity && !user.communityName
          ? { ...user, communityName: (props.group as WindowGroup).communityName }
          : user,
      )
    }

    const { t, d } = useI18n()
    const store = useWalletStore()
    const { toastSuccess, toastError } = useAppToast()
    const { mutate: saveMuted } = useMutation(setChatGroupMuted)
    const { client: apolloClient } = useApolloClient()

    /**
     * The group's members (chatGroupMembersQuery), asked when the window opens or comes to another
     * group, and again after a change in the members' dialog -- the longest-standing first. Their
     * faces are asked for as the lists ask for theirs. Only the newest answer counts.
     */
    const members = ref<GroupMember[]>([])
    const membersLoaded = ref(false)
    const membersOpen = ref(false)
    let membersAsked = 0

    const loadMembers = async () => {
      const groupUuid = props.group?.groupUuid
      if (!groupUuid) {
        return
      }
      const mine = ++membersAsked
      try {
        const { data } = await apolloClient.query({
          query: chatGroupMembersQuery,
          variables: { groupUuid },
          fetchPolicy: 'network-only',
        })
        if (mine !== membersAsked) {
          return
        }
        members.value = data?.chatGroupMembers ?? []
        membersLoaded.value = true
        fetchMemberAvatars(
          apolloClient,
          members.value.map((member) => member.user),
        )
      } catch {
        // The members as they were; the dialog says it is still asking where there are none.
      }
    }

    watch(
      () => [props.modelValue, props.group?.groupUuid] as const,
      ([open, groupUuid], before) => {
        if (!open || !groupUuid) {
          return
        }
        if (before?.[0] && before[1] === groupUuid) {
          return
        }
        members.value = []
        membersLoaded.value = false
        membersOpen.value = false
        loadMembers()
      },
      { immediate: true },
    )

    /** Up to four faces for the button: the longest-standing members, oneself included. */
    const strip = computed(() =>
      members.value.slice(0, 4).map((member) => ({
        id: chatMemberKey(member.user),
        avatar: memberAvatarProps(member.user),
      })),
    )

    /** The dialog changed the members or the name: both asked again. */
    const membersChanged = () => {
      loadMembers()
      emit('changed')
    }

    const router = useRouter()

    /**
     * A member chosen under a video call of the member's own in this group (W2, Bernd 28.10.2026):
     * the send form with them named, the window closed -- the road the contact window's "Gradido
     * senden" takes (ContactWindow `toSend`), a member of another community included: the send form
     * is what knows the federation branch.
     *
     * The form's "Zurück" leads back into this group (E-043): the window hands its place over
     * (useSendReturn) -- the address the group's mails have (E-049), which opens the group on the
     * contacts page, and from there the next member can be thanked. Where the form is not reached,
     * it is taken back.
     */
    const sendReturn = useSendReturn()
    const toSendMember = async (user: GroupUser | null | undefined) => {
      const community = user?.communityUuid
      const person = user?.gradidoID
      if (!community || !person) {
        return
      }
      emit('update:modelValue', false)
      const to = `/send/${community}/${person}`
      const handed = sendReturn.put({
        to,
        back: { path: '/contacts', query: { group: (props.group as WindowGroup).groupUuid } },
      })
      let reached = false
      try {
        const failure = await router.push({ path: to, query: { art: SEND_TYPES.send } })
        reached = !failure
      } finally {
        if (!reached) {
          sendReturn.drop(handed)
        }
      }
    }

    /** The member left the group: the window closes, and the page's list lets the group go. */
    const left = () => {
      emit('update:modelValue', false)
      emit('changed')
    }

    const avatar = computed(() => chatGroupAvatar(props.group))

    /** "5 Mitglieder · Du bist Inhaber". */
    const countLine = computed(() => {
      const group = props.group as WindowGroup
      return [
        t('chatGroup.memberCount', group.memberCount as number),
        chatGroupOwnPart(group.role, { t }),
      ]
        .filter(Boolean)
        .join(CHAT_GROUP_META_SEPARATOR)
    })

    /**
     * Whether the member signed in is the one named. By the Gradido ID alone, without regard to
     * case as the server compares it: in P5 every member of a group is of this community (E-026),
     * and a store from before `communityUuid` holds none to pair it with.
     */
    const isMe = (user: GroupUser | null | undefined) =>
      Boolean(user?.gradidoID) &&
      String(user?.gradidoID).toLowerCase() === String(store.gradidoID ?? '').toLowerCase()

    /**
     * "Gruppe seit September 2026 · angelegt von Anna" -- the month, as the contact window says
     * since when somebody is a contact. "von Dir" for one's own group; nothing about the opener
     * where their users row is gone.
     */
    const metaLine = computed(() => {
      const group = props.group as WindowGroup
      const since = t('chatGroup.since', {
        date: d(new Date(group.createdAt as string), 'monthAndYear'),
      })
      const opener = group.createdBy
      let by = ''
      if (isMe(opener)) {
        by = t('chatGroup.openedByYou')
      } else if (opener?.gradidoID) {
        by = t('chatGroup.openedBy', { name: memberAlias(opener.alias, opener.gradidoID) })
      }
      return [since, by].filter(Boolean).join(CHAT_GROUP_META_SEPARATOR)
    })

    /** The bell's state: the member's own mark on the group, as they switched it last. */
    const muted = ref(false)
    let mutingInFlight = false

    /**
     * The mark as the list delivers it -- when the window opens, when it comes to another group,
     * and when the list is asked again. Not while a switch of the member's own is on its way: the
     * list asked in between would put back what the member has just changed.
     */
    watch(
      () => [props.group?.groupUuid, props.group?.mutedByMe] as const,
      ([, mutedByMe]) => {
        if (!mutingInFlight) {
          muted.value = Boolean(mutedByMe)
        }
      },
      { immediate: true },
    )

    const bellName = computed(() =>
      muted.value
        ? t('chatGroup.muteOff', { name: props.group?.title ?? '' })
        : t('chatGroup.muteOn', { name: props.group?.title ?? '' }),
    )

    /**
     * Switched here first and confirmed by the server after, put back where it fails -- as the
     * contact window's bell does. `false` from the server is no change: put back, and nothing said.
     */
    const toggleMute = async () => {
      if (mutingInFlight || !props.group) {
        return
      }
      mutingInFlight = true
      const { groupUuid, title: name } = props.group
      const wanted = !muted.value
      muted.value = wanted
      try {
        const answer = await saveMuted({ groupUuid, muted: wanted })
        if (props.group?.groupUuid !== groupUuid) {
          return
        }
        if (answer?.data?.setChatGroupMuted) {
          // Two written-out keys, for the i18n lint.
          toastSuccess(
            wanted ? t('chatGroup.mutedHint', { name }) : t('chatGroup.unmutedHint', { name }),
          )
          emit('changed')
        } else {
          muted.value = !wanted
        }
      } catch (error) {
        if (props.group?.groupUuid !== groupUuid) {
          return
        }
        muted.value = !wanted
        toastError((error as Error).message)
      } finally {
        mutingInFlight = false
      }
    }
    /** The thread of the group: a video invitation goes out through it (`deliver`), as a message. */
    const thread = ref<ChatThreadHandle | null>(null)

    /** The search in the group's conversation (E-057, useChatWindowSearch): closed with the window, and anew for another group. */
    const {
      searchOpen,
      searchTyped,
      searchFound,
      searchToggle,
      toggleSearch,
      closeSearch,
      takeFound,
    } = useChatWindowSearch(
      () => props.modelValue,
      () => props.group?.groupUuid,
    )

    /** The member's own note on this group (useChatWindowNote): asked for whenever the window opens, and anew for another group. */
    const {
      noteOpen,
      noteText,
      noteStatus,
      noteReady,
      hasNote,
      noteToggle,
      typeNote,
      retryNote,
      toggleNote,
      closeNote,
    } = useChatWindowNote(
      () => props.modelValue,
      () => (props.group?.groupUuid ? { groupUuid: props.group.groupUuid } : null),
    )
    /** Note and search take turns: the one that opens closes the other. */
    const toggleNoteHere = () => {
      if (!noteOpen.value) {
        closeSearch({ focus: false })
      }
      toggleNote()
    }
    const toggleSearchHere = () => {
      if (!searchOpen.value) {
        closeNote({ focus: false })
      }
      toggleSearch()
    }

    /**
     * Whether the window stands large (E-077, useChatWindowSize): the switch beside the magnifier
     * turns it, for every chat window of the page, and the member's device remembers it.
     */
    const { large } = useChatWindowSize()
    /** The questions of a video call (ChatVideoCall, E-053). */
    const videoCall = ref<ChatVideoCallHandle | null>(null)
    const videoCallName = computed(() =>
      t('chatGroup.videoCall', { name: props.group?.title ?? '' }),
    )

    /**
     * Whether the question offers to send the invitation by mail to everybody: the owner and the
     * moderators (E-050 F5, as the bar's box), and only where anybody else is in the group.
     */
    const canAnnounce = computed(
      () => managesChatGroup(props.group?.role) && (props.group?.memberCount ?? 0) > 1,
    )

    /** The invitation through the group's thread; nothing goes where there is none. */
    const deliverThroughThread = (message: Parameters<ChatThreadHandle['deliver']>[0]) =>
      thread.value ? thread.value.deliver(message) : Promise.resolve(false)

    /**
     * A video invitation of one's own is changed through the thread as well (E-060): the thread
     * puts the changed message in the old one's place. '' where it went through, else what the
     * problem was.
     */
    const editThroughThread = (changed: Parameters<ChatThreadHandle['edit']>[0]) =>
      thread.value ? thread.value.edit(changed) : Promise.resolve('OTHER')

    /** The question before joining a call, asked by the link of an invitation in the group's thread. */
    provide(CHAT_VIDEO_JOIN, (roomUrl: string, messageUuid: string) =>
      videoCall.value?.askJoin(roomUrl, messageUuid),
    )

    /**
     * The member went into the room of an invitation in the group's thread from this wallet
     * (E-043 C), as in the contact window: noted by the invitation the link stands in, where the
     * thread reads it as one into that room -- the room's address kept nowhere
     * (utils/chatVideoJoined).
     */
    provide(CHAT_VIDEO_JOINED, (roomUrl: string, messageUuid: string) =>
      noteChatVideoJoined(store.gradidoID, thread.value?.invitationInRoom?.(roomUrl, messageUuid)),
    )

    /**
     * Forwarding a message of the thread (E-059): the window asks where to, in a dialog over
     * itself. Who wrote it, as the thread names them over their message -- the dialog says "Du"
     * for one's own.
     */
    const forwardOpen = ref(false)
    const forwarding = ref<Forwarded | null>(null)
    const forwardWriter = ref('')
    const forwardMessage = (message: Forwarded) => {
      const writer = message.senderUser ?? message.sender
      forwarding.value = message
      forwardWriter.value = writer?.gradidoID ? memberAlias(writer.alias, writer.gradidoID) : ''
      forwardOpen.value = true
    }

    // Another group in the window: a question about a call in the last one is let go. (A new name
    // is the same group: its uuid stays, and the question with it.)
    watch(
      () => props.group?.groupUuid,
      () => videoCall.value?.letGo(),
    )

    const setOpen = (open: boolean) => emit('update:modelValue', open)

    /* A group's window (P5), built as the contact window is (ContactWindow): a sheet over the
       whole screen on a phone (`fullscreen='sm'`), at the top of the screen on a desk, so it grows
       downwards only when the thread lands (E-031). `no-header` / `no-footer` -- NOT `hide-…`,
       which bootstrap-vue-next does not know -- and therefore a name of its own (`aria-label`).
       `lazy`: a closed window renders nothing. */
    return () => (
      <BModal
        modelValue={props.modelValue}
        fullscreen='sm'
        lazy
        no-header
        no-footer
        aria-label={props.group?.title ?? ''}
        body-class='chat-group-window-body'
        dialog-class={large.value ? 'chat-window-large' : undefined}
        data-test='chat-group-window'
        onUpdate:modelValue={setOpen}
      >
        {props.group ? (
          <div class={[cls('chat-group-window-inner'), large.value ? cls('is-large') : '']}>
            {/* The cross in a line of its own at the very top, as in the contact window (Bernd,
                24.09.2026): beside the name it took the room a long name needs on a phone. */}
            <div class={cls('chat-group-window-top')}>
              {/* The member's own note on this group (Bernd, 27.10.2026), as in the contact
                  window: with the answer to the question for it, at the row's left end. */}
              {noteReady.value ? (
                <button
                  ref={noteToggle}
                  type='button'
                  class={[cls('chat-group-window-note-toggle'), noteOpen.value ? cls('is-on') : '']}
                  aria-label={t('chatNote.title')}
                  title={t('chatNote.title')}
                  aria-pressed={noteOpen.value ? 'true' : 'false'}
                  data-test='chat-group-window-note'
                  onClick={toggleNoteHere}
                >
                  {hasNote.value ? (
                    <IMdiNoteText aria-hidden='true' />
                  ) : (
                    <IMdiNoteTextOutline aria-hidden='true' />
                  )}
                </button>
              ) : null}
              {/* The search in the conversation (Bernd, 30.09.2026, E-057): the magnifier by the
                  cross opens the bar below it and closes it again. */}
              <button
                ref={searchToggle}
                type='button'
                class={[
                  cls('chat-group-window-search-toggle'),
                  searchOpen.value ? cls('is-on') : '',
                ]}
                aria-label={t('chatSearch.open')}
                title={t('chatSearch.open')}
                aria-pressed={searchOpen.value ? 'true' : 'false'}
                data-test='chat-group-window-search'
                onClick={toggleSearchHere}
              >
                <IMdiMagnify aria-hidden='true' />
              </button>
              {/* The window large, for a longer text, and back (Bernd, 12.10.2026, E-077): between
                  the magnifier and the cross, where it stands in the contact window. */}
              <ChatWindowSizeToggle />
              <button
                type='button'
                class={cls('chat-group-window-close')}
                aria-label={t('form.close')}
                title={t('form.close')}
                data-test='chat-group-window-close'
                onClick={() => emit('update:modelValue', false)}
              >
                <IBiX />
              </button>
            </div>
            {searchOpen.value ? (
              <ChatSearchBar
                modelValue={searchTyped.value}
                class={cls('chat-group-window-search')}
                result={searchFound.value}
                onUpdate:modelValue={(typed: string) => {
                  searchTyped.value = typed
                }}
                onOlder={() => thread.value?.searchStep(-1)}
                onNewer={() => thread.value?.searchStep(1)}
                onClose={closeSearch}
              />
            ) : null}

            <div class={cls('chat-group-window-head')}>
              {/* The group's square at the window's size (64, as the contact window's face). */}
              <AppAvatar size={64} color='#fff' {...avatar.value} />
              <div class={cls('chat-group-window-who')}>
                <div class={cls('chat-group-window-name')} data-test='chat-group-window-name'>
                  {props.group.title}
                </div>
                {props.group.communityName ? (
                  <div
                    class={cls('chat-group-window-community')}
                    data-test='chat-group-window-community'
                  >
                    {props.group.communityName}
                  </div>
                ) : null}
                {/* How many, and the member's own part: "5 Mitglieder · Du bist Inhaber". */}
                <div class={cls('chat-group-window-community')} data-test='chat-group-window-count'>
                  {countLine.value}
                </div>
              </div>
            </div>

            {/* Since when, and who opened it -- the contact window's "Kontakt seit …" line. */}
            <div class={cls('chat-group-window-meta')} data-test='chat-group-window-meta'>
              {metaLine.value}
            </div>

            {/* The row under the figures, as the contact window's send row: "Mitglieder" where the
                contact window has "Gradido senden", the marks at its right end. */}
            <div class={cls('chat-group-window-row')}>
              {/* The members (the mockup): up to four small faces and the word -- the faces are
                  the button's picture, not controls of their own, so none of them zooms here. */}
              <button
                type='button'
                class={cls('chat-group-window-members')}
                data-test='chat-group-window-members'
                onClick={() => {
                  membersOpen.value = true
                }}
              >
                <span class={cls('chat-group-window-strip')} aria-hidden='true'>
                  {strip.value.map((face) => (
                    <AppAvatar
                      key={face.id}
                      class={cls('chat-group-window-strip-face')}
                      size={SMALL_FACE_SIZE}
                      color='#fff'
                      {...face.avatar}
                    />
                  ))}
                </span>
                {t('chatGroup.members')}
              </button>
              <div class={cls('chat-group-window-marks')}>
                {/* The camera: a video call in the group (E-053), as with a person (V2) -- a room
                    on a checked Jitsi server whose address goes to everybody in the group as an
                    ordinary message. Anybody in the group may start one; by mail only the owner
                    and the moderators, as the announcement. No word beside it: the question
                    carries the words. */}
                <button
                  type='button'
                  class={[cls('chat-group-window-mark'), cls('chat-group-window-video')]}
                  aria-label={videoCallName.value}
                  title={videoCallName.value}
                  data-test='chat-group-window-video'
                  onClick={() => videoCall.value?.ask()}
                >
                  <IMdiVideoOutline
                    class={cls('chat-group-window-video-icon')}
                    aria-hidden='true'
                  />
                </button>
                {/* The bell: mutes the group for oneself -- no announcement reaches one by mail;
                    the thread shows every message as before (E-024). No question before
                    switching, either way: nothing is lost, and it switches back as easily. */}
                <button
                  type='button'
                  class={[
                    cls('chat-group-window-mark'),
                    cls('chat-group-window-bell'),
                    muted.value ? cls('is-muted') : '',
                  ]}
                  aria-pressed={muted.value ? 'true' : 'false'}
                  aria-label={bellName.value}
                  title={bellName.value}
                  data-test='chat-group-window-bell'
                  onClick={toggleMute}
                >
                  {muted.value ? (
                    <IMdiBellOffOutline
                      class={cls('chat-group-window-bell-icon')}
                      aria-hidden='true'
                    />
                  ) : (
                    <IMdiBellOutline
                      class={cls('chat-group-window-bell-icon')}
                      aria-hidden='true'
                    />
                  )}
                </button>
              </div>
            </div>

            {/* The group's thread and the bar to write in it (ChatThread in a group's kind). ⛔
                Keyed by the group: the thread takes its group once, and another group is another
                thread. */}
            <ChatThread
              key={props.group.groupUuid}
              ref={thread}
              class={[cls('chat-group-window-thread'), noteOpen.value ? cls('is-covered') : '']}
              group={props.group as ThreadProps['group']}
              groupMembers={members.value}
              search={searchOpen.value ? searchTyped.value : ''}
              onOpenMember={openWriter}
              onSearch={takeFound}
              onDuplicateVideo={(invitation: Parameters<ChatVideoCallHandle['duplicate']>[0]) =>
                videoCall.value?.duplicate(invitation)
              }
              onEditVideo={(change: Parameters<ChatVideoCallHandle['edit']>[0]) =>
                videoCall.value?.edit(change)
              }
              onForwardMessage={forwardMessage}
              onThank={toSendMember}
              v-slots={{
                cover: () =>
                  noteOpen.value ? (
                    <ChatNote
                      modelValue={noteText.value}
                      placeholder={t('chatNote.placeholderGroup')}
                      status={noteStatus.value}
                      onUpdate:modelValue={typeNote}
                      onRetry={retryNote}
                      onClose={closeNote}
                    />
                  ) : null,
              }}
            />

            {/* The questions of a video call (ChatVideoCall), as the contact window asks them
                (E-053): the invitation goes through the group's thread; the box, for the owner and
                the moderators, sends it to everybody by mail as an announcement. */}
            <ChatVideoCall
              ref={videoCall}
              name={props.group.title}
              group
              canMail={canAnnounce.value}
              deliver={deliverThroughThread}
              change={editThroughThread}
            />

            {/* The members' dialog, over this window (P5). */}
            <ChatGroupMembers
              modelValue={membersOpen.value}
              group={props.group}
              members={members.value}
              loaded={membersLoaded.value}
              contacts={props.contacts}
              onUpdate:modelValue={(open: boolean) => {
                membersOpen.value = open
              }}
              onChanged={membersChanged}
              onLeft={left}
              onOpenMember={(user: ContactUser) => emit('openMember', user)}
            />

            {/* Forwarding a message of this thread (E-059): the dialog that asks where to, over
                this window -- in the window, as the contact window has it, so that it goes wherever
                a group's window is opened (Bernd, 01.10.2026). */}
            <ChatForwardDialog
              modelValue={forwardOpen.value}
              message={forwarding.value}
              writer={forwardWriter.value}
              onUpdate:modelValue={(open: boolean) => {
                forwardOpen.value = open
              }}
            />
          </div>
        ) : null}
      </BModal>
    )
  },
})
