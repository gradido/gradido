// AI-GENERATED — not an architecture reference
import { BPagination } from 'bootstrap-vue-next'
import { computed, defineComponent } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePagerFit } from '@/composables/usePagerFit'
import CONFIG from '@/config'

export const PaginatorRouteParamsPage = defineComponent({
  name: 'PaginatorRouteParamsPage',
  props: {
    modelValue: {
      type: Number,
      required: true,
    },
    pageSize: {
      type: Number,
      required: false,
      // The config has no PAGE_SIZE, so this default is `undefined`, as it always was: every
      // caller hands its own page size in.
      default: (CONFIG as { PAGE_SIZE?: number }).PAGE_SIZE,
    },
    totalCount: {
      type: Number,
      required: true,
    },
    loading: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const router = useRouter()
    const route = useRoute()
    const { pagerLimit, pagerNoEnds } = usePagerFit()

    const isPaginationVisible = computed(() => {
      return (
        (props.totalCount > (props.pageSize as number) || props.modelValue > 1) && !props.loading
      )
    })
    const currentPage = computed(() => Number(route.params.page) || props.modelValue)
    const updatePage = (page: number | string) => {
      router.push({ params: { page } })
      emit('update:modelValue', page)
    }

    return () =>
      isPaginationVisible.value ? (
        <BPagination
          modelValue={currentPage.value}
          class='mt-3 flex-wrap'
          pills
          size='lg'
          perPage={props.pageSize}
          totalRows={props.totalCount}
          align='center'
          noEllipsis={true}
          limit={pagerLimit.value}
          noGotoEndButtons={pagerNoEnds.value}
          onUpdate:modelValue={updatePage}
        />
      ) : null
  },
})
