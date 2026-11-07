<!-- AI-GENERATED — not an architecture reference -->
<template>
  <!-- EM-014: inside the 24 hours of EM-013 the address reminder is this strip at the top of
       every page of the wallet but the settings, and not a window. It says what there is to do
       and takes nothing away. No "Später" and no cross: the clock runs, and the strip stays until
       the address is confirmed. Past the deadline the window that cannot be closed takes over
       (EmailConfirmationReminder) -- both read the same clock (useEmailConfirmation), so in the
       minute this goes, the window comes.

       Not one of the first-login windows (useFirstLoginWindow): it covers nothing, so it waits
       for nothing and holds nothing back.

       ⚠️ A named region, and the live part is only the line that comes after a press. A status
       role on the whole strip would read all of it again, button labels included, for that one
       line: `status` is atomic. -->
  <section
    v-if="shown"
    class="email-confirmation-strip"
    aria-labelledby="email-confirmation-strip-title"
    data-test="email-confirmation-strip"
  >
    <div class="email-confirmation-strip-text">
      <p id="email-confirmation-strip-title" class="email-confirmation-strip-title">
        {{ $t('emailConfirmation.title') }}
      </p>
      <p class="email-confirmation-strip-sentence" data-test="email-confirmation-strip-sentence">
        {{ $t('emailConfirmation.strip', { deadline: deadlineText }) }}
      </p>
      <!-- In the DOM before there is anything to say, or a screen reader may miss what is put
           into it. Empty, it takes no room. -->
      <p role="status" class="email-confirmation-strip-status">
        <span v-if="resent" data-test="email-confirmation-strip-resent">
          {{ $t('emailConfirmation.resent') }}
        </span>
      </p>
    </div>
    <div class="email-confirmation-strip-actions">
      <button
        type="button"
        class="email-confirmation-strip-action"
        :disabled="resending"
        data-test="email-confirmation-strip-resend"
        @click="resend"
      >
        {{ $t('emailConfirmation.resend') }}
      </button>
      <button
        type="button"
        class="email-confirmation-strip-action"
        data-test="email-confirmation-strip-change-address"
        @click="goToSettings"
      >
        {{ $t('emailConfirmation.changeAddress') }}
      </button>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEmailConfirmation } from '@/composables/useEmailConfirmation'

const route = useRoute()
const router = useRouter()
const { unconfirmed, overdue, deadlineText, resend, resending, resent } = useEmailConfirmation()

// Never in the settings: correcting the address lives there, as for the window.
const shown = computed(
  () => unconfirmed.value && !overdue.value && !route.path.startsWith('/settings'),
)

const goToSettings = () => {
  router.push('/settings/account')
}
</script>

<style scoped>
/* Block comments only: lightningcss parses SFC style blocks, and a double slash is not a comment
   to it.

   One surface over the width of the content column, in the wallet's own values, light and dark:
   the card's surface and text, framed in the gold of `--warning` -- the clock runs, nothing is
   wrong yet. The radius is the cards' and the alerts'. The air below it is the page's: the strip
   stands where the page begins and takes the page's own distance above it (DashboardLayout,
   `.main-content`).

   Text and buttons side by side where they fit, the buttons under the text where they do not --
   on a phone always, on the desk where the column is wide enough. Decided by the room the strip
   has, not by the width of the screen: beside the menu and the right column the content column
   of a desk is as narrow as a tablet. */
.email-confirmation-strip {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem 1.5rem;
  margin-bottom: 1rem;
  padding: 0.85rem 1.25rem;
  border: 1px solid var(--warning);
  border-radius: 26px;
  background-color: var(--surface);
  color: var(--text);
}

/* ⛔ `min-width: 0`: a flex item's least width is its content. */
.email-confirmation-strip-text {
  flex: 1 1 20rem;
  min-width: 0;
}

.email-confirmation-strip-title {
  margin: 0;
  font-weight: 700;
}

.email-confirmation-strip-sentence {
  margin: 0.15rem 0 0;
}

.email-confirmation-strip-status {
  margin: 0;
  color: var(--success);
  font-size: 0.875rem;
}

.email-confirmation-strip-status:not(:empty) {
  margin-top: 0.35rem;
}

/* The two quiet ways, side by side where they fit -- as on the thank-you tile. */
.email-confirmation-strip-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 0.75rem;
  margin-left: -0.35rem;
}

/* Small to the eye, a finger to the pointer; in the colour of a link because both lead
   somewhere -- the mail out again, the settings. */
.email-confirmation-strip-action {
  min-height: 2rem;
  padding: 0.25rem 0.35rem;
  border: 0;
  background: transparent;
  color: var(--bs-link-color);
  font-size: 0.9rem;
  line-height: 1.3;
  white-space: nowrap;
  cursor: pointer;
}

.email-confirmation-strip-action:hover {
  text-decoration: underline;
  text-underline-offset: 0.15em;
}

.email-confirmation-strip-action:focus-visible {
  outline: 2px solid var(--success);
  outline-offset: 2px;
}

.email-confirmation-strip-action:disabled {
  cursor: default;
  opacity: 0.6;
}
</style>
