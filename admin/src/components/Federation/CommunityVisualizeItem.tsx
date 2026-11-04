// AI-GENERATED — not an architecture reference
import { useMutation } from '@vue/apollo-composable'
import { BCol, BFormGroup, BListGroup, BListGroupItem, BRow, vBTooltip } from 'bootstrap-vue-next'
import { formatDistanceToNow } from 'date-fns'
import { computed, defineComponent, type PropType, ref, toRefs, withDirectives } from 'vue'
import { useI18n } from 'vue-i18n'
import { EditableGroup } from '@/components/input/EditableGroup'
import { VariantIcon } from '@/components/VariantIcon'
import { useDateLocale } from '@/composables/useDateLocale'
import { useAppToast } from '@/composables/useToast'
import { updateHomeCommunity } from '@/graphql/updateHomeCommunity'
import { useAdminStore } from '@/store/useAdminStore'
import { Coordinates } from '../input/Coordinates'
import { EditableGroupableLabel } from '../input/EditableGroupableLabel'
import { FederationVisualizeItem } from './FederationVisualizeItem'

type Location = { latitude: number; longitude: number }

type FederatedCommunity = {
  id: number
  verifiedAt: string | null
  lastAnnouncedAt: string | null
}

type Community = {
  uuid?: string
  url: string
  publicKey: string
  name: string
  description: string
  foreign: boolean
  authenticatedAt?: string | null
  hieroTopicId?: string | null
  gmsApiKey?: string | null
  location?: Location | null
  createdAt?: string | null
  federatedCommunities?: FederatedCommunity[]
}

// ⚠️ `includeSecond` is no option of date-fns (that is `includeSeconds`), so it changes
// nothing. Kept as it was.
const distanceOptions = (locale: ReturnType<typeof useDateLocale>) =>
  ({
    includeSecond: true,
    addSuffix: true,
    locale,
  }) as Parameters<typeof formatDistanceToNow>[1]

export const CommunityVisualizeItem = defineComponent({
  name: 'CommunityVisualizeItem',
  props: {
    item: { type: Object as PropType<Community>, required: true },
  },
  setup(props) {
    const { item } = toRefs(props)

    const { t } = useI18n()

    const { toastSuccess, toastError } = useAppToast()
    const store = useAdminStore()

    const details = ref(false)
    const gmsApiKey = ref(item.value.gmsApiKey)
    const hieroTopicId = ref(item.value.hieroTopicId)
    const location = ref(item.value.location)
    const originalGmsApiKey = ref(item.value.gmsApiKey)
    const originalLocation = ref(item.value.location)
    const originalHieroTopicId = ref(item.value.hieroTopicId)

    const { mutate: updateHomeCommunityMutation } = useMutation(updateHomeCommunity)

    const verified = computed(() => {
      if (!item.value.federatedCommunities || item.value.federatedCommunities.length === 0) {
        return false
      }
      return item.value.federatedCommunities.some(
        (federatedCommunity) =>
          new Date(federatedCommunity.verifiedAt as string) >=
          new Date(federatedCommunity.lastAnnouncedAt as string),
      )
    })

    const icon = computed(() => (verified.value ? 'check' : 'x-circle'))
    const variant = computed(() => (verified.value ? 'success' : 'danger'))

    const lastAnnouncedAt = computed(() => {
      if (!item.value.federatedCommunities || item.value.federatedCommunities.length === 0) {
        return ''
      }
      const minDate = new Date(0)
      const lastAnnouncedAt = item.value.federatedCommunities.reduce(
        (lastAnnouncedAt, federateCommunity) => {
          if (!federateCommunity.lastAnnouncedAt) {
            return lastAnnouncedAt
          }
          const date = new Date(federateCommunity.lastAnnouncedAt)
          return date > lastAnnouncedAt ? date : lastAnnouncedAt
        },
        minDate,
      )
      if (lastAnnouncedAt !== minDate) {
        return formatDistanceToNow(lastAnnouncedAt, distanceOptions(useDateLocale()))
      }
      return ''
    })

    const createdAt = computed(() => {
      if (item.value.createdAt) {
        return formatDistanceToNow(new Date(item.value.createdAt), distanceOptions(useDateLocale()))
      }
      return ''
    })

    const isLocationChanged = computed(() => originalLocation.value !== location.value)
    const isGMSApiKeyChanged = computed(() => originalGmsApiKey.value !== gmsApiKey.value)
    const isHieroTopicIdChanged = computed(() => originalHieroTopicId.value !== hieroTopicId.value)
    const isValidLocation = computed(
      () => location.value && location.value.latitude && location.value.longitude,
    )

    const toggleDetails = () => {
      details.value = !details.value
    }

    const handleUpdateHomeCommunity = async () => {
      try {
        await updateHomeCommunityMutation({
          uuid: item.value.uuid,
          gmsApiKey: gmsApiKey.value,
          location: location.value,
          hieroTopicId: hieroTopicId.value,
        })

        if (isLocationChanged.value && isGMSApiKeyChanged.value) {
          toastSuccess(t('federation.toast_gmsApiKeyAndLocationUpdated'))
        } else if (isGMSApiKeyChanged.value) {
          toastSuccess(t('federation.toast_gmsApiKeyUpdated'))
        } else if (isLocationChanged.value) {
          toastSuccess(t('federation.toast_gmsLocationUpdated'))
        }
        if (isHieroTopicIdChanged.value) {
          toastSuccess(t('federation.toast_hieroTopicIdUpdated'))
        }
        originalLocation.value = location.value
        originalGmsApiKey.value = gmsApiKey.value
        originalHieroTopicId.value = hieroTopicId.value
      } catch (error) {
        toastError((error as Error).message)
      }
    }

    const resetHomeCommunityEditable = () => {
      location.value = originalLocation.value
      gmsApiKey.value = originalGmsApiKey.value
      hieroTopicId.value = originalHieroTopicId.value
    }

    const homeCommunity = () => (
      <EditableGroup
        allowEdit={store.moderator!.role === 'ADMIN'}
        onSave={handleUpdateHomeCommunity}
        onReset={resetHomeCommunityEditable}
      >
        {{
          view: () => [
            <div class='d-flex'>
              <p style='text-wrap: nowrap'>{t('federation.gmsApiKey')}&nbsp;</p>
              <span class='d-block' style='overflow-x: auto'>
                {gmsApiKey.value}
              </span>
            </div>,
            <div class='d-flex'>
              <p style='text-wrap: nowrap'>{t('federation.hieroTopicId')}&nbsp;</p>
              <span class='d-block' style='overflow-x: auto'>
                {hieroTopicId.value}
              </span>
            </div>,
            <BFormGroup>
              {t('federation.coordinates')}{' '}
              {isValidLocation.value ? (
                <span>
                  {t('geo-coordinates.format', {
                    latitude: location.value?.latitude,
                    longitude: location.value?.longitude,
                  })}
                </span>
              ) : null}
            </BFormGroup>,
          ],
          edit: () => [
            <EditableGroupableLabel
              v-model={gmsApiKey.value}
              label={t('federation.gmsApiKey')}
              idName='home-community-api-key'
            />,
            <EditableGroupableLabel
              v-model={hieroTopicId.value}
              label={t('federation.hieroTopicId')}
              idName='home-community-hiero-topic-id'
            />,
            <Coordinates v-model={location.value} />,
          ],
        }}
      </EditableGroup>
    )

    // On a phone every community is a card: its columns stand under each other, and a value
    // carries a small name of its own, as the head of the list stands only from 992px on.
    const phoneLabel = (label: string) => (
      <span class='d-block d-lg-none text-body-secondary small'>{label}</span>
    )

    return () => (
      <div class='community-visualize-item'>
        {/* a native click on the row, BRow hands it on as an attribute */}
        <BRow onClick={toggleDetails}>
          <BCol cols='12' lg='1'>
            {phoneLabel(t('federation.verified'))}
            <VariantIcon icon={icon.value} variant={variant.value} />
          </BCol>
          {/* An address and a key are one word each: they break anywhere rather than reach past
              the window (the page was 362px wide at 320px, measured 23.10.2026). */}
          <BCol cols='12' lg class='text-break'>
            {phoneLabel(t('federation.url'))}
            <div>
              <a href={item.value.url} target='_blank'>
                {item.value.url}
              </a>
            </div>
            <small>{`${item.value.publicKey.substring(0, 26)}…`}</small>
          </BCol>
          <BCol cols='12' lg>
            {phoneLabel(t('federation.name'))}
            {withDirectives(<span>{item.value.name}</span>, [
              [vBTooltip, `${item.value.description}`],
            ])}
          </BCol>
          <BCol cols='12' lg='2'>
            {phoneLabel(t('federation.lastAnnouncedAt'))}
            {lastAnnouncedAt.value}
          </BCol>
          <BCol cols='12' lg='2'>
            {phoneLabel(t('federation.createdAt'))}
            {createdAt.value}
          </BCol>
        </BRow>
        {details.value ? (
          <BRow class='details'>
            {/* no prop of BCol: it lands on the element */}
            <BCol {...({ colspan: '5' } as object)}>
              <BListGroup>
                {item.value.uuid ? (
                  <BListGroupItem class='text-break'>
                    {t('federation.communityUuid')}&nbsp;{item.value.uuid}
                  </BListGroupItem>
                ) : null}
                {item.value.authenticatedAt ? (
                  <BListGroupItem>
                    {t('federation.authenticatedAt')}&nbsp;{item.value.authenticatedAt}
                  </BListGroupItem>
                ) : null}
                {/* The public key is 64 characters without a break: the opened home community
                    was 698px wide at 320px (measured 23.10.2026). */}
                <BListGroupItem class='text-break'>
                  {t('federation.publicKey')}&nbsp;{item.value.publicKey}
                </BListGroupItem>
                {item.value.hieroTopicId && item.value.foreign ? (
                  <BListGroupItem class='text-break'>
                    {t('federation.hieroTopicId')}&nbsp;{item.value.hieroTopicId}
                  </BListGroupItem>
                ) : null}
                {!item.value.foreign ? <BListGroupItem>{homeCommunity()}</BListGroupItem> : null}
                <BListGroupItem>
                  <BListGroup>
                    {/* Six heads over the six cells of a federation; "API Version" stood twice,
                        and every head after it stood one cell to the right of its cell. From
                        992px on, as the head of the list. */}
                    <BRow class='d-none d-lg-flex'>
                      <BCol class='ms-1'>{t('federation.verified')}</BCol>
                      <BCol>{t('federation.apiVersion')}</BCol>
                      <BCol>{t('federation.createdAt')}</BCol>
                      <BCol>{t('federation.lastAnnouncedAt')}</BCol>
                      <BCol>{t('federation.verifiedAt')}</BCol>
                      <BCol>{t('federation.lastErrorAt')}</BCol>
                    </BRow>
                    {item.value.federatedCommunities?.map((federation) => (
                      <BListGroupItem
                        key={federation.id}
                        variant={!item.value.foreign ? 'primary' : 'warning'}
                      >
                        <FederationVisualizeItem item={federation as never} />
                      </BListGroupItem>
                    ))}
                  </BListGroup>
                </BListGroupItem>
              </BListGroup>
            </BCol>
          </BRow>
        ) : null}
      </div>
    )
  },
})
