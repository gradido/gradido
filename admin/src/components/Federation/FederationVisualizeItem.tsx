// AI-GENERATED — not an architecture reference
import { BCol, BRow, vBTooltip } from 'bootstrap-vue-next'
import { formatDistanceToNow } from 'date-fns'
import { computed, defineComponent, type PropType, withDirectives } from 'vue'
import { VariantIcon } from '@/components/VariantIcon'
import { useDateLocale } from '@/composables/useDateLocale'

type FederatedCommunity = {
  apiVersion: string
  createdAt: string | null
  lastAnnouncedAt: string | null
  verifiedAt: string | null
  lastErrorAt: string | null
}

export const FederationVisualizeItem = defineComponent({
  name: 'FederationVisualizeItem',
  props: {
    item: { type: Object as PropType<FederatedCommunity> },
  },
  setup(props) {
    const item = () => props.item as FederatedCommunity

    const verified = computed(
      () => new Date(item().verifiedAt as string) >= new Date(item().lastAnnouncedAt as string),
    )
    const icon = computed(() => (verified.value ? 'check' : 'x-circle'))
    const variant = computed(() => (verified.value ? 'success' : 'danger'))

    // ⚠️ `includeSecond` is no option of date-fns (that is `includeSeconds`), so it changes
    // nothing. Kept as it was.
    const distanceDate = (dateString: string | null) =>
      dateString
        ? formatDistanceToNow(new Date(dateString), {
            includeSecond: true,
            addSuffix: true,
            locale: useDateLocale(),
          } as Parameters<typeof formatDistanceToNow>[1])
        : ''

    const dateWithTooltip = (dateString: string | null) =>
      withDirectives(<span>{distanceDate(dateString)}</span>, [[vBTooltip, `${dateString}`]])

    return () => (
      <div class='federation-visualize-item'>
        <BRow>
          <BCol>
            <VariantIcon icon={icon.value} variant={variant.value} />
          </BCol>
          <BCol class='ml-1'>{item().apiVersion}</BCol>
          <BCol>{dateWithTooltip(item().createdAt)}</BCol>
          <BCol>{dateWithTooltip(item().lastAnnouncedAt)}</BCol>
          <BCol>{dateWithTooltip(item().verifiedAt)}</BCol>
          <BCol>{dateWithTooltip(item().lastErrorAt)}</BCol>
        </BRow>
      </div>
    )
  },
})
