<!-- AI-GENERATED — not an architecture reference -->
<template>
  <contribution-info>
    <template #entries>
      <div class="text-dark">
        <h3>{{ $t('matching.info.entries.heading') }}</h3>
        <p>{{ $t('matching.info.entries.text') }}</p>
        <ul class="list-unstyled">
          <li class="d-flex align-items-baseline gap-2 mb-1">
            <i-bi-heart-fill style="color: #f00" />
            <span>
              <strong>{{ $t('matching.type.interesse.word') }}</strong>
              — {{ $t('matching.type.interesse.desc') }}
            </span>
          </li>
          <li class="d-flex align-items-baseline gap-2 mb-1">
            <i-bi-box-seam style="color: #10b981" />
            <span>
              <strong>{{ $t('matching.type.angebot.word') }}</strong>
              — {{ $t('matching.type.angebot.desc') }}
            </span>
          </li>
          <li class="d-flex align-items-baseline gap-2 mb-1">
            <i-bi-search style="color: #4658ff" />
            <span>
              <strong>{{ $t('matching.type.gesuch.word') }}</strong>
              — {{ $t('matching.type.gesuch.desc') }}
            </span>
          </li>
        </ul>
        <p>{{ $t('matching.info.entries.paused') }}</p>
      </div>
    </template>
    <template #about>
      <div class="text-dark">
        <h3>{{ $t('matching.info.about.heading') }}</h3>
        <p>{{ $t('matching.info.about.p1') }}</p>
        <p>{{ $t('matching.info.about.p2') }}</p>
      </div>
    </template>
    <template #position>
      <div class="text-dark">
        <h3>{{ $t('matching.info.position.heading') }}</h3>
        <p>{{ $t('matching.info.position.p1') }}</p>
        <p>{{ $t('matching.info.position.p2') }}</p>
      </div>
    </template>
  </contribution-info>
</template>
<script setup>
import ContributionInfo from '@/components/Template/RightSide/ContributionInfo.vue'
</script>
