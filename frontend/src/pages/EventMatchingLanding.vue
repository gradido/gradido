<!-- AI-GENERATED — not an architecture reference -->
<template>
  <div v-if="entry" class="event-matching-landing text-center">
    <auth-triads />
    <h2 class="h4 mb-4" data-test="event-matching-headline">
      {{ $t('eventMatching.landing.headline') }}
    </h2>

    <!-- What the link offers, read back as text: the sentence, the details, and whether it is
         found from afar. All of it is the link's own, written by whoever built it. -->
    <p class="small mb-1">{{ $t('eventMatching.landing.firstEntry') }}</p>
    <p class="event-entry-sentence mb-2" data-test="event-matching-sentence">
      {{ $t('matching.type.interesse.prefix') }} {{ entry.summary }}
    </p>
    <p
      v-if="entry.details"
      class="event-entry-details small mb-2"
      data-test="event-matching-details"
    >
      {{ entry.details }}
    </p>
    <p v-if="entry.remote" class="small mb-0" data-test="event-matching-remote">
      <i-bi-globe2 aria-hidden="true" />
      {{ $t('matching.entries.remote') }}
    </p>

    <!-- Two buttons of one size, like the two of the Gradido address (PublicProfile): the page
         cannot know whether a newcomer or a member is reading it, and it does not guess. Both
         lead on without the link's query -- the store holds the entry (routes/guards.js). -->
    <div class="landing-actions mt-4">
      <BButton
        class="fs-7 landing-action"
        variant="gradido"
        :to="{ name: 'Register' }"
        data-test="event-matching-register"
      >
        {{ $t('eventMatching.landing.register') }}
      </BButton>
      <BButton
        class="fs-7 landing-action"
        variant="gradido"
        :to="{ name: 'Login' }"
        data-test="event-matching-login"
      >
        {{ $t('eventMatching.landing.haveAccount') }}
      </BButton>
    </div>

    <!-- The link leads to the community it was built in, and to no other. -->
    <p class="small mt-4 mb-0" data-test="event-matching-other-community">
      {{ $t('eventMatching.landing.otherCommunity') }}
    </p>
  </div>
</template>

<script setup>
/**
 * The page behind the link of project matching, `community-host/project?interest=…` (or
 * `/event?…`, the address of the first links), for somebody who is not signed in. A host hands
 * the link to the people of a project -- an association, a congress, a course; it offers whoever
 * opens it one entry for the matching -- "I love ‹interest›" -- and with it the map on which the
 * people of that project find each other.
 *
 * ## It shows, and does nothing
 *
 * What the link says is read by a guard before this page is entered (routes/guards.js): no
 * sentence in it leads to the sign-in page, a running session to the member's entries, and
 * only somebody not signed in gets here -- with the entry kept in the store for an hour, for
 * the sign-in that follows. So the page reads the address once more for the one thing it does:
 * saying what the link offers. It asks the server nothing.
 *
 * ## The words are the link's
 *
 * Sentence and details come out of the address, written by whoever built the link. They are
 * shown as text, never as markup, and cut to what an entry holds (utils/eventMatchingLink).
 * Nothing becomes an entry by being shown here: whoever signs in afterwards finds the words in
 * the form for a new entry, and saves them there or does not.
 *
 * ## Two ways on, and neither carries the link along
 *
 * "Create an account" and "I already have an account" lead to the registration and the sign-in
 * as they are. The query stays behind on purpose: the link's parameters mean something here
 * and nowhere else, and the pages they lead to read parameters of their own. The two links of
 * the bar above the page leave it behind as well (`queryStaysBehind` on the route).
 *
 * Whoever has their account in another community is told so in a sentence. The link leads to
 * the community it was built in; a way home to one's own does not exist yet.
 */
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { BButton } from 'bootstrap-vue-next'
import AuthTriads from '@/components/Auth/AuthTriads'
import { readEventMatchingLink } from '@/utils/eventMatchingLink'

const route = useRoute()

const entry = computed(() => readEventMatchingLink(route.query))
</script>

<style lang="scss" scoped>
/* Block comments only: lightningcss parses SFC style blocks and a double slash is not a
   comment to it.

   The sentence is what the page is about: size and weight of an entry's title in the member's
   list (pages/Matching.vue, .entry-title: 18px at the usual size), in `em` so it follows the
   text size chosen in the card's corner. Long words break rather than widen the card -- a
   link may carry a title without a single blank. */
.event-entry-sentence {
  font-size: 1.125em;
  font-weight: 700;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

/* Line breaks of the link stay, as in the member's list (.details-box). */
.event-entry-details {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

/* The two buttons as on the Gradido address (pages/PublicProfile.vue, .profile-actions), rule
   for rule: one column, as wide as the wider label, both filling it; on a phone the whole
   width, with the house button's side padding taken back so the label keeps its line. Through
   `:deep`: BButton renders a router-link, which renders the anchor. */
.landing-actions {
  display: inline-grid;
  gap: 0.75rem;
}

.landing-actions :deep(.landing-action) {
  width: 100%;
}

@media screen and (width <= 767px) {
  .landing-actions {
    display: grid;
  }

  .landing-actions :deep(.landing-action) {
    padding-right: 1.25rem !important;
    padding-left: 1.25rem !important;
  }
}
</style>
