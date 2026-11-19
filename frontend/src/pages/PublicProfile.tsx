// AI-GENERATED — not an architecture reference
import { BButton, type ButtonVariant } from 'bootstrap-vue-next'
import { computed, defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { AuthTriads } from '@/components/Auth/AuthTriads'
import { GradidoAddressCopy } from '@/components/GradidoAddressCopy'
import { useAuthLinks } from '@/composables/useAuthLinks'
import CONFIG from '@/config'
import { isGradidoId } from '@/utils/gradidoAddress'
import { isValidUsername } from '@/validationSchemas'
import classes from './PublicProfile.module.scss'

/**
 * The page behind a Gradido address, `community-host/u/alias`.
 *
 * ## It asks nothing, and that is the point
 *
 * The page never looks up whether the alias belongs to anybody. From the outside it must not
 * be possible to tell whether somebody is with Gradido at all, and the cheapest way to hold
 * that line is to have nothing to tell: no query, so no timing difference between a member
 * and a made-up name, nothing to harvest by trying names one after another, and no release
 * switch needed because nothing about a person is shown. The name in the address is the
 * visitor's own input echoed back, not an answer.
 *
 * Nothing is lost by that. Whoever scans a printed Gradido card is already holding the name
 * and the face; the card is the disclosure, not this page. What the page owes the visitor is
 * a way onward, not an introduction.
 *
 * ## The send button is a link, not a decision
 *
 * It leads to `/send/<community>/<alias>` and nothing else. That route requires
 * authentication, so the router guard already does what a hand-written check here would do:
 * a member who is signed in lands in the send form with the recipient filled in, and one who
 * is not is sent to the login and brought back to the same address afterwards, because the
 * guard remembers the path it turned away.
 *
 * So the page asks neither whether somebody is signed in nor whether they belong here. That
 * matters beyond saving a few lines: the card is set up on a phone and opened on shared
 * machines, and a page that guessed membership from what the browser remembers would show
 * the next visitor a guess about the last one. The guard asks the token instead of guessing.
 *
 * ## The greeting is the address read back
 *
 * "{name} shows you Gradido" takes the name from the address, like everything else here --
 * the visitor's own input echoed back, never an answer from the server, so a made-up name gets
 * the same page with that name in it. A Gradido ID in the address is a member without a user
 * name (`memberAlias` falls back to it), and a UUID is no way to greet anybody: then the page
 * says "somebody". The shape alone decides that (`isGradidoId`), again without asking.
 *
 * Every sentence has to hold for both visitors, the newcomer and the member paying at a stall,
 * because the page does not know which of them is reading.
 *
 * ## Why the community is named, not printed
 *
 * The address prints the community as a host (`ki-playground.gradido.net`), but the backend
 * resolves a community by uuid, by name, or by the stored federation endpoint -- and the host
 * is none of those, so a link built from the printed form would open the form and fail to
 * fill it. The uuid would have to be asked for, which is exactly what this page does not do,
 * so the name it is: `CONFIG.COMMUNITY_NAME` is how the wallet already names its own
 * community elsewhere (the send form's default target, the redeem path's home entry).
 *
 * That the button only works for members of *this* community is not a shortcoming of the
 * link but the reason the address stays below it. Whoever is at home somewhere else copies
 * the address into their own wallet, where it carries money, e-mail and later a chat thread.
 * The button leads; copying catches whoever the button cannot serve.
 *
 * The line under the address names the community for the same reason, and for the newcomer
 * it says where the account would be opened. The second button leads where the registration
 * link below the card used to lead.
 *
 * ## The second button carries the name, and the page says so
 *
 * "Create account" takes the user name from the address along (`?referrer=<name>`), and the
 * registration hands it to the server, which makes its owner the referrer of the new account
 * - silently, and only if the name belongs to somebody; nothing comes back either way, so
 * the page still asks nothing. Because the person in the address learns of the arrival, the
 * newcomer reads that here, before registering (ZE-005).
 *
 * Only for a user name. A Gradido ID leaves no trace (the server takes names only), and a
 * page that greets "somebody" should not promise that somebody hears of it; anything else in
 * the address - a reserved word included - is no name at all, and the server would refuse the
 * registration over it. The shape decides, as for the greeting.
 */
export const PublicProfile = defineComponent({
  name: 'PublicProfile',
  setup() {
    const route = useRoute()
    const { t } = useI18n()
    const { routeWithParamsAndQuery } = useAuthLinks()

    const alias = computed(() => String(route.params.alias ?? ''))
    const communityName = CONFIG.COMMUNITY_NAME

    const greeting = computed(() =>
      isGradidoId(alias.value)
        ? t('public-profile.showsSomebody')
        : t('public-profile.shows', { name: alias.value }),
    )

    // A route object rather than a path string, so the router encodes the parts. Community names
    // may carry spaces ("KI Playground"), and the path this produces has to survive being stored
    // by the guard and pushed again after the login.
    const sendRoute = computed(() => ({
      name: 'Send',
      params: { communityIdentifier: communityName, userIdentifier: alias.value },
    }))

    const leavesTrace = computed(() => isValidUsername(alias.value))

    const registerRoute = computed(() =>
      leavesTrace.value
        ? routeWithParamsAndQuery('Register', { query: { referrer: alias.value } })
        : routeWithParamsAndQuery('Register'),
    )

    return () => (
      <div class='public-profile text-center'>
        <AuthTriads />
        <h2 class='h4 mb-2' data-test='public-profile-shows'>
          {greeting.value}
        </h2>
        <p class='small mb-4' data-test='public-profile-lead'>
          {t('public-profile.lead')}
        </p>

        {/* Two buttons of one size, for whoever holds the phone: somebody with an account sends,
            somebody without one opens one. Neither is ranked -- the page cannot know which of
            the two is looking at it, and it does not guess (PS-029).

            "One size" without a grid fraction, for the reason the first button taught (PS-015):
            the card is not widest on the widest screen, and the label that decides is not the
            German one. So the two stand in a column that is as wide as the wider label, and each
            fills it; on a phone the column takes the card's width, where a big target is easier
            to hit with a thumb. */}
        <div class={['profile-actions', classes['profile-actions']]}>
          <BButton
            class='fs-7 profile-action'
            variant={'gradido' as ButtonVariant}
            to={sendRoute.value}
            data-test='public-profile-send'
          >
            {t('public-profile.send')}
          </BButton>
          <BButton
            class='fs-7 profile-action'
            variant={'gradido' as ButtonVariant}
            to={registerRoute.value}
            data-test='public-profile-register'
          >
            {t('public-profile.join')}
          </BButton>
        </div>

        <div class='mt-4'>
          <div class='small'>{t('public-profile.address')}</div>
          <GradidoAddressCopy alias={alias.value} />
        </div>

        {/* The community is named here and not in the button: "Create an account with
            <community>" broke onto two lines on every phone in all ten languages, and onto up
            to four with a long community name (measured against the built stylesheets). */}
        <p class='small mt-4 mb-0' data-test='public-profile-duration'>
          {t('public-profile.duration', { communityName })}
        </p>
        {/* Read before anybody registers, because an account opened from here tells the person
            in the address about it (ZE-005). Only where there is such a trace to leave. */}
        {leavesTrace.value ? (
          <p class='small mt-2 mb-0' data-test='public-profile-echo-hint'>
            {t('public-profile.echoHint', { name: alias.value })}
          </p>
        ) : null}
      </div>
    )
  },
})
