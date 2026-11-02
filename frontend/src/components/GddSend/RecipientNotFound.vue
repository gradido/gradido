<!-- AI-GENERATED — not an architecture reference -->
<template>
  <div class="recipient-not-found" data-test="recipient-not-found">
    <div class="recipient-not-found-card bg-white app-box-shadow gradido-border-radius p-3 p-md-4">
      <!-- The step before is gone with the button that was pressed. The heading takes the focus,
           so that a screen reader says what happened, and the window shows it. -->
      <h2
        ref="heading"
        class="h4 recipient-not-found-title"
        tabindex="-1"
        data-test="recipient-not-found-title"
      >
        {{ title }}
      </h2>
      <!-- Word for word and large: a typing error is found by reading it again. -->
      <p
        class="recipient-not-found-identifier text-break"
        data-test="recipient-not-found-identifier"
      >
        {{ identifier }}
      </p>
      <div v-if="canChooseCommunity" class="recipient-not-found-door">
        <p data-test="recipient-not-found-other-community">
          {{
            isEmail
              ? $t('form.recipient-not-found.other-community')
              : $t('form.recipient-not-found.other-community-entry')
          }}
        </p>
        <BButton
          variant="outline-secondary"
          class="recipient-not-found-button"
          :disabled="busy"
          data-test="recipient-not-found-choose-community"
          @click="$emit('choose-community')"
        >
          {{ $t('form.recipient-not-found.choose-community') }}
        </BButton>
      </div>
      <div v-if="isEmail" class="recipient-not-found-door">
        <p data-test="recipient-not-found-by-email">
          {{ $t('form.recipient-not-found.by-email', { days: LINK_VALID_DAYS }, LINK_VALID_DAYS) }}
        </p>
        <BButton
          variant="gradido"
          class="recipient-not-found-button"
          :disabled="busy"
          data-test="recipient-not-found-send-by-email"
          @click="$emit('send-by-email')"
        >
          {{ $t('form.recipient-not-found.send-by-email') }}
        </BButton>
      </div>
      <!-- The way back into the form, where everything entered still stands. Where it is the only
           way there is, it is a button like the others; beside a door it is a line of text. -->
      <div class="recipient-not-found-back">
        <BButton
          :variant="canChooseCommunity || isEmail ? 'link' : 'outline-secondary'"
          :disabled="busy"
          data-test="recipient-not-found-change"
          @click="$emit('change-recipient')"
        >
          {{
            isEmail
              ? $t('form.recipient-not-found.change-address')
              : $t('form.recipient-not-found.change-entry')
          }}
        </BButton>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Nobody has an account under what the member entered, in the community they chose (ZE-037). The
 * page says where it looked, shows what it looked for word for word, and opens two doors: another
 * community, or the thank-you by e-mail, which works for everybody.
 *
 * ⛔ Nothing here looks any further. Whether another community knows the address is not this
 * wallet's to ask: the form would become a directory of the whole federation by e-mail address.
 *
 * The page holds what happens behind the doors (pages/Send.vue). While the link is made (`busy`)
 * all three are shut: the answer empties the form and leaves this step, and that must not happen
 * under the hands of somebody who has walked back into the form.
 */
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { BButton } from 'bootstrap-vue-next'
import { LINK_VALID_DAYS } from '@/constants'
import { focusStepHeading } from '@/utils/focusStepHeading'
import { isGradidoId } from '@/utils/gradidoAddress'

const props = defineProps({
  // What the member entered, without its community.
  identifier: { type: String, required: true },
  communityName: { type: String, required: true },
  // It has the shape of an e-mail address: only that can get a mail.
  isEmail: { type: Boolean, default: false },
  // More than one community can be reached, so there is another one to choose.
  canChooseCommunity: { type: Boolean, default: false },
  busy: { type: Boolean, default: false },
})

defineEmits(['send-by-email', 'choose-community', 'change-recipient'])

const { t } = useI18n()

const title = computed(() => {
  const community = props.communityName
  if (props.isEmail) return t('form.recipient-not-found.title-email', { community })
  return isGradidoId(props.identifier)
    ? t('form.recipient-not-found.title-gradido-id', { community })
    : t('form.recipient-not-found.title-username', { community })
})

const heading = ref(null)
onMounted(() => focusStepHeading(heading.value))
</script>

<style lang="scss" scoped>
/* A heading is no control: it takes the focus for the screen reader, and shows no frame for it. */
.recipient-not-found-title {
  outline: none;
}

.recipient-not-found-identifier {
  margin-bottom: 1.5rem;
  font-size: 1.25rem;
  font-weight: 700;
}

/* A door: its sentence, and under it its button. */
.recipient-not-found-door {
  display: flex;
  flex-direction: column;
  margin-bottom: 1.5rem;
}

/* As wide as the card on a phone and no wider than the buttons of "Fertig" (ThankYouGreetingDone),
   in the middle. */
.recipient-not-found-button {
  align-self: center;
  width: min(24rem, 100%);
}

.recipient-not-found-back {
  text-align: center;
}
</style>
