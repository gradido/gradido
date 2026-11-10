// AI-GENERATED — not an architecture reference
import { useMutation } from '@vue/apollo-composable'
import { BDropdown, BDropdownItem } from 'bootstrap-vue-next'
import { computed, defineComponent, ref, withModifiers } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppToast } from '@/composables/useToast'
import { updateUserInfos } from '@/graphql/mutations'
import { useWalletStore } from '@/store/useWalletStore'
import './UserGMSLocationFormat.css'

type Option = { label: string; value: string }

export const UserGMSLocationFormat = defineComponent({
  name: 'UserGMSLocationFormat',
  // Optional toast overrides so the Matching page can show accuracy-specific
  // messages; Settings passes nothing and keeps the generic toast.
  props: {
    exactToast: { type: String, default: undefined },
    approximateToast: { type: String, default: undefined },
    // Off by default, so a page that says nothing keeps saving on the spot. The
    // matching page sets it: there the accuracy travels with the position and the
    // whole set reaches the server only when someone presses save.
    defer: { type: Boolean, default: false },
  },
  emits: ['gmsPublishLocation'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const store = useWalletStore()
    const { toastError, toastSuccess } = useAppToast()

    const selectedOption = ref(store.gmsPublishLocation as string | null)
    const dropdownOptions: Option[] = [
      {
        label: t('settings.GMS.publish-location.exact'),
        value: 'GMS_LOCATION_TYPE_EXACT',
      },
      {
        label: t('settings.GMS.publish-location.approximate'),
        value: 'GMS_LOCATION_TYPE_APPROXIMATE',
      },
    ]

    const selectedOptionLabel = computed(() => {
      return dropdownOptions.find((option) => option.value === selectedOption.value)?.label
    })

    const { mutate: updateUserData } = useMutation(updateUserInfos)

    const update = async (option: Option) => {
      if (option.value === selectedOption.value) {
        return
      }
      if (props.defer) {
        // Show the choice, tell the page, save nothing.
        selectedOption.value = option.value
        emit('gmsPublishLocation', option.value)
        return
      }
      try {
        await updateUserData({
          gmsPublishLocation: option.value,
        })
        const fallback = t('settings.GMS.publish-location.updated')
        toastSuccess(
          option.value === 'GMS_LOCATION_TYPE_EXACT'
            ? props.exactToast || fallback
            : props.approximateToast || fallback,
        )
        selectedOption.value = option.value
        store.setGmsPublishLocation(option.value)
        emit('gmsPublishLocation', option.value)
      } catch (error) {
        toastError((error as Error).message)
      }
    }

    return () => (
      <div class='user-gms-location-format'>
        <BDropdown text={selectedOptionLabel.value}>
          {dropdownOptions.map((option) => (
            <BDropdownItem
              key={option.value}
              // Not a prop of the item: it falls through to its button, as it did in the template.
              {...{ value: option.value }}
              onClick={withModifiers(() => update(option), ['prevent'])}
            >
              {option.label}
            </BDropdownItem>
          ))}
        </BDropdown>
      </div>
    )
  },
})
