<!-- AI-GENERATED — not an architecture reference -->
<template>
  <div class="public-profile text-center">
    <BButton class="w-100 fs-7" variant="gradido" :to="sendRoute" data-test="public-profile-send">
      {{ $t('public-profile.send') }}
    </BButton>

    <div class="mt-4">
      <div class="small">{{ $t('public-profile.address') }}</div>
      <gradido-address-copy :alias="alias" />
    </div>

    <div class="small mt-4">
      {{ $t('missingGradidoAccount', { communityName: communityName }) }}
    </div>
    <div class="mt-1">
      <BLink :to="routeWithParamsAndQuery('Register')" data-test="public-profile-register">
        {{ $t('signup') }}
      </BLink>
    </div>
  </div>
</template>

<script setup>
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
 */
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { BButton, BLink } from 'bootstrap-vue-next'
import GradidoAddressCopy from '@/components/GradidoAddressCopy'
import { useAuthLinks } from '@/composables/useAuthLinks'
import CONFIG from '@/config'

const route = useRoute()
const { routeWithParamsAndQuery } = useAuthLinks()

const alias = computed(() => String(route.params.alias ?? ''))
const communityName = CONFIG.COMMUNITY_NAME

// A route object rather than a path string, so the router encodes the parts. Community names
// may carry spaces ("KI Playground"), and the path this produces has to survive being stored
// by the guard and pushed again after the login.
const sendRoute = computed(() => ({
  name: 'Send',
  params: { communityIdentifier: communityName, userIdentifier: alias.value },
}))
</script>
