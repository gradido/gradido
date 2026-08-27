<template>
  <div class="info-statistic">
    <BContainer class="bg-white app-box-shadow gradido-border-radius p-4 mt--3">
      <div>{{ $t('communityInfo') }}</div>
      <div class="h3">
        {{ CONFIG.COMMUNITY_DESCRIPTION }}
      </div>
      <div>
        <BLink :href="CONFIG.COMMUNITY_URL">
          {{ CONFIG.COMMUNITY_URL }}
        </BLink>
      </div>
      <hr />
      <div class="h3">{{ $t('community.admins') }}</div>
      <ul>
        <li v-for="item in admins" :key="item.key">{{ item.alias }}</li>
      </ul>
      <div class="h3">{{ $t('community.groupsAndModerators') }}</div>
      <div v-for="group in groupSections" :key="group.tag" class="mb-3">
        <div class="fw-bold">{{ group.label }}</div>
        <ul v-if="group.moderators.length" class="mb-0">
          <li v-for="item in group.moderators" :key="item.key">
            {{ item.alias }}
          </li>
        </ul>
        <div v-else class="fst-italic text-muted">{{ $t('community.noModerators') }}</div>
      </div>
      <div v-if="untaggedModerators.length" class="mb-3">
        <div class="fw-bold">{{ $t('community.moderatorsUntagged') }}</div>
        <ul class="mb-0">
          <li v-for="item in untaggedModerators" :key="item.key">
            {{ item.alias }}
          </li>
        </ul>
      </div>
      <div v-if="allGroupsModerators.length" class="mb-3">
        <div class="fw-bold">{{ $t('community.moderatorsAllGroups') }}</div>
        <ul class="mb-0">
          <li v-for="item in allGroupsModerators" :key="item.key">
            {{ item.alias }}
          </li>
        </ul>
      </div>

      <hr />

      <div class="h3">{{ $t('contact') }}</div>
      <BLink :href="`mailto:${supportMail}`">{{ supportMail }}</BLink>
    </BContainer>
  </div>
</template>
<script setup>
import { ref, computed } from 'vue'
import { useQuery } from '@vue/apollo-composable'
import CONFIG from '@/config'
import { listContributionLinks, searchAdminUsers } from '@/graphql/queries'
import { creationGroups as creationGroupsQuery } from '@/graphql/contributions.graphql'
import { creationGroupLabel } from '@/utils/creationGroupLabel'
import { useAppToast } from '../composables/useToast'

const { toastError } = useAppToast()

const count = ref(null)
const countAdminUser = ref(null)
const itemsContributionLinks = ref([])
const itemsAdminUser = ref([])
const supportMail = CONFIG.COMMUNITY_SUPPORT_MAIL

const { onResult: onContributionLinksResult, onError: onContributionLinksError } =
  useQuery(listContributionLinks)
const { onResult: onAdminUsersResult, onError: onAdminUsersError } = useQuery(searchAdminUsers, {
  pageSize: 100,
  currentPage: 1,
  order: 'ASC',
})
const { result: creationGroupsResult } = useQuery(creationGroupsQuery)

// A KI-Moderator is a moderator who may additionally use Crea, so both kinds belong in the
// same list — the backend applies the very same group scope to them.
const MODERATOR_ROLES = ['MODERATOR', 'MODERATOR_AI']

// Listed and sorted by alias (NU-021): the real name is not delivered to this page any
// more. The alias is unique per community, so it also serves as the list key.
const byAlias = (a, b) =>
  (a.alias ?? '').localeCompare(b.alias ?? '', undefined, { sensitivity: 'base' })

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
const groupSections = computed(() =>
  (creationGroupsResult.value?.creationGroups ?? []).map((creationGroup) => ({
    tag: creationGroup.tag,
    label: creationGroupLabel(creationGroup),
    moderators: moderators.value.filter((item) =>
      item.visibleCreationGroups?.includes(creationGroup.tag),
    ),
  })),
)

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

onContributionLinksResult(({ data }) => {
  if (data) {
    count.value = data.listContributionLinks.count
    itemsContributionLinks.value = data.listContributionLinks.links
  }
})

onAdminUsersResult(({ data }) => {
  if (data) {
    countAdminUser.value = data.searchAdminUsers.userCount
    itemsAdminUser.value = data.searchAdminUsers.userList
  }
})

onContributionLinksError(() => {
  toastError('listContributionLinks has no result, use default data')
})

onAdminUsersError(() => {
  toastError('searchAdminUsers has no result, use default data')
})
</script>
