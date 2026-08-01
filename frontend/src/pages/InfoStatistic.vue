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
        <li v-for="item in admins" :key="item.id">{{ item.firstName }} {{ item.lastName }}</li>
      </ul>
      <div class="h3">{{ $t('community.groupsAndModerators') }}</div>
      <div v-for="group in groupSections" :key="group.tag" class="mb-3">
        <div class="fw-bold">{{ group.label }}</div>
        <ul v-if="group.moderators.length" class="mb-0">
          <li v-for="item in group.moderators" :key="item.key">
            {{ item.firstName }} {{ item.lastName }}
          </li>
        </ul>
        <div v-else class="fst-italic text-muted">{{ $t('community.noModerators') }}</div>
      </div>
      <div v-if="untaggedModerators.length" class="mb-3">
        <div class="fw-bold">{{ $t('community.moderatorsUntagged') }}</div>
        <ul class="mb-0">
          <li v-for="item in untaggedModerators" :key="item.key">
            {{ item.firstName }} {{ item.lastName }}
          </li>
        </ul>
      </div>
      <div v-if="allGroupsModerators.length" class="mb-3">
        <div class="fw-bold">{{ $t('community.moderatorsAllGroups') }}</div>
        <ul class="mb-0">
          <li v-for="item in allGroupsModerators" :key="item.key">
            {{ item.firstName }} {{ item.lastName }}
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
import { groupTags as groupTagsQuery } from '@/graphql/contributions.graphql'
import { groupTagLabel } from '@/utils/groupTagLabel'
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
const { result: groupTagsResult } = useQuery(groupTagsQuery)

// A KI-Moderator is a moderator who may additionally use Crea, so both kinds belong in the
// same list — the backend applies the very same group scope to them.
const MODERATOR_ROLES = ['MODERATOR', 'MODERATOR_AI']

const admins = computed(() => itemsAdminUser.value.filter((item) => item.role === 'ADMIN'))
const moderators = computed(() =>
  itemsAdminUser.value
    .filter((item) => MODERATOR_ROLES.includes(item.role))
    .map((item, index) => ({ ...item, key: `${item.firstName}-${item.lastName}-${index}` }))
    .sort((a, b) =>
      `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`, undefined, {
        sensitivity: 'base',
      }),
    ),
)

// Group functions: moderators are listed under every group they look after, so a
// member can see whom to address. A moderator with several groups appears several times.
const groupSections = computed(() =>
  (groupTagsResult.value?.groupTags ?? []).map((groupTag) => ({
    tag: groupTag.tag,
    label: groupTagLabel(groupTag),
    moderators: moderators.value.filter((item) => item.visibleGroupTags?.includes(groupTag.tag)),
  })),
)

// Nobody has assigned them a group yet, which in practice means they look after all of them —
// that is exactly what the contribution list grants an unscoped moderator. The section
// disappears by itself once every moderator has their groups.
const allGroupsModerators = computed(() => moderators.value.filter((item) => item.seesAllGroups))

// Scoped to contributions that carry no group. Neither a group section nor a free pass, so
// they get their own heading instead of vanishing from the page. A moderator who looks
// after both some group and the ungrouped ones belongs under both headings, so this asks
// the scope directly instead of inferring it from an empty tag list.
const untaggedModerators = computed(() =>
  moderators.value.filter((item) => !item.seesAllGroups && item.seesUntagged),
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
