<template>
  <div class="community-switch">
    <div v-if="!validCommunityIdentifier">
      <BDropdown no-flip :text="modelValue?.name">
        <BDropdownItem
          v-for="community in communities"
          :key="community.id"
          :title="community.description"
          :active="modelValue?.uuid === community.uuid"
          @click.prevent="updateCommunity(community)"
        >
          {{ community.name }}
        </BDropdownItem>
      </BDropdown>
    </div>
    <div v-else class="mb-4 mt-2">
      <BRow>
        <BCol class="font-weight-bold" :title="modelValue.description">{{ modelValue.name }}</BCol>
      </BRow>
    </div>
  </div>
</template>
<!--<script>-->
<!--import { selectCommunities } from '@/graphql/queries'-->

<!--export default {-->
<!--  name: 'CommunitySwitch',-->
<!--  props: {-->
<!--    value: {-->
<!--      type: Object,-->
<!--    },-->
<!--  },-->
<!--  data() {-->
<!--    return {-->
<!--      communities: [],-->
<!--      validCommunityIdentifier: false,-->
<!--    }-->
<!--  },-->
<!--  methods: {-->
<!--    updateCommunity(community) {-->
<!--      this.$emit('input', community)-->
<!--    },-->
<!--    setDefaultCommunity() {-->
<!--      // when we already get an identifier via url we choose this if the community exist-->
<!--      if (this.communityIdentifier && this.communities.length >= 1) {-->
<!--        const foundCommunity = this.communities.find((community) => {-->
<!--          if (-->
<!--            community.uuid === this.communityIdentifier ||-->
<!--            community.name === this.communityIdentifier-->
<!--          ) {-->
<!--            this.validCommunityIdentifier = true-->
<!--            return true-->
<!--          }-->
<!--          return false-->
<!--        })-->
<!--        if (foundCommunity) {-->
<!--          this.updateCommunity(foundCommunity)-->
<!--          return-->
<!--        }-->
<!--        this.toastError('invalid community identifier in url')-->
<!--      }-->
<!--      if (this.validCommunityIdentifier && !this.communityIdentifier) {-->
<!--        this.validCommunityIdentifier = false-->
<!--      }-->
<!--      // set default community, the only one which isn't foreign-->
<!--      // we assume it is only one entry with foreign = false-->
<!--      if (this.value.uuid === '' && this.communities.length) {-->
<!--        const foundCommunity = this.communities.find((community) => !community.foreign)-->
<!--        if (foundCommunity) {-->
<!--          this.updateCommunity(foundCommunity)-->
<!--        }-->
<!--      }-->
<!--    },-->
<!--  },-->
<!--  apollo: {-->
<!--    communities: {-->
<!--      query: selectCommunities,-->
<!--    },-->
<!--  },-->
<!--  computed: {-->
<!--    communityIdentifier() {-->
<!--      return this.$route.params && this.$route.params.communityIdentifier-->
<!--    },-->
<!--  },-->
<!--  updated() {-->
<!--    this.setDefaultCommunity()-->
<!--  },-->
<!--  mounted() {-->
<!--    this.setDefaultCommunity()-->
<!--  },-->
<!--}-->
<!--</script>-->

<script setup>
import { ref, computed, watch, onMounted, onUpdated } from 'vue'
import { useQuery } from '@vue/apollo-composable'
import { useRoute } from 'vue-router'
import { selectCommunities } from '@/graphql/queries'
import { useAppToast } from '@/composables/useToast'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['update:modelValue'])

const route = useRoute()
const { toastError } = useAppToast()

const communities = ref([])
const validCommunityIdentifier = ref(false)

const { result, onResult } = useQuery(selectCommunities)

onResult(({ data }) => {
  if (data) {
    communities.value = data.communities
    setDefaultCommunity()
  }
})

const communityIdentifier = computed(() => route.params.communityIdentifier)

function updateCommunity(community) {
  emit('update:model-value', community)
}

function setDefaultCommunity() {
  if (communityIdentifier.value && communities.value.length >= 1) {
    const foundCommunity = communities.value.find((community) => {
      if (
        community.uuid === communityIdentifier.value ||
        community.name === communityIdentifier.value
      ) {
        validCommunityIdentifier.value = true
        return true
      }
      return false
    })
    if (foundCommunity) {
      updateCommunity(foundCommunity)
      return
    }
    toastError('invalid community identifier in url')
  }

  if (validCommunityIdentifier.value && !communityIdentifier.value) {
    validCommunityIdentifier.value = false
  }

  if (props.modelValue?.uuid === '' && communities.value.length) {
    const foundCommunity = communities.value.find((community) => !community.foreign)
    if (foundCommunity) {
      updateCommunity(foundCommunity)
    }
  }
}

onMounted(setDefaultCommunity)
onUpdated(setDefaultCommunity)
</script>

<style scoped lang="scss">
.community-switch {
  :deep(button) {
    background-color: $secondary;
  }
}
</style>
