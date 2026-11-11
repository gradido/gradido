// AI-GENERATED — not an architecture reference
import {
  BBadge,
  BButton,
  BContainer,
  type ButtonVariant,
  type ColorVariant,
} from 'bootstrap-vue-next'
import { computed, defineComponent, type PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import { useWalletStore } from '@/store/useWalletStore'
import { ENTRIES_TO_ARRIVE, NEW_MATCHING_ENTRY } from '@/utils/newMatchingEntry'
import { invitedOntoTheMap, SHOW_ME_ON_THE_MAP, standsOnTheMap } from '@/utils/showMeOnTheMap'
import IMdiChevronRight from '~icons/mdi/chevron-right'
import ITablerHeartHandshake from '~icons/tabler/heart-handshake'
import classes from './MatchingTile.module.scss'

/**
 * From how many people on the heading counts them. Below two there is nobody to ask "who of
 * them" about, and the question stands alone as before.
 *
 * Deliberately not a bigger threshold: the number is the whole network's, over 770 where it
 * is read today, and a test network with a few dozen should show what it has. One line to
 * turn, should a small number ever read as a reason to stay away.
 */
const FEWEST_TO_COUNT = 2

const MAP = 'map'
const FIRST = 'first'
const MORE = 'more'
// The first step keeps the mark it has had since it was the whole tile.
const TESTS: Record<string, string> = {
  [MAP]: 'map-invitation-tile',
  [FIRST]: 'matching-entries-tile',
  [MORE]: 'matching-more-tile',
}

/**
 * Matching on the overview: one tile that walks a newcomer in, a step at a time.
 *
 * The overview is where a member lands after the first creation, and nothing there led to
 * matching: its only sign was the window behind "find on the map", for somebody who had
 * already gone looking. So the invitation stands where a newcomer stands -- a tile that
 * waits, not a fourth window on the first login (Bernd, 11.10.2026).
 *
 * ## The steps (Bernd, 11.10.2026)
 *
 * 1. **Not on the map** -- the invitation onto it, opening with how many people are there.
 * 2. **On the map, no entry yet** -- "who suits you?": what they look for, what they give,
 *    what they love. The map alone knows where somebody lives, not who suits them.
 * 3. **One or two entries** -- a quiet line offering one more.
 * 4. **Three entries** -- nothing. The invitation names three things, and whoever has three
 *    entries has arrived (`ENTRIES_TO_ARRIVE`); matching stays in the menu.
 *
 * ⛔ Which step it is, is settled BEFORE the tile is painted and does not change while the
 * overview stands. The steps differ in height, and a tile that changed under a finger would
 * move its own button and every tile below it. So what the store knows -- who is signed in,
 * and whether they are on the map -- is read once, when the tile is set up; and what only
 * the server knows -- the number on the map, the member's entries -- the overview hands in
 * as props it decided once (useMapMemberCount, useOwnMatchingEntries). The one thing that
 * is followed is the member leaving: signed out, the tile goes.
 */
export const MatchingTile = defineComponent({
  name: 'MatchingTile',
  props: {
    /**
     * How many people stand on the map across every community, or null where nobody could
     * say -- a server without a number, or no answer in time.
     *
     * ⛔ Handed in by the overview, which decides it once, before this tile is painted, and
     * never changes it afterwards (composables/useMapMemberCount). The heading with the number
     * is a line taller than the one without; a number arriving later would push the button
     * below it down under a finger.
     */
    count: { type: Number as PropType<number | null>, default: null },
    /**
     * How many matching entries the member has, or null where nobody could say. Decided once
     * by the overview as well (composables/useOwnMatchingEntries).
     */
    entries: { type: Number as PropType<number | null>, default: null },
  },
  setup(props) {
    const { t, n } = useI18n()
    const store = useWalletStore()

    /**
     * Whom the tile is for, read ONCE.
     *
     * ⛔ Not followed afterwards, although the store can change while the overview stands: the
     * home tab commits what it saved when the server's answer is in (pages/Matching.vue), and a
     * member who has gone on to the overview by then would see "who suits you?" turn into the
     * invitation onto the map under their finger -- or the invitation vanish, and the tiles
     * below jump up. What was painted stays for this visit; the next one decides anew.
     */
    const member = store.gradidoID
    const invited = invitedOntoTheMap(store)
    const onTheMap = standsOnTheMap(store)

    const stage = computed(() => {
      // The one thing followed live. Signing out empties the store while the overview still
      // stands, and whoever was painted a tile is no longer there to read it.
      if (store.gradidoID !== member) {
        return null
      }
      if (invited) {
        return MAP
      }
      // A wallet without matching.
      if (!onTheMap) {
        return null
      }
      // ⛔ Not known is not "none": the tile that says "your first entry" must not meet a member
      // who has made five, on the one visit their list did not answer in time. And only a number
      // of entries is one -- whole, and not below none.
      if (!Number.isSafeInteger(props.entries) || (props.entries as number) < 0) {
        return null
      }
      if (props.entries === 0) {
        return FIRST
      }
      // With three the member has arrived (utils/newMatchingEntry).
      return (props.entries as number) < ENTRIES_TO_ARRIVE ? MORE : null
    })
    const saysCount = computed(
      () => Number.isSafeInteger(props.count) && (props.count as number) >= FEWEST_TO_COUNT,
    )

    return () =>
      stage.value ? (
        // The frame of the tile below it (ShowFriendsTile), so the two read as one family --
        // py-3 and not p-3 for the reason given there.
        <div
          class={['mb-3 py-3 matching-tile', classes['matching-tile']]}
          data-test={TESTS[stage.value]}
        >
          {/* The tile's name, with the icon and the word of the menu entry: "the map" alone can be
              a postcard or a playing card in German, and a newcomer could not tell that the map on
              the overview and "Matching" in the menu are one thing (Bernd, 11.10.2026). Built like
              the label of the community's card in the page head (CommunityMember.vue): no
              variant, or the badge's own text colour beats the gradient's white. */}
          <BBadge
            variant={'' as ColorVariant}
            class='matching-tile-label bg-gradido-gradient'
            data-test='matching-tile-label'
          >
            <ITablerHeartHandshake aria-hidden='true' />
            <span>{t('navigation.matching')}</span>
          </BBadge>
          <BContainer class='bg-white app-box-shadow gradido-border-radius p-4 mt--3 matching-tile-box'>
            {stage.value === MAP ? (
              // 1. Not on the map: the invitation onto it.
              <>
                {/* With the number the heading counts and the question follows it; without, the
                    question is the heading (Bernd, 11.10.2026). Which of the two is decided before
                    the tile is painted and never after -- see `count` above. */}
                {saysCount.value ? (
                  <>
                    <div class='h3 mb-1 matching-tile-heading' data-test='map-invitation-heading'>
                      {t(
                        'matching.invitation.titleCount',
                        { n: n(props.count as number) },
                        props.count as number,
                      )}
                    </div>
                    <div data-test='map-invitation-question'>
                      {t('matching.invitation.question')}
                    </div>
                  </>
                ) : (
                  <div class='h3 matching-tile-heading' data-test='map-invitation-heading'>
                    {t('matching.invitation.title')}
                  </div>
                )}
                <div class='my-3 small' data-test='map-invitation-text'>
                  {t('matching.invitation.text')}
                </div>
                <div class='text-lg-end'>
                  {/* The label says what the tap does, because the tap is the member's yes: the home
                      tab opens with "findable" switched on (pages/Matching.vue). Nothing is saved
                      there until they have picked a home and pressed save. */}
                  <BButton
                    variant={'gradido' as ButtonVariant}
                    to={SHOW_ME_ON_THE_MAP}
                    data-test='map-invitation-go'
                  >
                    {t('matching.invitation.go')}
                  </BButton>
                </div>
              </>
            ) : stage.value === FIRST ? (
              // 2. On the map, and nothing entered yet: what the map cannot know by itself.
              <>
                <div class='h3 matching-tile-heading' data-test='matching-entries-heading'>
                  {t('matching.invitation.entriesTitle')}
                </div>
                <div class='my-3 small' data-test='matching-entries-text'>
                  {t('matching.invitation.entriesText')}
                </div>
                <div class='text-lg-end'>
                  <BButton
                    variant={'gradido' as ButtonVariant}
                    to={NEW_MATCHING_ENTRY}
                    data-test='matching-entries-go'
                  >
                    {t('matching.invitation.entriesGo')}
                  </BButton>
                </div>
              </>
            ) : (
              // 3. One or two entries: a quiet line, the shape "show it to your friends" takes once
              // it is no longer news. With the third entry it goes.
              <RouterLink
                to={NEW_MATCHING_ENTRY}
                class='text-decoration-none'
                data-test='matching-more-go'
              >
                {t('matching.invitation.entriesMore')} <IMdiChevronRight class='ms-1' />
              </RouterLink>
            )}
          </BContainer>
        </div>
      ) : null
  },
})
