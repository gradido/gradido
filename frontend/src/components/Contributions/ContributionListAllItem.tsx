// AI-GENERATED — not an architecture reference
import { BAvatar, BCol, BRow, type ColorVariant } from 'bootstrap-vue-next'
import { computed, defineComponent, type PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ContributionEditItem } from '@/components/Contributions/ContributionEdit'
import type { CreationGroup } from '@/components/Contributions/ContributionListItem'
import VariantIcon from '@/components/VariantIcon.vue'
import { useContributionStatus } from '@/composables/useContributionStatus'
import { useFilters } from '@/composables/useFilters'
import { GDD_PER_HOUR } from '@/constants'
import { creationGroupLabels } from '@/utils/creationGroupLabel'
import classes from './ContributionListItem.module.scss'

/** A row of `listAllContributions`: a deed and its number, never its author. */
export type ContributionAllRow = ContributionEditItem & {
  creationGroups: CreationGroup[]
  updatedBy: number | null
  contributionStatus: string
}

/**
 * A contribution in the community list.
 *
 * Data protection: the community list shows deeds, not people. The submitter is not even
 * loaded in the backend; each contribution is identified by its number, which only its
 * author can connect to themselves — and only if they choose to.
 */
export const ContributionListAllItem = defineComponent({
  name: 'ContributionListAllItem',
  props: {
    id: { type: Number, required: true },
    amount: { type: String, required: true },
    memo: { type: String, required: true },
    contributionDate: { type: String, required: true },
    updatedBy: { type: Number as PropType<number | null>, default: 0 },
    contributionStatus: { type: String, default: '' },
    creationGroups: { type: Array as PropType<CreationGroup[]>, default: () => [] },
  },
  setup(props) {
    const { t, d } = useI18n()
    const { GDD } = useFilters()

    // Group functions: the contribution's group takes the place of the old, unhelpful
    // "contribution text" heading. Several groups are listed one after another.
    const groupLabel = computed(() => creationGroupLabels(props.creationGroups))

    const { getVariant, getIcon } = useContributionStatus()
    const variant = computed(() => getVariant(props.contributionStatus))
    const icon = computed(() => getIcon(props.contributionStatus))

    const hours = computed(() => parseFloat((Number(props.amount) / GDD_PER_HOUR).toFixed(2)))

    return () => (
      <div>
        <div
          class={[
            'contribution-list-item',
            classes['contribution-list-item'],
            'bg-white app-box-shadow gradido-border-radius pt-3 px-3',
          ]}
        >
          <BRow>
            <BCol cols='3' lg='2' md='2'>
              <BAvatar rounded='lg' variant={variant.value as ColorVariant} size='4.55em'>
                <VariantIcon icon={icon.value} variant='white' />
              </BAvatar>
            </BCol>
            <BCol>
              <div class='me-3 small text-muted' data-test='contribution-number'>
                {t('contribution.number', { number: props.id })}
              </div>
              <div class='small'>{d(new Date(props.contributionDate), 'short')}</div>
              <div class='mt-3 fw-bold'>
                {groupLabel.value ? (
                  <span>{groupLabel.value}</span>
                ) : (
                  <span class='fw-normal fst-italic text-muted'>
                    {t('contribution.creationGroup.none')}
                  </span>
                )}
              </div>
              <div class='mb-3 text-break word-break'>{props.memo}</div>
              {(props.updatedBy ?? 0) > 0 ? (
                <div class='mt-2 mb-2 small'>{t('moderatorChangedMemo')}</div>
              ) : null}
            </BCol>
            <BCol cols='9' md='3' lg='3' offset='3' offsetMd='0' offsetLg='0'>
              <div class='small'>
                {`${t('creation')} ${t('(')}${hours.value} ${t('h')}${t(')')}`}
              </div>
              {props.contributionStatus === 'DENIED' ? (
                <div class='fw-bold'>
                  <VariantIcon icon='x-circle' variant='danger' /> {t('contribution.alert.denied')}
                </div>
              ) : null}
              {/* No DELETED branch: a deleted contribution is soft-removed and never reaches
                  this list (loadAllContributions queries without withDeleted). */}
              <div class='fw-bold'>{GDD(props.amount)}</div>
            </BCol>
            <BCol cols='12' md='1' lg='1' class='text-end align-items-center' />
          </BRow>
          <div class='pb-3' />
        </div>
      </div>
    )
  },
})
