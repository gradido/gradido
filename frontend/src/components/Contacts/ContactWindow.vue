<!-- AI-GENERATED — not an architecture reference -->
<template>
  <!-- A window over the list, not a jump into the send form (KF-010). A tap on a contact
       is somebody saying "this person", and what follows is a choice between two ways of
       reaching them -- the same shape the profile window on the map already has. -->
  <!-- ⛔ `no-header` / `no-footer`, NOT `hide-header` / `hide-footer`. bootstrap-vue-next
       renamed both; the old names are accepted silently as plain attributes and do
       nothing, so the window came up with an empty header bar and an untranslated
       Cancel / OK pair under its own two buttons. Measured in the installed package:
       `noHeader`/`noFooter` are declared, `hideHeader`/`hideFooter` occur nowhere.
       `UserThankYouCard.vue` carries the same warning beside the same trap.

       `lazy`, like the heart's confirmation: without it a closed dialog stays rendered and
       teleported to the body -- here holding a 64px portrait and a contact.

       ⛔ And `aria-label`, BECAUSE of `no-header`. The dialog labels itself through its
       header -- `aria-labelledby` is bound only where there is one -- so dropping the
       header left this window with no accessible name at all: a screen reader announced
       "dialog" and nothing else, while the person's name existed only inside the body. -->
  <BModal
    :model-value="modelValue"
    centered
    lazy
    no-header
    no-footer
    :aria-label="alias"
    body-class="contact-window-body"
    data-test="contact-window"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div v-if="contact" class="contact-window-inner">
      <!-- ⛔ In the body, not by turning the header back on. `no-header` is what keeps the
           person's name as the first thing in the window; a header would put an empty bar
           above it and push the face down. The window could always be closed by clicking
           beside it, but that is a thing one has to know -- a cross is the one control
           everybody looks for. (Bernd, 04.09.2026.)

           ⚠️ `$t('form.close')` as the accessible name, not the glyph: a screen reader
           reading "times" or nothing at all is what a bare × amounts to. -->
      <button
        type="button"
        class="contact-window-close"
        :aria-label="$t('form.close')"
        :title="$t('form.close')"
        data-test="contact-window-close"
        @click="emit('update:modelValue', false)"
      >
        <IBiX />
      </button>

      <div class="contact-window-head">
        <app-avatar :size="64" :color="'#fff'" v-bind="avatar" />
        <div class="contact-window-who">
          <div class="contact-window-name" data-test="contact-window-name">{{ alias }}</div>
          <div
            v-if="contact.user.communityName"
            class="contact-window-community"
            data-test="contact-window-community"
          >
            {{ contact.user.communityName }}
          </div>
          <!-- ⛔ Only where it can be built truthfully. The address is `host/u/alias`, and
               the host is the CONTACT's community -- which a contact row does not carry.
               For a member of this community it is ours; for anybody else the wallet would
               have to invent one, and an address that resolves to the wrong person is the
               exact failure `gradidoAddress` exists to prevent. The community line above
               already says they are from elsewhere. -->
          <div v-if="address" class="contact-window-address" data-test="contact-window-address">
            {{ address }}
          </div>
        </div>
      </div>

      <!-- The three numbers come from the same answer as the list: oldest booking, how
           many, newest booking. -->
      <div class="contact-window-meta" data-test="contact-window-meta">{{ meta }}</div>

      <BButton
        variant="primary"
        class="w-100 mb-2"
        data-test="contact-window-send"
        @click="toSend('send')"
      >
        {{ $t('contacts.sendGradido') }}
      </BButton>
      <BButton
        variant="secondary"
        class="w-100 mb-2"
        data-test="contact-window-email"
        @click="toSend('email')"
      >
        {{ $t('contacts.sendEmail') }}
      </BButton>

      <!-- The heart with its word beside it, which is what the `label` prop is for: in a
           list the symbol is enough, in a window with two named buttons it would be the
           only unnamed control. -->
      <div class="contact-window-heart">
        <favorite-heart :member="contact.user" label />
      </div>

      <!-- Reserved, and visibly not yet there: the contacts become the chat later (KF-008),
           and this is the place it will take. -->
      <div class="contact-window-later" data-test="contact-window-later">
        {{ $t('contacts.chatLater') }}
      </div>
    </div>
  </BModal>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { BButton, BModal } from 'bootstrap-vue-next'
import AppAvatar from '@/components/AppAvatar.vue'
import FavoriteHeart from '@/components/FavoriteHeart.vue'
import { contactDisplay } from '@/components/Contacts/contactDisplay'
import { gradidoAddress } from '@/utils/gradidoAddress'
import { SEND_TYPES } from '@/utils/sendTypes'

/**
 * One contact, opened from wherever a contact stands: the list, the column, the strip.
 *
 * One window per LIST rather than one per row -- a modal per row would build one hidden
 * dialog for every person on screen, which is the reason the heart's own confirmation is
 * `lazy`.
 */
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  /** What contactListQuery delivers: `{ user, firstAt, lastAt, bookings }`. */
  contact: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue'])

const { t, d } = useI18n()
const router = useRouter()

/**
 * Name and face through the shared helper, not by hand.
 *
 * ⛔ This file used to rebuild both itself while `contactDisplay`'s own docstring named the
 * window as one of the three places it keeps in step -- a guarantee that was not in force,
 * and the kind of sentence that stops the next reader looking.
 */
const display = computed(() =>
  props.contact ? contactDisplay(props.contact, { zoomable: true }) : null,
)
const alias = computed(() => display.value?.alias ?? '')
const avatar = computed(() => display.value?.avatar ?? {})

/**
 * The member's address, and only where this wallet is the one that can name the host.
 *
 * ⛔ `homeCommunity` from the server, not a comparison made here. The wallet knows its own
 * community by a name out of its OWN configuration, while the name on a contact was
 * written from the backend's -- two variables in two deployments, agreeing by coincidence
 * and parting company silently. The server compares community uuids, which is the one
 * identity both sides of a federated booking agree on.
 *
 * For anybody else the line falls away rather than inventing a host: an address that
 * resolves to the wrong person is exactly what `gradidoAddress` exists to prevent.
 */
const address = computed(() => {
  if (!props.contact?.homeCommunity) return ''
  return gradidoAddress(alias.value).display
})

// One string, so the separators are not raw template text -- the same reason the contact
// row builds its own.
const meta = computed(() => {
  if (!props.contact) return ''
  return [
    t('contacts.since', { date: d(new Date(props.contact.firstAt), 'monthAndYear') }),
    t('contacts.bookings', props.contact.bookings),
    t('contacts.last', { date: d(new Date(props.contact.lastAt), 'short') }),
  ].join(' · ')
})

/**
 * The two ways out, both of them the send form -- the second with the mode that opens the
 * e-mail half (`?art=email`), exactly as the profile window on the map does it.
 *
 * ⚠️ A member of another community goes down the same road: the send form is what knows
 * the federation branch, and a second way of reaching it here would be a second place for
 * that knowledge to drift.
 */
const toSend = (art) => {
  const community = props.contact?.user?.communityUuid
  const user = props.contact?.user?.gradidoID
  if (!community || !user) return
  emit('update:modelValue', false)
  // ⛔ BOTH ways say which, and that is not symmetry for its own sake. This window stands
  // beside /send, so a tap here changes only the params and the query -- the form is
  // patched, not rebuilt. Naming only the e-mail half left the OTHER button unable to
  // bring a form that was already in e-mail mode back to sending Gradido.
  router.push({
    path: `/send/${community}/${user}`,
    query: { art: art === 'email' ? SEND_TYPES.email : SEND_TYPES.send },
  })
}
</script>

<style lang="scss" scoped>
/* ⛔ The cross is positioned against THIS, not against Bootstrap's `.modal-body`. That
   element does carry `position: relative` today, but it belongs to bootstrap-vue-next --
   borrowing it would make this window's layout depend on a detail of somebody else's
   stylesheet, which is how a class name from another component put an invisible sheet over
   the whole wallet on 03.09. */
.contact-window-inner {
  position: relative;
}

/* Top right of the body. ⚠️ Absolutely positioned, so it is OUT of the flow and the name
   beside it lays out straight through the space it occupies -- the head has to reserve that
   space itself, which is what the `padding-right` below does. This comment used to claim
   that reservation while no rule made it, and a long alias ran under the cross.
   (coderabbit, PR #3840.) */
.contact-window-close {
  position: absolute;
  top: 0.5rem;
  right: 0.65rem;
  appearance: none;
  border: 0;
  background: transparent;
  color: var(--bs-secondary-color, #6c757d);
  font-size: 1.15rem;
  line-height: 1;
  padding: 0.25rem;
  border-radius: 4px;
  cursor: pointer;
}

.contact-window-close:hover,
.contact-window-close:focus-visible {
  color: var(--bs-body-color);
}

.contact-window-head {
  display: flex;
  align-items: center;
  gap: 0.75rem;

  /* The room the cross needs: 0.65rem from the right edge plus its own box. */
  padding-right: 2rem;
}

.contact-window-who {
  flex: 1;
  min-width: 0;
}

.contact-window-name {
  font-weight: 700;
  font-size: 1.1rem;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.contact-window-community,
.contact-window-address {
  font-size: 0.8rem;
  color: var(--bs-secondary-color, #6c757d);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.contact-window-meta {
  font-size: 0.8rem;
  color: var(--bs-secondary-color, #6c757d);
  margin: 0.75rem 0 1rem;
}

.contact-window-heart {
  display: flex;
  justify-content: center;
  padding: 0.25rem 0;
}

/* Dashed, because it is a place and not a control: the chat is not here yet, and a solid
   button that does nothing would be a promise. */
.contact-window-later {
  margin-top: 0.75rem;
  padding: 0.6rem;
  border: 1px dashed var(--bs-border-color, #dee2e6);
  border-radius: 0.5rem;
  text-align: center;
  font-size: 0.8rem;
  color: var(--bs-secondary-color, #6c757d);
}
</style>
