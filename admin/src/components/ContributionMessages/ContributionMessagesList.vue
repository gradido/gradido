<template>
  <div class="contribution-messages-list">
    <BListGroup>
      <BListGroupItem>
        <routerLink :to="searchLink" :title="$t('goTo.userSearch')">
          {{ contribution.user.firstName }} {{ contribution.user.lastName }}
        </routerLink>
        &nbsp;
        <a :href="mailtoLink">{{ contribution.user.emailContact.email }}</a>
        <IBiFilter id="filter-by-email" class="ms-1 pointer" @click="searchForEmail" />
        <BTooltip target="filter-by-email" triggers="hover">
          {{ $t('filter.byEmail') }}
        </BTooltip>
        &nbsp;
        {{ contribution.user.humhubUsername }}
        &nbsp;
        <span>
          <a
            v-if="humhubProfileLink"
            id="humhub-username"
            :href="humhubProfileLink"
            target="_blank"
          >
            <i-arcticons-circles class="svg-icon" />
          </a>
          <BTooltip target="humhub-username" triggers="hover">
            {{ $t('goTo.humhubProfile') }}
          </BTooltip>
        </span>
      </BListGroupItem>
      <BListGroupItem>
        {{ $t('registered') }}: {{ new Date(contribution.user.createdAt).toLocaleString() }}
      </BListGroupItem>
    </BListGroup>
    <BContainer>
      <div v-for="message in messages" :key="message.id">
        <contribution-messages-list-item
          :message="message"
          :contribution-user-id="contribution.userId"
        />
      </div>
    </BContainer>
    <div v-if="contribution.status === 'PENDING' || contribution.status === 'IN_PROGRESS'">
      <contribution-messages-formular
        :contribution-id="contribution.id"
        :contribution-memo="contribution.memo"
        :hide-resubmission="hideResubmission"
        :input-resubmission-date="resubmissionAt"
        @get-list-contribution-messages="refetch"
        @update-status="updateStatus"
        @reload-contribution="reloadContribution"
        @update-contributions="updateContributions"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useQuery } from '@vue/apollo-composable'
import { adminListContributionMessages } from '../../graphql/adminListContributionMessages.js'
import { useAppToast } from '@/composables/useToast'
import { BListGroupItem } from 'bootstrap-vue-next'
import CONFIG from '@/config'

const props = defineProps({
  contribution: {
    type: Object,
    required: true,
  },
  hideResubmission: {
    type: Boolean,
    required: true,
  },
  resubmissionAt: {
    type: String,
    required: false,
  },
})

const emit = defineEmits([
  'update-status',
  'reload-contribution',
  'update-contributions',
  'search-for-email',
])
const { toastError } = useAppToast()
const mailtoLink = computed(() => {
  return `mailto:${props.contribution.email}`
})
const searchLink = computed(() => {
  return `/user?search=${props.contribution.email}`
})
const humhubProfileLink = computed(() => {
  if (CONFIG.HUMHUB_ACTIVE !== true) {
    return undefined
  }
  let url = CONFIG.HUMHUB_API_URL
  if (url.endsWith('/')) {
    url = url.slice(0, -1)
  }
  return `${url}/u/${props.contribution.humhubUsername}`
})

const messages = ref([])

const { onResult, onError, result, refetch } = useQuery(
  adminListContributionMessages,
  {
    contributionId: props.contribution.id,
  },
  {
    fetchPolicy: 'no-cache',
  },
)

onError((error) => {
  toastError(error.message)
})

onResult(() => {
  messages.value = result.value.adminListContributionMessages.messages
})

const updateStatus = (id) => {
  emit('update-status', id)
}

const reloadContribution = (id) => {
  emit('reload-contribution', id)
}

const updateContributions = () => {
  emit('update-contributions')
}

const searchForEmail = () => {
  emit('search-for-email', props.contribution.email)
}
</script>
<style scoped>
.temp-message {
  margin-top: 50px;
}
</style>
