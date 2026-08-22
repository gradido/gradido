<!-- AI-GENERATED — not an architecture reference -->
<template>
  <div class="settings-notifications">
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
  </div>
</template>
<script setup>
import { ref } from 'vue'
import { useStore } from 'vuex'
import UserNewsletter from '@/components/UserSettings/UserNewsletter.vue'
import { BRow, BCol } from 'bootstrap-vue-next'

const store = useStore()
const newsletterState = ref(store.state.newsletterState)
</script>
