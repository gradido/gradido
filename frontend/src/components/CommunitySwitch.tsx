// AI-GENERATED — not an architecture reference
import { useQuery } from '@vue/apollo-composable'
import { BCol, BDropdown, BDropdownItem, BRow } from 'bootstrap-vue-next'
import { computed, defineComponent, onMounted, type PropType, ref, watch, withModifiers } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useAppToast } from '@/composables/useToast'
import { reachableCommunities } from '@/graphql/communities.graphql'

/** A community as the server lists it (reachableCommunities), or the placeholder before that. */
export type SwitchCommunity = {
  id?: number
  uuid?: string
  name?: string
  description?: string
  url?: string
  foreign?: boolean
}

export const CommunitySwitch = defineComponent({
  name: 'CommunitySwitch',
  props: {
    modelValue: {
      type: Object as PropType<SwitchCommunity>,
      default: () => ({}),
    },
    communityIdentifier: {
      type: String,
      default: '',
    },
  },
  // The choice is emitted as `update:model-value`, as it always was: Vue finds the listener of
  // `update:modelValue` for it, and the specs read the emitted name. Both are declared, so that
  // the name that is emitted is one the component knows.
  emits: ['update:modelValue', 'update:model-value', 'communitiesLoaded'],
  setup(props, { emit }) {
    const route = useRoute()
    const { t } = useI18n()
    const { toastError } = useAppToast()

    const communities = ref<SwitchCommunity[]>([])
    const validCommunityIdentifier = ref(false)

    const { onResult } = useQuery(reachableCommunities)

    onResult(({ data }) => {
      // console.log('CommunitySwitch.onResult...data=', data)
      if (data) {
        communities.value = data.reachableCommunities
        setDefaultCommunity()
        if (data.reachableCommunities.length === 1) {
          validCommunityIdentifier.value = true
        }
        emit('communitiesLoaded', data.reachableCommunities)
      }
    })

    const communityIdentifier = computed(
      () => route.params.communityIdentifier || props.communityIdentifier,
    )

    watch(
      () => communityIdentifier.value,
      () => {
        // console.log('CommunitySwitch.communityIdentifier.value', value)
        setDefaultCommunity()
      },
    )

    function updateCommunity(community: SwitchCommunity) {
      // console.log('CommunitySwitch.updateCommunity...community=', community)
      emit('update:model-value', community)
    }

    function setDefaultCommunity() {
      // console.log(
      //   'CommunitySwitch.setDefaultCommunity... communityIdentifier= communities=',
      //   communityIdentifier,
      //   communities,
      // )
      if (communityIdentifier.value && communities.value.length >= 1) {
        // console.log(
        //   'CommunitySwitch.setDefaultCommunity... communities.value.length=',
        //   communities.value.length,
        // )
        const foundCommunity = communities.value.find((community) => {
          // console.log('CommunitySwitch.setDefaultCommunity... community=', community)
          if (
            community.uuid === communityIdentifier.value ||
            community.name === communityIdentifier.value
          ) {
            validCommunityIdentifier.value = true
            // console.log(
            //   'CommunitySwitch.setDefaultCommunity...true validCommunityIdentifier=',
            //   validCommunityIdentifier,
            // )
            return true
          }
          // console.log(
          //   'CommunitySwitch.setDefaultCommunity...false validCommunityIdentifier=',
          //   validCommunityIdentifier,
          // )
          return false
        })
        if (foundCommunity) {
          // console.log('CommunitySwitch.setDefaultCommunity...foundCommunity=', foundCommunity)
          updateCommunity(foundCommunity)
          return
        }
        toastError(t('form.community-not-reachable'))
      }

      if (validCommunityIdentifier.value && !communityIdentifier.value) {
        validCommunityIdentifier.value = false
        // console.log(
        //   'CommunitySwitch.setDefaultCommunity...validCommunityIdentifier=',
        //   validCommunityIdentifier,
        // )
      }

      if (props.modelValue?.uuid === '' && communities.value.length) {
        // console.log(
        //   'CommunitySwitch.setDefaultCommunity...props.modelValue= communities=',
        //   props.modelValue,
        //   communities.value.length,
        // )
        const foundCommunity = communities.value.find((community) => !community.foreign)
        // console.log('CommunitySwitch.setDefaultCommunity...foundCommunity=', foundCommunity)
        if (foundCommunity) {
          updateCommunity(foundCommunity)
        }
      }
    }

    onMounted(setDefaultCommunity)

    return () => (
      <div class='community-switch'>
        {!validCommunityIdentifier.value ? (
          <div>
            <BDropdown noFlip text={props.modelValue?.name}>
              {communities.value.map((community) => (
                <BDropdownItem
                  key={community.id}
                  title={community.description}
                  active={props.modelValue?.uuid === community.uuid}
                  onClick={withModifiers(() => updateCommunity(community), ['prevent'])}
                >
                  {community.name}
                </BDropdownItem>
              ))}
            </BDropdown>
          </div>
        ) : (
          <div class='mb-4 mt-2'>
            <BRow>
              <BCol class='fw-bold' title={props.modelValue.description}>
                {props.modelValue.name}
              </BCol>
            </BRow>
          </div>
        )}
      </div>
    )
  },
})
