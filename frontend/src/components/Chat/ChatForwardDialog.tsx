// AI-GENERATED — not an architecture reference
import { useApolloClient, useMutation } from '@vue/apollo-composable'
import { BButton, BModal, BSpinner, type ButtonVariant } from 'bootstrap-vue-next'
import { computed, defineComponent, type PropType, ref, useId, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChatCheck } from '@/components/Chat/ChatCheck'
import { ChatGroupPicker } from '@/components/ChatGroups/ChatGroupPicker'
import type { ContactUser } from '@/components/Contacts/contactDisplay'
import { useChatForwardTargets } from '@/composables/useChatForwardTargets'
import { pollChatNow } from '@/composables/useChatUpdates'
import { useAppToast } from '@/composables/useToast'
import { forwardChatMessage } from '@/graphql/chat.graphql'
import { memberAlias } from '@/utils/gradidoAddress'
// The words' length is any message's, the compose bar's.
import { MESSAGE_MAX_CHARS } from '@/validationSchemas'
import IMdiShare from '~icons/mdi/share'
import classes from './ChatForwardDialog.module.scss'

/** How many conversations at once, groups and contacts together (E-059 F3; the backend's limit). */
const CHAT_FORWARD_MAX_TARGETS = 5

/** The message of the thread, as far as the dialog reads it. */
export type ForwardedMessage = {
  messageUuid: string
  mine?: boolean
  subject?: string | null
  body?: string | null
  createdAt: string
}

/** A group to choose from. */
type ForwardGroup = { groupUuid: string; title: string }

/**
 * Forwards a message (E-059): the member chooses where to, writes words to go with it where they
 * want to, and the server files a copy in every conversation chosen. Once it went, the chat's
 * beat asks at once (`pollChatNow`): the copies show in a thread that is open, and every list of
 * contacts and groups asks again -- the conversations it went into moved up.
 *
 * `message` is the message of the thread; `writer` the name its writer goes by in the window it
 * came from -- one's own is "Du" here.
 */
export const ChatForwardDialog = defineComponent({
  name: 'ChatForwardDialog',
  props: {
    modelValue: { type: Boolean, default: false },
    message: { type: Object as PropType<ForwardedMessage | null>, default: null },
    writer: { type: String, default: '' },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const { t, d, locale } = useI18n()
    const { toastSuccess, toastError } = useAppToast()
    const { client: apolloClient } = useApolloClient()
    const { mutate: forward } = useMutation(forwardChatMessage)
    const wordsId = `${useId()}-words`

    /** The contacts and groups to choose from: the page's where it holds them, else asked for here. */
    const {
      contacts,
      groups,
      loading,
      contactsFailed,
      groupsFailed,
      load: loadTargets,
    } = useChatForwardTargets(apolloClient)
    /** Nothing to choose from yet, and the lists on their way. */
    const waiting = computed(
      () => loading.value && contacts.value.length === 0 && groups.value.length === 0,
    )

    /** The contacts chosen (their `user`s) and the groups chosen (their uuids), as the picker has them. */
    const members = ref<ContactUser[]>([])
    const groupUuids = ref<string[]>([])
    const words = ref('')
    const alsoByEmail = ref(false)
    const sending = ref(false)
    /** Why the last try did not go out, in the member's words; '' while nothing went wrong. */
    const problem = ref('')

    const ready = computed(() => members.value.length + groupUuids.value.length > 0)

    /** Who wrote the message and when it arrived: "Anna-Sonne, 16:28". */
    const previewWho = computed(() => {
      if (!props.message) {
        return ''
      }
      const time = d(new Date(props.message.createdAt), 'time')
      const who = props.message.mine ? t('chatThread.you') : props.writer
      return who ? `${who}, ${time}` : time
    })

    /** The message's words -- a picture without words says it is one. */
    const previewText = computed(() => {
      const message = props.message
      if (!message) {
        return ''
      }
      const text = [message.subject, message.body].filter((part) => part?.trim()).join(' – ')
      return text || t('chatForward.picture')
    })

    const mailWords = computed(() =>
      members.value.length === 1
        ? t('chatForward.byEmailOne', {
            name: memberAlias(members.value[0].alias, members.value[0].gradidoID),
          })
        : t('chatForward.byEmailMany', { count: members.value.length }),
    )

    const goWords = computed(() => {
      const count = members.value.length + groupUuids.value.length
      return count ? t('chatForward.goTo', { count }) : t('chatForward.go')
    })

    /** Every opening starts empty: nothing chosen, no words, the box empty (E-024). */
    watch(
      () => props.modelValue,
      (open) => {
        if (!open) {
          return
        }
        loadTargets()
        members.value = []
        groupUuids.value = []
        words.value = ''
        alsoByEmail.value = false
        problem.value = ''
      },
    )

    /** What went wrong is said until the member changes what they chose. */
    watch([members, groupUuids], () => {
      problem.value = ''
    })

    const close = () => emit('update:modelValue', false)

    /** "Gradido-Café Berlin und Carla-Sonne": the conversations chosen, as the member's language lists. */
    const namesOf = (names: string[]) => {
      try {
        return new Intl.ListFormat(locale.value, { style: 'long', type: 'conjunction' }).format(
          names,
        )
      } catch {
        return names.join(', ')
      }
    }

    const go = async () => {
      if (!ready.value || sending.value || !props.message) {
        return
      }
      sending.value = true
      problem.value = ''
      const chosenGroups = groupUuids.value
        .map((uuid) => (groups.value as ForwardGroup[]).find((group) => group.groupUuid === uuid))
        .filter((group): group is ForwardGroup => Boolean(group))
      const names: string[] = [
        ...chosenGroups.map((group) => group.title),
        ...members.value.map((user) => memberAlias(user.alias, user.gradidoID)),
      ]
      const count = members.value.length + groupUuids.value.length
      try {
        const answer = await forward({
          messageUuid: props.message.messageUuid,
          groupUuids: groupUuids.value,
          members: members.value.map((user) => ({
            gradidoID: user.gradidoID,
            communityUuid: user.communityUuid ?? null,
          })),
          words: words.value.trim() ? words.value : null,
          alsoByEmail: members.value.length > 0 && alsoByEmail.value,
        })
        const copies = answer?.data?.forwardChatMessage ?? []
        if (copies.length === 0) {
          problem.value = t('chatForward.failed')
          return
        }
        if (copies.length === count) {
          toastSuccess(t('chatForward.done', { names: namesOf(names) }))
        } else {
          // Filed in some conversations and not in others: said, and not asked again -- a second
          // press would forward it twice where it went.
          toastError(t('chatForward.partly', { done: copies.length, count }))
        }
        pollChatNow()
        close()
      } catch {
        problem.value = t('chatForward.failed')
      } finally {
        sending.value = false
      }
    }

    return () => (
      // "Weiterleiten" (Bernd, 30.09.2026, E-059, the mockup): the message it is about, the member's
      // groups and contacts to choose from -- five at most together (F3), another community's
      // greyed (F5) --, the words to go with it (F4) and the box. A sheet on a phone, a dialog on a
      // desk whose list scrolls between the title and the buttons, as "Neue Gruppe"; over the window
      // it was opened from. No header, so the dialog is named by `aria-label`; its own footer, so
      // the button can wait while the copies are on their way.
      //
      // It stands in the conversation's window, not on a page (Bernd, 01.10.2026): the window is
      // opened from many places -- the contacts page, the column and the strip beside every page,
      // the booking lists, the tile on the overview --, and forwarding goes from each of them. The
      // contacts and groups to choose from it finds by itself (useChatForwardTargets).
      <BModal
        modelValue={props.modelValue}
        fullscreen='sm'
        scrollable
        lazy
        no-header
        aria-label={t('chatForward.title')}
        data-test='chat-forward'
        onUpdate:modelValue={(value: boolean) => emit('update:modelValue', value)}
        v-slots={{
          footer: () => (
            <>
              <BButton variant='secondary' data-test='chat-forward-cancel' onClick={close}>
                {t('form.cancel')}
              </BButton>
              {/* `aria-disabled`, not `disabled`: a focused button that is disabled loses its focus, and
                  the press is turned away in the handler instead (ChatGroupCreate). */}
              <BButton
                variant={'gradido' as ButtonVariant}
                class={['chat-forward-go', classes['chat-forward-go']]}
                aria-disabled={ready.value && !sending.value ? 'false' : 'true'}
                data-test='chat-forward-go'
                onClick={go}
              >
                {goWords.value}
              </BButton>
            </>
          ),
        }}
      >
        <p class='h5 mb-3' data-test='chat-forward-title'>
          {t('chatForward.title')}
        </p>
        {/* The message, two lines of it at most, with who wrote it and when. */}
        {props.message ? (
          <div
            class={['chat-forward-preview', classes['chat-forward-preview']]}
            data-test='chat-forward-preview'
          >
            <IMdiShare
              class={['chat-forward-preview-icon', classes['chat-forward-preview-icon']]}
              aria-hidden='true'
            />
            <span class={['chat-forward-preview-words', classes['chat-forward-preview-words']]}>
              <span
                class={['chat-forward-preview-who', classes['chat-forward-preview-who']]}
                data-test='chat-forward-preview-who'
              >
                {previewWho.value}
              </span>
              <span
                class={['chat-forward-preview-text', classes['chat-forward-preview-text']]}
                data-test='chat-forward-preview-text'
              >
                {previewText.value}
              </span>
            </span>
          </div>
        ) : null}
        {/* Asked for where no page handed the lists down: the wheel until they are here, as the
            contacts page shows it. The words' field comes with the lists, not before them: a field
            somebody is already typing in must not be pushed down the dialog when the lists land. */}
        {waiting.value ? (
          <div class='text-center py-3' data-test='chat-forward-loading'>
            <BSpinner small />
          </div>
        ) : (
          <>
            {/* A failed request is not an empty list, here as on the contacts page: "no contacts yet"
                would tell a member with a hundred of them that they have none. */}
            <ChatGroupPicker
              modelValue={members.value}
              onUpdate:modelValue={(value: ContactUser[]) => {
                members.value = value
              }}
              chosenGroups={groupUuids.value}
              onUpdate:chosenGroups={(value: string[]) => {
                groupUuids.value = value
              }}
              contacts={contacts.value}
              groups={groups.value}
              max={CHAT_FORWARD_MAX_TARGETS}
              label={t('chatForward.to')}
              placeholder={t('chatForward.search')}
              noContactsText={
                contactsFailed.value ? t('contacts.notReachable') : t('chatForward.noContacts')
              }
            />
            {groupsFailed.value ? (
              <p class='text-muted small mt-2 mb-0' data-test='chat-forward-groups-error'>
                {t('chatGroup.notReachable')}
              </p>
            ) : null}
            <div class='mt-3'>
              <label class='form-label' for={wordsId}>
                {t('chatForward.words')}
              </label>
              <textarea
                id={wordsId}
                v-model={words.value}
                class={['form-control chat-forward-words', classes['chat-forward-words']]}
                rows='2'
                maxlength={MESSAGE_MAX_CHARS}
                data-test='chat-forward-words'
              />
            </div>
          </>
        )}
        {/* The box, for the contacts chosen (E-024): the first message of a pair goes by mail in any
            case, the server sees to that. Into a group a copy goes without an announcement. */}
        {members.value.length ? (
          <ChatCheck v-model={alsoByEmail.value} class='mt-3' boxTest='chat-forward-email'>
            {mailWords.value}
          </ChatCheck>
        ) : null}
        {problem.value ? (
          <p class='mt-3 mb-0' role='alert' data-test='chat-forward-problem'>
            {problem.value}
          </p>
        ) : null}
      </BModal>
    )
  },
})
