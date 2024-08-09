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
      <div class="h3">{{ $t('community.moderators') }}</div>
      <ul>
        <li v-for="item in moderators" :key="item.id">{{ item.firstName }} {{ item.lastName }}</li>
      </ul>

      <hr />

      <div class="h3">{{ $t('contact') }}</div>
      <BLink :href="`mailto:${supportMail}`">{{ supportMail }}</BLink>
    </BContainer>
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuery } from '@vue/apollo-composable'
import CONFIG from '@/config'
import { listContributionLinks, searchAdminUsers } from '@/graphql/queries'
import { useAppToast } from '../composables/useToast'

const emit = defineEmits(['update-transactions'])

const { toastError } = useAppToast()

const count = ref(null)
const countAdminUser = ref(null)
const itemsContributionLinks = ref([])
const itemsAdminUser = ref([])
const supportMail = CONFIG.COMMUNITY_SUPPORT_MAIL

const admins = computed(() => itemsAdminUser.value.filter((item) => item.role === 'ADMIN'))
const moderators = computed(() => itemsAdminUser.value.filter((item) => item.role === 'MODERATOR'))

const { onResult: onContributionLinksResult, onError: onContributionLinksError } = useQuery(
  listContributionLinks,
)
const { onResult: onAdminUsersResult, onError: onAdminUsersError } = useQuery(searchAdminUsers)

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

const updateTransactions = (pagination) => {
  emit('update-transactions', pagination)
}

onMounted(() => {
  updateTransactions(0)
})
</script>
