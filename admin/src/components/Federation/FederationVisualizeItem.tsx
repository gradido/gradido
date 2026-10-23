// AI-GENERATED — not an architecture reference
import { BCol, BRow, vBTooltip } from 'bootstrap-vue-next'
import { formatDistanceToNow } from 'date-fns'
import { computed, defineComponent, type PropType, withDirectives } from 'vue'
import { useI18n } from 'vue-i18n'
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
    const { t } = useI18n()
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

    // On a phone the six cells stand under each other, each with a small name of its own, as
    // the head above them stands only from 992px on (CommunityVisualizeItem).
    const phoneLabel = (label: string) => (
      <span class='d-block d-lg-none text-body-secondary small'>{label}</span>
    )

    return () => (
      <div class='federation-visualize-item'>
        <BRow>
          <BCol cols='12' lg>
            {phoneLabel(t('federation.verified'))}
            <VariantIcon icon={icon.value} variant={variant.value} />
          </BCol>
          <BCol cols='12' lg class='ml-1'>
            {phoneLabel(t('federation.apiVersion'))}
            {item().apiVersion}
          </BCol>
          <BCol cols='12' lg>
            {phoneLabel(t('federation.createdAt'))}
            {dateWithTooltip(item().createdAt)}
          </BCol>
          <BCol cols='12' lg>
            {phoneLabel(t('federation.lastAnnouncedAt'))}
            {dateWithTooltip(item().lastAnnouncedAt)}
          </BCol>
          <BCol cols='12' lg>
            {phoneLabel(t('federation.verifiedAt'))}
            {dateWithTooltip(item().verifiedAt)}
          </BCol>
          <BCol cols='12' lg>
            {phoneLabel(t('federation.lastErrorAt'))}
            {dateWithTooltip(item().lastErrorAt)}
          </BCol>
        </BRow>
      </div>
    )
  },
})
