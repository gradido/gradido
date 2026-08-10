<!-- AI-GENERATED — not an architecture reference -->
<template>
  <!-- The window is the person's profile, not an explanation of the match. It
       shows what they published and nothing else; the match only decides what
       stands open. One window, not two: a grey ring is the same window with no
       open areas. See GMS-111. -->
  <BModal
    :model-value="modelValue"
    :aria-label="match ? $t('matching.profile.aria', { name: match.name }) : ''"
    scrollable
    centered
    body-class="profile-body"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template #title>
      <div v-if="match" class="profile-head">
        <div class="profile-name">{{ match.name }}</div>
        <div v-if="match.community" class="profile-community">{{ match.community.name }}</div>
      </div>
    </template>

    <div v-if="match">
      <!-- Their own words, first. Not matched, just a text — the most important
           thing about a person is exactly what the machine ignores. Empty means
           empty: the heading falls away rather than accuse them of a gap. -->
      <div v-if="hasAbout" class="profile-about">
        <div class="about-label">{{ $t('matching.tabs.about') }}</div>
        <div class="about-text">{{ match.aboutMe }}</div>
      </div>

      <!-- Heart first: I love · I offer · I look for. The stem is the heading;
           the entries below are only the completions. An empty area is gone. -->
      <div v-for="area in areas" :key="area.key" class="profile-area">
        <button
          type="button"
          class="area-head"
          :aria-expanded="areaOpen[area.key]"
          @click="toggleArea(area.key)"
        >
          <span class="area-dot" :style="{ background: dotColor(area.key) }" aria-hidden="true" />
          <span class="area-stem">{{ $t(`matching.type.${area.key}.prefix`) }}</span>
          <!-- A count, right at the edge (variant B): a rubric tally, never a
               verdict — no percentage, no score is ever shown. -->
          <span class="area-count">{{ area.count }}</span>
          <CollapseIcon :visible="areaOpen[area.key]" />
        </button>

        <BCollapse :model-value="areaOpen[area.key]">
          <ul class="entry-list">
            <li v-for="entry in shownEntries(area)" :key="entry.uuid" class="entry">
              <div class="entry-line">
                <span class="entry-summary">{{ entry.summary }}</span>
                <span v-if="entry.remote" class="remote-badge">
                  {{ $t('matching.entries.remote') }}
                </span>
              </div>
              <div v-if="entry.details" class="entry-details">{{ entry.details }}</div>
            </li>
          </ul>

          <!-- "X more" presupposes a before, so it only appears where something
               already stands open. Over an empty area it would be wrong. -->
          <button
            v-if="!areaExpanded[area.key] && area.count > SHOWN"
            type="button"
            class="more-btn"
            @click="areaExpanded[area.key] = true"
          >
            {{ $t('matching.profile.more', { n: moreCount(area) }) }}
          </button>
        </BCollapse>
      </div>
    </div>

    <!-- The real actions live in the footer, so they stay put while the profile
         scrolls. No OK/Cancel: those only closed the window, and the × up top
         already does that. The window is a go-between, not a till — the buttons
         point at the send form, the e-mail one carrying its mode (?art=email).
         Icons are the wallet's own send-form glyphs: the coin, the fast mail. -->
    <template #footer>
      <div v-if="match" class="profile-actions">
        <button type="button" class="send-btn send-gradido" @click="toSend('send')">
          <img src="/img/svg/gdd_coin_sw.svg" class="send-coin" alt="" aria-hidden="true" />
          {{ $t('matching.profile.sendGradido') }}
        </button>
        <button type="button" class="send-btn send-email" @click="toSend('email')">
          <i-mdi-email-fast-outline class="send-mail-icon" aria-hidden="true" />
          {{ $t('matching.profile.sendEmail') }}
        </button>
      </div>
    </template>
  </BModal>
</template>

<script setup>
import { computed, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import { LABEL_COLORS } from '@/components/Matching/displayCore'
import CollapseIcon from '@/components/TransactionRows/CollapseIcon'

// Heart first, then offer, then need — GMS-82's "Herz zuerst".
const CHANNEL_ORDER = ['interesse', 'angebot', 'gesuch']
// How many entries stand open in an area before "X more" folds the rest.
const SHOWN = 2
// An honest ceiling, not pagination: thirty entries are ~3 KB, so blattering is
// a tool without an opponent — but a runaway list still gets cut, plainly.
const MAX_ENTRIES = 100

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  match: { type: Object, default: null },
})
const emit = defineEmits(['update:modelValue'])

const router = useRouter()

const hasAbout = computed(() => Boolean(props.match?.aboutMe && props.match.aboutMe.trim()))

/** Matches first, strongest on top; then the rest in the order they were kept. */
function sortEntries(entries) {
  const matched = entries.filter((e) => e.strength != null).sort((a, b) => b.strength - a.strength)
  const rest = entries.filter((e) => e.strength == null)
  return [...matched, ...rest]
}

const areas = computed(() => {
  if (!props.match) return []
  const out = []
  for (const key of CHANNEL_ORDER) {
    const entries = props.match.channels?.[key]
    if (!entries || !entries.length) continue
    out.push({
      key,
      count: entries.length,
      hasMatch: entries.some((e) => e.strength != null),
      sorted: sortEntries(entries),
    })
  }
  return out
})

// An area with a match opens itself; the rest are drawers, shut, their heading
// and count the label. Reset whenever the window changes person.
const areaOpen = reactive({})
const areaExpanded = reactive({})
watch(
  () => props.match,
  () => {
    for (const key of CHANNEL_ORDER) {
      areaOpen[key] = false
      areaExpanded[key] = false
    }
    for (const area of areas.value) areaOpen[area.key] = area.hasMatch
  },
  { immediate: true },
)

function toggleArea(key) {
  areaOpen[key] = !areaOpen[key]
}

function dotColor(key) {
  // The dot wears the colour the member typed the entry in, not the glow's
  // additive primary — so it stays legible for red-green colour vision.
  return LABEL_COLORS[key]
}

function shownEntries(area) {
  const capped = area.sorted.slice(0, MAX_ENTRIES)
  return areaExpanded[area.key] ? capped : capped.slice(0, SHOWN)
}

function moreCount(area) {
  return Math.min(area.count, MAX_ENTRIES) - SHOWN
}

function toSend(art) {
  const community = props.match?.community?.uuid
  const user = props.match?.uuid
  if (!community || !user) return
  const path = `/send/${community}/${user}`
  router.push(art === 'email' ? { path, query: { art: 'email' } } : { path })
}
</script>

<style lang="scss" scoped>
.profile-head {
  min-width: 0;
}

.profile-name {
  font-weight: 700;
  font-size: 18px;
  color: var(--text);
  line-height: 1.2;
}

.profile-community {
  font-size: 13px;
  color: var(--text-muted);
  margin-top: 2px;
}

:deep(.profile-body) {
  padding-top: 0.5rem;
}

.profile-about {
  margin-bottom: 18px;
}

.about-label {
  font-weight: 700;
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 4px;
}

.about-text {
  font-size: 15px;
  color: var(--text);
  white-space: pre-wrap;
  word-break: break-word;
}

.profile-area {
  border-top: 1px solid var(--border);
  padding: 4px 0;
}

.area-head {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 0;
  border: 0;
  background: transparent;
  text-align: left;
  color: var(--text);
}

.area-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex: 0 0 auto;
}

.area-stem {
  font-weight: 700;
  font-size: 15px;
}

/* Pushed to the right edge, before the collapse chevron — a tally, not a score. */
.area-count {
  margin-left: auto;
  font-size: 14px;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

/* The chevron is a shared house icon carrying bootstrap's .h1, whose 0.5rem
   margin-bottom lifts it a few pixels above the row centre — just out of line
   with the count beside it. Zero it here (not in the shared component) so the
   arrow and the number sit on one centre line. */
.area-head :deep(.collapse-icon) {
  display: flex;
  align-items: center;
  line-height: 1;
}

.area-head :deep(.collapse-icon svg) {
  margin: 0;
}

.entry-list {
  list-style: none;
  margin: 0;
  padding: 0 0 6px 22px;
}

.entry {
  padding: 6px 0;
}

.entry-line {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 8px;
}

.entry-summary {
  font-size: 15px;
  color: var(--text);
  word-break: break-word;
}

.remote-badge {
  font-size: 12px;
  padding: 2px 9px;
  border-radius: 20px;
  background: var(--surface-muted);
  color: var(--text-muted);
  white-space: nowrap;
}

.entry-details {
  margin-top: 4px;
  padding: 8px 10px;
  border-radius: 12px;
  background: var(--surface-muted);
  font-size: 14px;
  color: var(--text-muted);
  white-space: pre-wrap;
  word-break: break-word;
}

.more-btn {
  margin: 2px 0 8px 22px;
  padding: 0;
  border: 0;
  background: transparent;
  font-size: 14px;
  color: var(--info);
  font-weight: 600;
}

.profile-actions {
  display: flex;
  gap: 10px;
  width: 100%;
}

.send-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex: 1;
  padding: 10px 14px;
  border-radius: 26px;
  font-size: 15px;
  font-weight: 700;
  border: 1.5px solid #178d81;
  white-space: nowrap;
}

.send-gradido {
  background: #178d81;
  color: #fff;
}

.send-email {
  background: transparent;
  color: #178d81;
}

/* The coin ships as a dark monochrome glyph; on the teal button it turns white —
   exactly how the send form flips it on its active tab. */
.send-coin {
  width: 20px;
  height: 20px;
  flex: 0 0 auto;
  filter: brightness(0) invert(1);
}

.send-mail-icon {
  width: 20px;
  height: 20px;
  flex: 0 0 auto;
}

@media (width <= 420px) {
  .profile-actions {
    flex-direction: column;
  }
}
</style>
