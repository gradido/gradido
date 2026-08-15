<!-- AI-GENERATED — not an architecture reference -->
<template>
  <div class="public-profile text-center">
    <div class="small">{{ $t('public-profile.address') }}</div>

    <div class="mb-2">
      <gradido-address-copy :alias="alias" />
    </div>

    <!-- A heading with its sentence underneath, not two things side by side. The first
         attempt put them on one line with the house separator, and on screen that read as a
         divider between equals rather than as a label for what follows. The colon lives in
         the translation, because it is not the same mark everywhere -- French sets a space
         before it, and that cannot be done from here.

         A real heading element, not bold text: a screen reader has to be able to find it,
         and "looks like a heading" is not something it can hear. `h6` only sets the size --
         this page carries no heading of its own otherwise, so h2 is the level it starts at.
         That the layout around it has no <h1> is true and not settled here: it writes the
         community name as `div.h1`, and that belongs to every page in the auth layout, not
         to this one. -->
    <div class="small mb-4">
      <h2 class="h6 fw-bold mb-0">{{ $t('public-profile.send') }}</h2>
      <div>{{ $t('public-profile.send-hint') }}</div>
    </div>

    <div class="small">
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
 * ## Why there is no "I am in another community" branch
 *
 * Because copying covers it, and without asking. The address goes into the visitor's own
 * wallet, wherever that is -- and there it carries money, e-mail and later a chat thread.
 * A community picker would have to be built once per purpose and would only offer the
 * communities this server reached recently; the clipboard always works.
 *
 * The same reasoning removes the need to bring anybody back here after logging in: the way
 * is copy-and-paste, not log-in-and-return, so nothing has to survive the trip.
 */
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { BLink } from 'bootstrap-vue-next'
import GradidoAddressCopy from '@/components/GradidoAddressCopy'
import { useAuthLinks } from '@/composables/useAuthLinks'
import CONFIG from '@/config'

const route = useRoute()
const { routeWithParamsAndQuery } = useAuthLinks()

const alias = computed(() => String(route.params.alias ?? ''))
const communityName = CONFIG.COMMUNITY_NAME
</script>
