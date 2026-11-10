// AI-GENERATED — not an architecture reference
import { useQuery } from '@vue/apollo-composable'
import { BContainer, BLink } from 'bootstrap-vue-next'
import { computed, defineComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppToast } from '@/composables/useToast'
import CONFIG from '@/config'
import { creationGroups as creationGroupsQuery } from '@/graphql/contributions.graphql'
import { listContributionLinks, searchAdminUsers } from '@/graphql/queries'
import { creationGroupLabel } from '@/utils/creationGroupLabel'

/** A creation group as creationGroups lists it: the tag it is filed under, and its name. */
type CreationGroup = { tag: string; name: string | null }

/** A row of searchAdminUsers, as this page reads it: the alias, never the real name (NU-021). */
type AdminUser = {
  alias: string | null
  role: string
  visibleCreationGroups?: string[]
  seesAllCreationGroups: boolean
  seesUntagged: boolean
}

// A KI-Moderator is a moderator who may additionally use Crea, so both kinds belong in the
// same list — the backend applies the very same group scope to them.
const MODERATOR_ROLES = ['MODERATOR', 'MODERATOR_AI']

// Listed and sorted by alias (NU-021): the real name is not delivered to this page any
// more. The alias is unique per community, so it also serves as the list key.
const byAlias = (a: AdminUser, b: AdminUser) =>
  (a.alias ?? '').localeCompare(b.alias ?? '', undefined, { sensitivity: 'base' })

/** The community's page of facts: its address, who administers and moderates it, its support. */
export const InfoStatistic = defineComponent({
  name: 'InfoStatistic',
  setup() {
    const { t } = useI18n()
    const { toastError } = useAppToast()

    const itemsAdminUser = ref<AdminUser[]>([])
    const supportMail = CONFIG.COMMUNITY_SUPPORT_MAIL

    const { onError: onContributionLinksError } = useQuery(listContributionLinks)
    const { onResult: onAdminUsersResult, onError: onAdminUsersError } = useQuery(
      searchAdminUsers,
      {
        pageSize: 100,
        currentPage: 1,
        order: 'ASC',
      },
    )
    const { result: creationGroupsResult } = useQuery(creationGroupsQuery)

    const admins = computed(() =>
      itemsAdminUser.value
        .filter((item) => item.role === 'ADMIN')
        .map((item, index) => ({ ...item, key: `${item.alias}-${index}` }))
        .sort(byAlias),
    )
    const moderators = computed(() =>
      itemsAdminUser.value
        .filter((item) => MODERATOR_ROLES.includes(item.role))
        .map((item, index) => ({ ...item, key: `${item.alias}-${index}` }))
        .sort(byAlias),
    )

    // Group functions: moderators are listed under every group they look after, so a
    // member can see whom to address. A moderator with several groups appears several times.
    const groupSections = computed(() => {
      const groups: CreationGroup[] = creationGroupsResult.value?.creationGroups ?? []
      return groups.map((creationGroup) => ({
        tag: creationGroup.tag,
        label: creationGroupLabel(creationGroup),
        moderators: moderators.value.filter((item) =>
          item.visibleCreationGroups?.includes(creationGroup.tag),
        ),
      }))
    })

    // Nobody has assigned them a group yet, which in practice means they look after all of them —
    // that is exactly what the contribution list grants an unscoped moderator. The section
    // disappears by itself once every moderator has their groups.
    const allGroupsModerators = computed(() =>
      moderators.value.filter((item) => item.seesAllCreationGroups),
    )

    // Scoped to contributions that carry no group. Neither a group section nor a free pass, so
    // they get their own heading instead of vanishing from the page. A moderator who looks
    // after both some group and the ungrouped ones belongs under both headings, so this asks
    // the scope directly instead of inferring it from an empty tag list.
    const untaggedModerators = computed(() =>
      moderators.value.filter((item) => !item.seesAllCreationGroups && item.seesUntagged),
    )

    onAdminUsersResult(({ data }) => {
      if (data) {
        itemsAdminUser.value = data.searchAdminUsers.userList
      }
    })

    onContributionLinksError(() => {
      toastError('listContributionLinks has no result, use default data')
    })

    onAdminUsersError(() => {
      toastError('searchAdminUsers has no result, use default data')
    })

    const names = (items: { key: string; alias: string | null }[]) =>
      items.map((item) => <li key={item.key}>{item.alias}</li>)

    return () => (
      <div class='info-statistic'>
        <BContainer class='bg-white app-box-shadow gradido-border-radius p-4 mt--3'>
          <div>{t('communityInfo')}</div>
          <div class='h3'>{CONFIG.COMMUNITY_DESCRIPTION}</div>
          <div>
            <BLink href={CONFIG.COMMUNITY_URL}>{CONFIG.COMMUNITY_URL}</BLink>
          </div>
          <hr />
          <div class='h3'>{t('community.admins')}</div>
          <ul>{names(admins.value)}</ul>
          <div class='h3'>{t('community.groupsAndModerators')}</div>
          {groupSections.value.map((group) => (
            <div key={group.tag} class='mb-3'>
              <div class='fw-bold'>{group.label}</div>
              {group.moderators.length ? (
                <ul class='mb-0'>{names(group.moderators)}</ul>
              ) : (
                <div class='fst-italic text-muted'>{t('community.noModerators')}</div>
              )}
            </div>
          ))}
          {untaggedModerators.value.length ? (
            <div class='mb-3'>
              <div class='fw-bold'>{t('community.moderatorsUntagged')}</div>
              <ul class='mb-0'>{names(untaggedModerators.value)}</ul>
            </div>
          ) : null}
          {allGroupsModerators.value.length ? (
            <div class='mb-3'>
              <div class='fw-bold'>{t('community.moderatorsAllGroups')}</div>
              <ul class='mb-0'>{names(allGroupsModerators.value)}</ul>
            </div>
          ) : null}

          <hr />

          <div class='h3'>{t('contact')}</div>
          <BLink href={`mailto:${supportMail}`}>{supportMail}</BLink>
        </BContainer>
      </div>
    )
  },
})
