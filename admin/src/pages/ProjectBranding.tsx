// AI-GENERATED — not an architecture reference
import { useQuery } from '@vue/apollo-composable'
import { BButton, BCol, BListGroup, BListGroupItem, BRow } from 'bootstrap-vue-next'
import { computed, defineComponent, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ProjectBrandingItem } from '@/components/ProjectBranding/ProjectBrandingItem'
import { useAppToast } from '@/composables/useToast'
import { projectBrandings as projectBrandingsQuery } from '@/graphql/projectBranding.graphql'
import { useAdminStore } from '@/store/useAdminStore'
import IBiArrowClockwise from '~icons/bi/arrow-clockwise'
import IBiPlus from '~icons/bi/plus'

type Branding = { id?: number; name: string } & Record<string, unknown>

export const ProjectBranding = defineComponent({
  name: 'ProjectBranding',
  setup() {
    const { t } = useI18n()
    const { toastError } = useAppToast()
    const store = useAdminStore()

    const { result, loading, refetch, error } = useQuery(projectBrandingsQuery, null, {
      fetchPolicy: 'network-only',
    })

    const projectBrandings = ref<Branding[]>([])

    const isAddButtonDisabled = computed(() => {
      return projectBrandings.value.some((item) => item.id === undefined)
    })

    watch(
      result,
      () => {
        // A list of its own: entries are added to and taken out of it below, and the one Apollo
        // Client 3 answers with is frozen.
        projectBrandings.value = [...(result.value?.projectBrandings || [])]
      },
      { immediate: true },
    )

    function createEntry() {
      projectBrandings.value.push({
        id: undefined,
        name: '',
        alias: '',
        description: undefined,
        spaceId: undefined,
        spaceUrl: undefined,
        newUserToSpace: false,
        logoUrl: undefined,
      })
    }

    function handleUpdateItem(updatedItem: Branding) {
      const index = projectBrandings.value.findIndex(
        (item) => item.id === updatedItem.id || item.id === undefined,
      )
      projectBrandings.value.splice(index, 1, updatedItem)
    }

    function handleDeleteItem(id: number) {
      const index = projectBrandings.value.findIndex((item) => item.id === id)
      projectBrandings.value.splice(index, 1)
    }

    watch(error, () => {
      if (error.value) {
        toastError(error.value.message)
      }
    })

    const animation = computed(() => (loading.value ? 'spin' : ''))

    return () => (
      <div class='project-branding'>
        <div class='d-flex justify-content-between align-items-center mb-3'>
          <span class='h2'>{t('projectBranding.title')}</span>
          <div>
            {store.moderator!.role === 'ADMIN' ? (
              <BButton
                variant='primary'
                data-test='project-branding-add-btn'
                // no props of BButton: they land on the element
                {...{ 'font-scale': '2' }}
                title={t('projectBranding.addTooltip')}
                class='me-3'
                disabled={isAddButtonDisabled.value}
                onClick={createEntry}
              >
                <IBiPlus />
              </BButton>
            ) : null}
            <BButton
              {...{ animation: animation.value, 'font-scale': '2' }}
              data-test='project-branding-refresh-btn'
              // A symbol and nothing else: the name is all a screen reader has of it.
              title={t('refresh')}
              aria-label={t('refresh')}
              // ⚠️ The click event is what refetch receives as its variables, as before.
              onClick={refetch as unknown as (event: MouseEvent) => void}
            >
              <IBiArrowClockwise />
            </BButton>
          </div>
        </div>
        <BListGroup>
          {/* The heads of the columns, from 992px on. Below that every entry is a card whose
              values carry a small name of their own (ProjectBrandingItem): at 320px "Benutzer
              hinzufügen?" stood in a column 52px wide and ran into the next one (measured
              23.10.2026). A head may break inside a word rather than do that, should one word of
              it be wider than its column. */}
          <BRow class='d-none d-lg-flex'>
            <BCol cols='3' class='ms-1 text-break'>
              {t('name')} + {t('link')}
            </BCol>
            <BCol cols='2' class='text-break'>
              {t('alias')}
            </BCol>
            <BCol cols='2' class='text-break' title={t('projectBranding.newUserToSpaceTooltip')}>
              {t('projectBranding.newUserToSpace')}
            </BCol>
            <BCol cols='3' class='text-break'>
              {t('logo')}
            </BCol>
            {store.moderator!.role === 'ADMIN' ? (
              <BCol cols='1' class='text-break'>
                {t('actions')}
              </BCol>
            ) : null}
          </BRow>
          {projectBrandings.value.map((item) => (
            <BListGroupItem key={item.id}>
              <ProjectBrandingItem
                item={item}
                onUpdate:item={handleUpdateItem}
                onDeleted:item={handleDeleteItem}
              />
            </BListGroupItem>
          ))}
        </BListGroup>
      </div>
    )
  },
})
