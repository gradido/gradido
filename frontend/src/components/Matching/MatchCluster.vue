<!-- AI-GENERATED — not an architecture reference -->
<template>
  <div
    class="cluster-cover"
    role="dialog"
    aria-modal="true"
    :aria-label="$t('matching.cluster.title', { n: people.length })"
  >
    <button
      type="button"
      class="cluster-close"
      :aria-label="$t('matching.cluster.close')"
      @click="$emit('close')"
    >
      <i-bi-x-lg />
    </button>
    <h3 class="cluster-head">{{ $t('matching.cluster.title', { n: people.length }) }}</h3>
    <ul class="cluster-rows">
      <li v-for="item in people" :key="item.match.uuid">
        <button type="button" class="cluster-row" @click="$emit('open', item.match)">
          <span class="cluster-dots" aria-hidden="true">
            <span
              v-for="channel in dotsFor(item)"
              :key="channel"
              class="cluster-dot"
              :style="{ background: LABEL_COLORS[channel] }"
            />
          </span>
          <span class="cluster-body">
            <span class="cluster-name-row">
              <span class="cluster-name">{{ item.match.name }}</span>
              <span class="cluster-sep" aria-hidden="true" />
              <span class="cluster-community">{{ item.match.community.name }}</span>
            </span>
            <span class="cluster-line">{{ lineFor(item) }}</span>
          </span>
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { CHANNELS, LABEL_COLORS } from '@/components/Matching/displayCore'

defineProps({
  // Each item is { match, stages, peak } — the map's own shape, already sorted by
  // fit by the parent. Distance is left out on purpose: on one point it says nothing.
  people: { type: Array, default: () => [] },
})
defineEmits(['open', 'close'])

const { t } = useI18n()

/** The matched channels of a person, in the fixed heart-first order. */
function dotsFor(item) {
  return CHANNELS.filter((channel) => (item.stages?.[channel] || 0) >= 1)
}

/** The single strongest matched entry across the channels → its line. */
function lineFor(item) {
  let best = null
  let bestChannel = null
  for (const channel of CHANNELS) {
    if ((item.stages?.[channel] || 0) < 1) continue
    for (const entry of item.match.channels?.[channel] || []) {
      if (entry.strength == null) continue
      if (!best || entry.strength > best.strength) {
        best = entry
        bestChannel = channel
      }
    }
  }
  if (!best) return ''
  return t(`matching.list.line.${bestChannel}`, { thing: best.summary })
}
</script>

<style scoped>
/* Like the detail window and the full list, the cluster overlay follows the wallet
   theme — the semantic tokens flip on .dark-mode at #app/body — never the map look,
   so it is a light or dark panel regardless of how the map underneath is tinted. It
   stays translucent so the map reads through; 82% keeps the text legible over any
   look, including a dark panel over a light map. */
.cluster-cover {
  position: absolute;
  inset: 0;
  z-index: 500;
  overflow-y: auto;
  padding: 16px 16px 24px;
  background: color-mix(in srgb, var(--surface) 82%, transparent);
  color: var(--text);
  animation: cluster-rise 0.34s cubic-bezier(0.2, 0.7, 0.3, 1);
}

.cluster-close {
  position: absolute;
  top: 10px;
  right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 50%;
  background: rgb(128 128 128 / 20%);
  color: inherit;
  cursor: pointer;
}

.cluster-head {
  margin: 2px 44px 12px 2px;
  font-size: 15px;
  font-weight: 700;
}

.cluster-rows {
  margin: 0;
  padding: 0;
  list-style: none;
}

.cluster-row {
  display: flex;
  gap: 10px;
  width: 100%;
  padding: 10px 4px;
  border: 0;
  border-top: 1px solid rgb(128 128 128 / 24%);
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.cluster-dots {
  display: flex;
  gap: 3px;
  padding-top: 4px;
}

.cluster-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
}

.cluster-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cluster-name-row {
  display: flex;
  align-items: center;
  gap: 7px;
}

.cluster-name {
  font-size: 14px;
  font-weight: 700;
}

.cluster-sep {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: currentcolor;
  opacity: 0.4;
}

.cluster-community {
  font-size: 12.5px;
  opacity: 0.7;
}

.cluster-line {
  font-size: 13px;
  opacity: 0.85;
}

@keyframes cluster-rise {
  from {
    transform: translateY(100%);
    opacity: 0;
  }

  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
