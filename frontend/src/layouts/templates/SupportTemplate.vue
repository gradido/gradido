<!-- AI-GENERATED — not an architecture reference -->
<template>
  <contribution-info>
    <template #write>
      <div class="text-dark">
        <h3>{{ $t('support.info.write.title') }}</h3>
        {{ $t('support.info.write.text') }}
        <div class="my-3">
          <b>{{ $t('support.info.write.answer') }}</b>
        </div>
      </div>
    </template>
    <template #my-requests>
      <div class="text-dark">
        <h4 class="alert-heading">{{ $t('support.myRequests') }}</h4>
        <p>{{ $t('support.info.myRequests') }}</p>
        <ul>
          <li>
            <variant-icon :icon="SIGNS.OPEN.icon" :variant="SIGNS.OPEN.variant" />
            {{ $t('support.legend.open') }}
          </li>
          <li>
            <variant-icon :icon="SIGNS.IN_PROGRESS.icon" :variant="SIGNS.IN_PROGRESS.variant" />
            {{ $t('support.legend.inProgress') }}
          </li>
          <li>
            <variant-icon :icon="SIGNS.CLOSED.icon" :variant="SIGNS.CLOSED.variant" />
            {{ $t('support.legend.closed') }}
          </li>
          <li>
            <variant-icon :icon="SIGNS.DELETED.icon" :variant="SIGNS.DELETED.variant" />
            {{ $t('support.legend.deleted') }}
          </li>
        </ul>
      </div>
    </template>
    <template #information>
      <div class="text-dark">
        <h4 class="alert-heading">{{ $t('info') }}</h4>
        <p>{{ $t('support.info.information') }}</p>
      </div>
    </template>
  </contribution-info>
</template>
<script setup>
import ContributionInfo from '@/components/Template/RightSide/ContributionInfo.vue'
import VariantIcon from '@/components/VariantIcon.vue'
import { SUPPORT_TICKET_SIGNS as SIGNS } from '@/utils/supportTicketStatus'
</script>
