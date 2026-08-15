<!-- AI-GENERATED — not an architecture reference -->
<template>
  <div class="public-profile text-center">
    <div class="text-small">{{ $t('public-profile.address') }}</div>

    <div class="mb-2">
      <gradido-address-copy :alias="alias" />
    </div>

    <!-- The separator is a line and not a character, which is what the house does everywhere
         (.separator-start): nothing lands in the text, so a screen reader passes over it
         instead of announcing a punctuation mark between the label and the sentence. -->
    <div class="text-small mb-4">
      <b>{{ $t('public-profile.send') }}</b>
      <span class="separator-start ms-2 ps-2">{{ $t('public-profile.send-hint') }}</span>
    </div>

    <div class="text-small">
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
