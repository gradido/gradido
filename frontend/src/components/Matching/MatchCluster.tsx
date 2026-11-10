// AI-GENERATED — not an architecture reference
import { defineComponent, type PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import { CHANNELS, LABEL_COLORS } from '@/components/Matching/displayCore'
import IBiXLg from '~icons/bi/x-lg'
import classes from './MatchCluster.module.scss'

type Channel = keyof typeof LABEL_COLORS
const CHANNEL_KEYS = CHANNELS as Channel[]

/** One of the people on the point: { match, stages, peak } — the map's own shape. */
export type ClusterPerson = {
  match: {
    uuid: string
    name: string
    community: { name: string }
    channels?: Partial<Record<Channel, { strength?: number | null; summary: string }[]>>
  }
  stages?: Partial<Record<Channel, number>>
  peak?: number
}

export const MatchCluster = defineComponent({
  name: 'MatchCluster',
  props: {
    // Each item is { match, stages, peak } — the map's own shape, already sorted by
    // fit by the parent. Distance is left out on purpose: on one point it says nothing.
    people: { type: Array as PropType<ClusterPerson[]>, default: () => [] },
  },
  emits: ['open', 'close'],
  setup(props, { emit }) {
    const { t } = useI18n()

    /** The matched channels of a person, in the fixed heart-first order. */
    function dotsFor(item: ClusterPerson) {
      return CHANNEL_KEYS.filter((channel) => (item.stages?.[channel] || 0) >= 1)
    }

    /** The single strongest matched entry across the channels → its line. */
    function lineFor(item: ClusterPerson) {
      let best: { strength?: number | null; summary: string } | null = null
      let bestChannel: Channel | null = null
      for (const channel of CHANNEL_KEYS) {
        if ((item.stages?.[channel] || 0) < 1) {
          continue
        }
        for (const entry of item.match.channels?.[channel] || []) {
          if (entry.strength == null) {
            continue
          }
          if (!best || entry.strength > (best.strength as number)) {
            best = entry
            bestChannel = channel
          }
        }
      }
      if (!best) {
        return ''
      }
      return t(`matching.list.line.${bestChannel}`, { thing: best.summary })
    }

    return () => (
      <div
        class={['cluster-cover', classes['cluster-cover']]}
        role='dialog'
        aria-modal='true'
        aria-label={t('matching.cluster.title', { n: props.people.length })}
      >
        <button
          type='button'
          class='cluster-close'
          aria-label={t('matching.cluster.close')}
          onClick={() => emit('close')}
        >
          <IBiXLg />
        </button>
        <h3 class='cluster-head'>{t('matching.cluster.title', { n: props.people.length })}</h3>
        <ul class='cluster-rows'>
          {props.people.map((item) => (
            <li key={item.match.uuid}>
              <button type='button' class='cluster-row' onClick={() => emit('open', item.match)}>
                <span class='cluster-dots' aria-hidden='true'>
                  {dotsFor(item).map((channel) => (
                    <span
                      key={channel}
                      class='cluster-dot'
                      style={{ background: LABEL_COLORS[channel] }}
                    />
                  ))}
                </span>
                <span class='cluster-body'>
                  <span class='cluster-name-row'>
                    <span class='cluster-name'>{item.match.name}</span>
                    <span class='cluster-sep' aria-hidden='true' />
                    <span class='cluster-community'>{item.match.community.name}</span>
                  </span>
                  <span class='cluster-line'>{lineFor(item)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    )
  },
})
