<!-- AI-GENERATED — not an architecture reference -->
<template>
  <settings-section :title="$t('settings.menu.notifications')">
    <BRow class="mb-5">
      <BCol cols="12" md="6" lg="6">
        {{ $t('settings.newsletter.newsletter') }}
        <div class="small">
          {{
            newsletterState
              ? $t('settings.newsletter.newsletterTrue')
              : $t('settings.newsletter.newsletterFalse')
          }}
        </div>
      </BCol>
      <BCol cols="12" md="6" lg="6" class="text-end">
        <user-newsletter />
      </BCol>
    </BRow>
  </settings-section>
</template>
<script setup>
import SettingsSection from '@/components/UserSettings/SettingsSection.vue'
import { computed } from 'vue'
import { useStore } from 'vuex'
import UserNewsletter from '@/components/UserSettings/UserNewsletter.vue'
import { BRow, BCol } from 'bootstrap-vue-next'

const store = useStore()
// Computed, not a ref taken once: the switch beside this line writes to the store, and a
// snapshot would leave the sentence below it saying the opposite of the switch until the
// next reload. (It was a snapshot on the old page too.)
const newsletterState = computed(() => store.state.newsletterState)
</script>
