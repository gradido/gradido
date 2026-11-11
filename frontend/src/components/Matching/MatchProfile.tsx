// AI-GENERATED — not an architecture reference
import { useApolloClient } from '@vue/apollo-composable'
import { BCollapse, BModal } from 'bootstrap-vue-next'
import {
  computed,
  defineComponent,
  nextTick,
  type PropType,
  reactive,
  ref,
  useId,
  watch,
} from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import ChatComposeBar from '@/components/Chat/ChatComposeBar.vue'
import {
  DEFAULTS,
  displayType,
  LABEL_COLORS,
  scoreToStage,
} from '@/components/Matching/displayCore'
import CollapseIcon from '@/components/TransactionRows/CollapseIcon.vue'
import {
  CHAT_HELLO_ASKING,
  CHAT_HELLO_CONTACT,
  CHAT_HELLO_STRANGER,
  useChatHello,
} from '@/composables/useChatHello'
import { useSendReturn } from '@/composables/useSendReturn'
import { useWalletStore } from '@/store/useWalletStore'
import { chatDraftFor } from '@/utils/chatDraft'
import { chatHelloDistance, chatHelloSignature, chatHelloText } from '@/utils/chatHelloText'
import { chatMemberKey } from '@/utils/chatMemberKey'
import MdiChatOutline from '~icons/mdi/chat-outline'
import MdiCheck from '~icons/mdi/check'
import classes from './MatchProfile.module.scss'

type Channel = keyof typeof LABEL_COLORS
type Position = { lat: number; lng: number }

/** One published entry of the person, with the entries of mine it answers. */
export type ProfileEntry = {
  uuid: string
  summary: string
  details?: string | null
  strength: number | null
  remote?: boolean
  matches?: { uuid: string; matchingType: string; summary: string }[]
}
export type ProfileMatch = {
  uuid?: string
  name: string
  aboutMe?: string | null
  community?: { uuid?: string; name: string } | null
  position?: Position | null
  channels?: Partial<Record<Channel, ProfileEntry[]>>
}

type Area = {
  key: Channel
  count: number
  matchedCount: number
  hasMatch: boolean
  sorted: ProfileEntry[]
}

// Heart first, then offer, then need — GMS-82's "Herz zuerst".
const CHANNEL_ORDER: Channel[] = ['interesse', 'angebot', 'gesuch']
// How many entries stand open in an area at the least; every match stands open beyond
// it, and "X more" folds only the rest (openCount).
const SHOWN = 2
// The dot of a matched entry grows with its step, like the glow on the map, brought
// down to the size of a line of text. Drawn hollow (GMS-229).
const DOT_SIZE = [8, 9, 10, 12]
// An honest ceiling, not pagination: thirty entries are ~3 KB, so blattering is
// a tool without an opponent — but a runaway list still gets cut, plainly.
const MAX_ENTRIES = 100

/**
 * A state class in both spellings: the plain name, which the specs read, and the module's,
 * which carries the rule.
 */
const stateClass = (name: string) => [name, classes[name]]

/** Matches first, strongest on top; then the rest in the order they were kept. */
const sortEntries = (entries: ProfileEntry[]) => {
  const matched = entries
    .filter((e) => e.strength != null)
    .sort((a, b) => (b.strength as number) - (a.strength as number))
  const rest = entries.filter((e) => e.strength == null)
  return [...matched, ...rest]
}

/** The step of a matched entry as the map glows it; 0 for anything the map would not draw. */
const stageOf = (entry: ProfileEntry) => scoreToStage(entry.strength)

/**
 * A thread hangs from the dot where something stands under the sentence: its details, or the
 * lines "passt zu". An entry without a dot has nothing to hang it from; its room sets it apart.
 */
const hasThread = (entry: ProfileEntry) =>
  stageOf(entry) > 0 && Boolean(entry.details || entry.matches?.length)

/**
 * What the stylesheet needs to draw the dot of a match and its thread; nothing for an entry
 * without one. Set on the entry, so both its sentence and the entry itself read it. The dot
 * wears the colour the member typed the entry in, not the glow's additive primary — so it stays
 * legible for red-green colour vision.
 */
const dotStyle = (key: Channel, entry: ProfileEntry) => {
  const stage = stageOf(entry)
  if (!stage) {
    return null
  }
  return {
    '--dot-size': `${DOT_SIZE[stage - 1]}px`,
    '--dot-color': LABEL_COLORS[key],
    '--dot-opacity': DEFAULTS.stageBright[stage - 1],
  }
}

// Everything that matches stands open, and never fewer than SHOWN: a single match stands
// beside the newest of the rest (Bernd, 10.09.2026). Before, the first two stood open
// even when three matched, and the third lay behind "X more".
const openCount = (area: Area) => Math.max(SHOWN, area.matchedCount)

const moreCount = (area: Area) => Math.min(area.count, MAX_ENTRIES) - openCount(area)

/**
 * The window is the person's profile: what they published, and nothing else of theirs. The
 * match decides what stands open and says why - a dot before each entry that matches, and
 * under it the entry of mine it answers (Bernd, 10.09.2026; GMS-111 had left that out). One
 * window, not two: a grey ring is the same window with no open areas. See GMS-111.
 * An entry is a sub-point of its area (Bernd, 14.10.2026, GMS-229): its dot is hollow, a
 * thread hangs from it down along what belongs to the entry, and more room stands between two
 * entries than between the parts of one.
 */
export const MatchProfile = defineComponent({
  name: 'MatchProfile',
  props: {
    modelValue: { type: Boolean, default: false },
    match: { type: Object as PropType<ProfileMatch | null>, default: null },
    /**
     * The member's own home as the map holds it (`{ lat, lng }`), and how far their standing
     * reach goes, in km: what the hello says about how far apart the two live is measured from
     * the one and kept within the other (utils/chatHelloText). Without them it says nothing
     * about it.
     */
    ownPosition: { type: Object as PropType<Position | null>, default: null },
    ownReachKm: { type: Number, default: 0 },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const router = useRouter()
    const store = useWalletStore()
    const { t, locale } = useI18n()
    const { client: apolloClient } = useApolloClient()

    const hasAbout = computed(() => Boolean(props.match?.aboutMe && props.match.aboutMe.trim()))

    const areas = computed<Area[]>(() => {
      if (!props.match) {
        return []
      }
      const out: Area[] = []
      for (const key of CHANNEL_ORDER) {
        const entries = props.match.channels?.[key]
        if (!entries || !entries.length) {
          continue
        }
        const matchedCount = entries.filter((e) => e.strength != null).length
        out.push({
          key,
          count: entries.length,
          matchedCount,
          hasMatch: matchedCount > 0,
          sorted: sortEntries(entries),
        })
      }
      return out
    })

    // An area with a match opens itself; the rest are drawers, shut, their heading
    // and count the label. Reset whenever the window changes person.
    const areaOpen = reactive<Record<string, boolean>>({})
    const areaExpanded = reactive<Record<string, boolean>>({})
    watch(
      () => props.match,
      () => {
        for (const key of CHANNEL_ORDER) {
          areaOpen[key] = false
          areaExpanded[key] = false
        }
        for (const area of areas.value) {
          areaOpen[area.key] = area.hasMatch
        }
      },
      { immediate: true },
    )

    const shownEntries = (area: Area) => {
      const capped = area.sorted.slice(0, MAX_ENTRIES)
      return areaExpanded[area.key] ? capped : capped.slice(0, openCount(area))
    }

    /**
     * "Gradido senden": the send form with this person named. Its "Zurück" leads back to the map
     * as the member left it (E-043): the window hands that place over (useSendReturn) -- the
     * map's own address, which opens this window again by itself (`pref.gms.map.profile`), the
     * member's search around it. ⛔ Not the address of the contact window's pin
     * (`?with=…&community=…`): that one moves the search onto the person and heads the list
     * "Dein Kontakt", for somebody who is none as well. Where the form is not reached, it is
     * taken back.
     */
    const sendReturn = useSendReturn()
    const toSend = async () => {
      const community = props.match?.community?.uuid
      const user = props.match?.uuid
      if (!community || !user) {
        return
      }
      const to = `/send/${community}/${user}`
      const handed = sendReturn.put({ to, back: { path: '/matching/karte' } })
      let reached = false
      try {
        const failure = await router.push({ path: to })
        reached = !failure
      } finally {
        if (!reached) {
          sendReturn.drop(handed)
        }
      }
    }

    /**
     * Whom a first word from here would go to: the person the open window shows, by the pair a
     * chat message is addressed with -- the GMS holds a member under their Gradido ID. Nobody
     * while the window is shut, for a ring without a pair, and for the member's own ring: the
     * map draws the seeker too, and nobody says hello to themselves.
     */
    const helloPerson = computed(() => {
      const gradidoID = props.match?.uuid
      const communityUuid = props.match?.community?.uuid
      if (!props.modelValue || !gradidoID || !communityUuid) {
        return null
      }
      const own = String(store.gradidoID ?? '').toLowerCase()
      if (own && String(gradidoID).toLowerCase() === own) {
        return null
      }
      return { gradidoID, communityUuid }
    })

    /**
     * The person as one string. ⛔ The window is handed a new `match` object whenever more of
     * the same person arrives (their entries, the sentences of mine they answer): what is asked
     * and shown here goes by the person, or every such arrival would ask the server again and
     * put the words back over what the member has typed. In lower case: what arrives later
     * comes from another route of the GMS (the profile), and an id spelled otherwise there is
     * the same person.
     */
    const helloKey = computed(() =>
      helloPerson.value
        ? `${helloPerson.value.communityUuid}/${helloPerson.value.gradidoID}`.toLowerCase()
        : '',
    )

    /**
     * What the member wrote to this person and did not send (utils/chatDraft): the bar begins
     * with it the next time, in place of the sentence the window hands in -- here, and in the
     * contact window, which names the person the same way (`chatMemberKey`). Made anew with the
     * bar, for the person the bar is for.
     */
    const helloDraft = computed(() =>
      helloPerson.value
        ? chatDraftFor(
            () => store.gradidoID,
            chatMemberKey(helloPerson.value, store.communityUuid as string | null),
          )
        : null,
    )

    const {
      standing: helloStanding,
      sending: helloSending,
      failed: helloFailed,
      sent: helloSent,
      ask: askHello,
      send: sendHelloWords,
    } = useChatHello(apolloClient)

    watch(helloKey, () => askHello(helloPerson.value), { immediate: true })

    /**
     * The bar stands while a first word can still be written: from the moment the window opens
     * -- the server's answer mostly lands while the window is still fading in -- until the hello
     * has gone out, or the server says the two are contacts already. Not where the question did
     * not get through: no first word is offered on a guess.
     */
    const helloOffered = computed(
      () =>
        helloPerson.value !== null &&
        helloSent.value === null &&
        (helloStanding.value === CHAT_HELLO_ASKING || helloStanding.value === CHAT_HELLO_STRANGER),
    )

    /**
     * While the server is asked, the bar keeps its place and shows nothing. The window stands in
     * the middle of the screen: a foot that came with the answer would move the whole window
     * under the finger. But the words are not shown on a guess either -- to somebody who turns
     * out to be a contact they would be wrong, and what was typed into them meanwhile would go
     * with the bar.
     */
    const helloAsking = computed(() => helloStanding.value === CHAT_HELLO_ASKING)

    /** The arrow waits: for the server's answer about who this is, and while the hello is on its way. */
    const helloWaits = computed(
      () => helloSending.value || helloStanding.value !== CHAT_HELLO_STRANGER,
    )

    /**
     * The words in the field. Read by the bar once, when it is made: with the window, each time
     * it opens, and anew for another person (`helloKey`) -- not while the window stays on one
     * person, whatever more of them arrives.
     */
    const helloWords = computed(() =>
      chatHelloText(t, {
        name: props.match?.name ?? '',
        signature: chatHelloSignature(store.username),
        distance: chatHelloDistance({
          home: props.ownPosition,
          theirs: props.match?.position ?? null,
          reachKm: props.ownReachKm,
        }),
        locale: locale.value,
      }),
    )

    /**
     * What became of the hello, as the server says it of its copy -- the words the thread uses
     * for the same states, and "gets an e-mail" only where a mail went out (E-034).
     */
    const helloSentWords = computed(() => {
      const outcome = helloSent.value
      if (!outcome) {
        return ''
      }
      if (outcome.delivery === 'FAILED') {
        return t('chatThread.failed')
      }
      if (outcome.delivery === 'PENDING') {
        return t('chatThread.pending')
      }
      return outcome.mailed
        ? t('chatHello.sentMailed', { name: props.match?.name ?? '' })
        : t('chatHello.sent')
    })

    /**
     * The tick before those words: only where the hello went out. "Not delivered" and "not
     * delivered yet" are the server's words for a copy that is stored and did not arrive (E-019)
     * -- a green tick before them would say the opposite.
     */
    const helloArrived = computed(
      () =>
        helloSent.value !== null &&
        helloSent.value.delivery !== 'FAILED' &&
        helloSent.value.delivery !== 'PENDING',
    )

    /** The way into the conversation: once the hello has gone out, and for a contact. */
    const conversationOffered = computed(
      () =>
        helloPerson.value !== null &&
        (helloSent.value !== null || helloStanding.value === CHAT_HELLO_CONTACT),
    )

    const conversationButton = ref<HTMLButtonElement | null>(null)

    /** What "Hallo sagen:" is found by: it names the group of the words and their arrow. */
    const helloLabelId = `${useId()}-hello`

    /**
     * The bar asks; the composable sends. Where the bar then gives way to the way into the
     * conversation -- the hello is out, or the server says the two are contacts by now --,
     * whatever held the focus is gone with it: the focus goes to that button, so a keyboard is
     * not left nowhere.
     */
    const sendHello = async ({ body }: { body: string }) => {
      const person = helloKey.value
      const draft = helloDraft.value
      await sendHelloWords(body)
      // The first word is said, and the bar is gone with whatever stood in it -- also what was
      // typed while the hello was on its way, which the bar had kept as a draft. It goes with the
      // bar: the next bar for this person is the one of their conversation, which holds the hello
      // as a message and must not begin with its words. Only where the window still shows that
      // person.
      if (!helloOffered.value && helloKey.value === person) {
        draft?.keep()
      }
      if (helloOffered.value || !conversationOffered.value) {
        return
      }
      await nextTick()
      conversationButton.value?.focus({ preventScroll: true })
    }

    /**
     * Into the conversation with this person: the address the reply button of a chat mail has
     * (P4c), which the contacts page opens the window for and takes out of the address at once.
     */
    const toConversation = () => {
      const person = helloPerson.value
      if (!person) {
        return
      }
      router.push({
        path: '/contacts',
        query: { with: person.gradidoID, community: person.communityUuid },
      })
    }

    const entryItem = (area: Area, entry: ProfileEntry) => (
      <li
        key={entry.uuid}
        class={['entry', classes.entry, hasThread(entry) ? stateClass('has-thread') : '']}
        style={dotStyle(area.key, entry)}
      >
        <div class={['entry-line', classes['entry-line']]}>
          <span
            class={[
              'entry-summary',
              classes['entry-summary'],
              entry.strength != null ? stateClass('is-match') : '',
              stageOf(entry) > 0 ? stateClass('has-dot') : '',
            ]}
          >
            {entry.summary}
          </span>
          {entry.remote ? (
            <span class={['remote-badge', classes['remote-badge']]}>
              {t('matching.entries.remote')}
            </span>
          ) : null}
        </div>
        {entry.details ? (
          <div class={['entry-details', classes['entry-details']]}>{entry.details}</div>
        ) : null}
        {/* Why it matches: each entry of mine it answers, stem and sentence. */}
        {entry.matches?.map((mine) => (
          <div key={mine.uuid} class={['entry-mine', classes['entry-mine']]}>
            {`${t('matching.profile.matchesMine')} `}
            <em class={['mine-sentence', classes['mine-sentence']]}>
              {`${t(`matching.type.${displayType(mine.matchingType)}.prefix`)} ${mine.summary}`}
            </em>
          </div>
        ))}
      </li>
    )

    const profileArea = (area: Area) => (
      <div key={area.key} class={['profile-area', classes['profile-area']]}>
        <button
          type='button'
          class={['area-head', classes['area-head']]}
          aria-expanded={areaOpen[area.key]}
          onClick={() => {
            areaOpen[area.key] = !areaOpen[area.key]
          }}
        >
          <span
            class={['area-dot', classes['area-dot']]}
            style={{ background: LABEL_COLORS[area.key] }}
            aria-hidden='true'
          />
          <span class={['area-stem', classes['area-stem']]}>
            {t(`matching.type.${area.key}.prefix`)}
          </span>
          {/* A count, right at the edge (variant B): a rubric tally, never a
              verdict — no percentage, no score is ever shown. */}
          <span class={['area-count', classes['area-count']]}>{area.count}</span>
          <CollapseIcon visible={areaOpen[area.key]} />
        </button>

        <BCollapse modelValue={areaOpen[area.key]}>
          {/* A match wears a dot, drawn by the stylesheet before the sentence (.has-dot), and a
              thread hangs from it where something stands under the sentence (.has-thread). Both
              take size, colour and brightness from the variables set on the entry. */}
          <ul class={['entry-list', classes['entry-list']]}>
            {shownEntries(area).map((entry) => entryItem(area, entry))}
          </ul>

          {/* "X more" presupposes a before, so it only appears where something
              already stands open. Over an empty area it would be wrong. */}
          {!areaExpanded[area.key] && moreCount(area) > 0 ? (
            <button
              type='button'
              class={['more-btn', classes['more-btn']]}
              onClick={() => {
                areaExpanded[area.key] = true
              }}
            >
              {t('matching.profile.more', { n: moreCount(area) })}
            </button>
          ) : null}
        </BCollapse>
      </div>
    )

    /* The foot stays put while the profile scrolls. No OK/Cancel: those only closed the
       window, and the × up top already does that.

       A first word, right here (Bernd, 09.10.2026, E-065): for somebody who is no contact yet
       the chat's own compose bar stands in the foot, the words already in its field
       (utils/chatHelloText), and the arrow sends them -- the first chat message of the two,
       which goes by mail and makes them contacts (E-024, KF-012). "Hallo sagen:" stands over
       the words, and the field is drawn as the member's own message is in a conversation --
       gold rim, light gold ground (Bernd after trying it, E-070). The bar's own sentence about
       the first mail is left out here: the line below says afterwards that one went out. It
       took the place of "send an e-mail", which led to the send form's letter: the bar is the
       same thing, and the answer to it arrives in a conversation. The bar has its place from
       the first moment, so the window does not grow under a finger once the server has said who
       this is -- and until then it shows nothing (`helloAsking`): no first word for somebody who
       may turn out to be a contact, and nothing typed that the answer would take away.

       Afterwards the same place says what became of it, in the server's own words (E-034).
       Somebody who is a contact already gets the way into their conversation instead: writing
       into it from here, without seeing it, is not offered.

       "Send Gradido" stays what it was (E-067) -- the window is a go-between, not a till: the
       button points at the send form. Its glyph is the send form's coin. */
    const foot = (match: ProfileMatch) => (
      <div class={['profile-foot', classes['profile-foot']]}>
        {helloOffered.value ? (
          <div
            class={[
              'profile-hello-box',
              classes['profile-hello-box'],
              helloAsking.value ? stateClass('is-asking') : '',
            ]}
            role='group'
            aria-labelledby={helloLabelId}
            data-test='profile-hello-box'
          >
            <p
              id={helloLabelId}
              class={['profile-hello-label', classes['profile-hello-label']]}
              data-test='profile-hello-label'
            >
              {t('chatHello.say')}
            </p>
            <ChatComposeBar
              key={helloKey.value}
              class={['profile-hello', classes['profile-hello']]}
              name={match.name}
              first
              firstNote={false}
              textOnly
              sending={helloWaits.value}
              failed={helloFailed.value}
              initialText={helloWords.value}
              draft={helloDraft.value}
              data-test='profile-hello'
              onSend={sendHello}
            />
          </div>
        ) : helloSent.value ? (
          <p
            class={['profile-hello-sent', classes['profile-hello-sent']]}
            data-test='profile-hello-sent'
          >
            {helloArrived.value ? (
              <MdiCheck
                class={['profile-hello-sent-icon', classes['profile-hello-sent-icon']]}
                aria-hidden='true'
              />
            ) : null}
            <span>{helloSentWords.value}</span>
          </p>
        ) : null}

        <div
          class={[
            'profile-actions',
            classes['profile-actions'],
            !conversationOffered.value ? stateClass('is-single') : '',
          ]}
        >
          {conversationOffered.value ? (
            <button
              ref={conversationButton}
              type='button'
              class={[
                'send-btn',
                classes['send-btn'],
                'to-conversation',
                classes['to-conversation'],
              ]}
              data-test='profile-conversation'
              onClick={toConversation}
            >
              <MdiChatOutline
                class={['to-conversation-icon', classes['to-conversation-icon']]}
                aria-hidden='true'
              />{' '}
              {t('chatHello.toConversation')}
            </button>
          ) : null}
          <button
            type='button'
            class={['send-btn', classes['send-btn'], 'send-gradido', classes['send-gradido']]}
            data-test='profile-send-gradido'
            onClick={toSend}
          >
            <img
              src='/img/svg/gdd_coin_sw.svg'
              class={['send-coin', classes['send-coin']]}
              alt=''
              aria-hidden='true'
            />{' '}
            {t('matching.profile.sendGradido')}
          </button>
        </div>

        {/* For the ear: what became of the hello. Always in the page, so the words are
            announced when they are put in -- a live region that appears together with its text
            is not. */}
        <p class='visually-hidden' role='status' data-test='profile-hello-status'>
          {helloSentWords.value}
        </p>
      </div>
    )

    return () => {
      const { match } = props
      return (
        <BModal
          modelValue={props.modelValue}
          aria-label={match ? t('matching.profile.aria', { name: match.name }) : ''}
          scrollable
          centered
          body-class='profile-body'
          onUpdate:modelValue={(open: boolean) => emit('update:modelValue', open)}
          v-slots={{
            title: () =>
              match ? (
                <div class={['profile-head', classes['profile-head']]}>
                  <div class={['profile-name', classes['profile-name']]}>{match.name}</div>
                  {match.community ? (
                    <div class={['profile-community', classes['profile-community']]}>
                      {match.community.name}
                    </div>
                  ) : null}
                </div>
              ) : null,
            footer: () => (match ? foot(match) : null),
          }}
        >
          {match ? (
            <div>
              {/* Their own words, first. Not matched, just a text — the most important
                  thing about a person is exactly what the machine ignores. Empty means
                  empty: the heading falls away rather than accuse them of a gap. */}
              {hasAbout.value ? (
                <div class={['profile-about', classes['profile-about']]}>
                  <div class={['about-label', classes['about-label']]}>
                    {t('matching.tabs.about')}
                  </div>
                  <div class={['about-text', classes['about-text']]}>{match.aboutMe}</div>
                </div>
              ) : null}

              {/* Heart first: I love · I offer · I look for. The stem is the heading;
                  the entries below are only the completions. An empty area is gone. */}
              {areas.value.map(profileArea)}
            </div>
          ) : null}
        </BModal>
      )
    }
  },
})
