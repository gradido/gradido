// AI-GENERATED — not an architecture reference
import { useQuery } from '@vue/apollo-composable'
import { BPagination } from 'bootstrap-vue-next'
import { computed, defineComponent, onMounted, ref, toDisplayString, withModifiers } from 'vue'
import { useI18n } from 'vue-i18n'
import { spaces as spacesQuery } from '@/graphql/projectBranding.graphql'
import classes from './ListHumhubSpaces.module.css'

type Space = { id: number; name: string; description: string; url: string }

export const ListHumhubSpaces = defineComponent({
  name: 'ListHumhubSpaces',
  props: {
    modelValue: {
      type: Number,
      default: null,
    },
  },
  emits: ['chooseSpace'],
  setup(props, { emit }) {
    const { t } = useI18n()

    function chooseSpace(space: Space) {
      selectedSpaceId.value = space.id
      emit('chooseSpace', space)
    }

    const ITEMS_PER_PAGE = 20
    const page = ref(1)
    const selectedSpaceId = ref<number | null>(props.modelValue)
    // a refetch asks for another page and keeps the limit
    const variables: { page: number; limit?: number } = { page: page.value, limit: ITEMS_PER_PAGE }
    const { result, refetch } = useQuery(spacesQuery, variables)

    const spaces = computed<Space[]>(() => result.value?.spaces?.results || [])
    const paginationTotal = computed(() => result.value?.spaces?.pagination?.total || 0)
    const paginationPage = computed(() => result.value?.spaces?.pagination?.page || 1)

    onMounted(() => {
      if (props.modelValue) {
        if (!spaces.value.some((space) => space.id === props.modelValue)) {
          const targetPage = Math.ceil(props.modelValue / ITEMS_PER_PAGE)
          page.value = targetPage
          refetch({ page: targetPage })
        }
      }
    })

    // ⚠️ The template bound the pagination with v-model to paginationPage, a computed: writing
    // to it does nothing but a warning. Only the refetch is left of that.
    return () => (
      <div>
        <ul class={['list-unstyled list-group mb-3', classes.spaces]}>
          {spaces.value.map((space) => (
            <li
              key={space.id}
              title={space.description}
              class={[
                'list-group-item',
                'list-group-item-action',
                'd-flex',
                'justify-content-between',
                'align-items-center',
                'cursor-pointer',
                { active: space.id === selectedSpaceId.value },
              ]}
              onClick={() => chooseSpace(space)}
            >
              <div>
                <input v-model={selectedSpaceId.value} type='radio' value={space.id} class='me-2' />
                {` ${toDisplayString(space.name)}`}
              </div>
              <a
                href={space.url}
                target='_blank'
                onClick={withModifiers(() => undefined, ['stop'])}
              >
                {t('projectBranding.openSpaceInHumhub')}
              </a>
            </li>
          ))}
        </ul>
        {result.value && paginationTotal.value > ITEMS_PER_PAGE ? (
          <BPagination
            modelValue={paginationPage.value}
            onUpdate:modelValue={(value) => refetch({ page: value as number })}
            totalRows={paginationTotal.value}
            perPage={ITEMS_PER_PAGE}
            ariaControls='list-humhub-spaces'
          />
        ) : null}
      </div>
    )
  },
})
