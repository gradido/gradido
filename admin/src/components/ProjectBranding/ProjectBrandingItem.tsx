// AI-GENERATED — not an architecture reference
import { useMutation } from '@vue/apollo-composable'
import { BButton, BCard, BCol, BRow, vBTooltip } from 'bootstrap-vue-next'
import {
  computed,
  defineComponent,
  type PropType,
  ref,
  toDisplayString,
  toRefs,
  withDirectives,
  withModifiers,
} from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppToast } from '@/composables/useToast'
import { CONFIG } from '@/config'
import { deleteProjectBranding, upsertProjectBranding } from '@/graphql/projectBranding.graphql'
import { useAdminStore } from '@/store/useAdminStore'
import IBiCheck from '~icons/bi/check'
import IBiCopy from '~icons/bi/copy'
import IBiTrash from '~icons/bi/trash'
import IBiX from '~icons/bi/x'
import { ProjectBrandingForm } from './ProjectBrandingForm'

type ProjectBranding = {
  id?: number
  name: string
  alias?: string
  description?: string
  newUserToSpace?: boolean
  logoUrl?: string
}

export const ProjectBrandingItem = defineComponent({
  name: 'ProjectBrandingItem',
  props: {
    item: { type: Object as PropType<ProjectBranding>, required: true },
  },
  emits: ['update:item', 'deleted:item'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const store = useAdminStore()
    const { toastSuccess, toastError } = useAppToast()

    const { item } = toRefs(props)
    const details = ref(false)

    const frontendLoginUrl = computed(() => {
      if (item.value.alias && item.value.alias.length > 0) {
        return `${CONFIG.WALLET_LOGIN_URL}?project=${item.value.alias}`
      }
      return undefined
    })

    async function copyToClipboard(text: string) {
      try {
        await navigator.clipboard.writeText(text)
        toastSuccess(t('copied-to-clipboard'))
      } catch (err) {
        toastError((err as Error).message)
      }
    }

    function toggleDetails() {
      if (store.moderator!.role === 'ADMIN') {
        details.value = !details.value
      }
    }

    function update(form: ProjectBranding) {
      const { mutate } = useMutation(upsertProjectBranding)

      mutate({
        input: { ...form },
      })
        .then((answer) => {
          const { data } = answer!
          emit('update:item', data.upsertProjectBranding)
          if (form.id) {
            toastSuccess(t('projectBranding.updated'))
          } else {
            toastSuccess(t('projectBranding.created'))
          }
          details.value = false
        })
        .catch((error) => {
          toastError(t('projectBranding.error', { message: error.message }))
        })
    }
    function deleteItem() {
      const { mutate } = useMutation(deleteProjectBranding)

      mutate({
        id: item.value.id,
      }).then(() => {
        emit('deleted:item', item.value.id)
      })
    }

    const hoverTooltip = [vBTooltip, undefined, undefined, { hover: true }] as const

    // On a phone every entry is a card: its columns stand under each other, and a value carries
    // a small name of its own, as the head of the list stands only from 992px on. The tooltip
    // takes a button's `title` away (vBTooltip), so a button carries its name as `aria-label`.
    const phoneLabel = (label: string) => (
      <span class='d-block d-lg-none text-body-secondary small'>{label}</span>
    )

    return () => (
      <div class='project-branding-item'>
        <BRow
          // no prop and no event of BRow: both land on the element
          title={item.value.description}
          onClick={toggleDetails}
        >
          <BCol cols='12' lg='3' class='text-break'>
            {`${toDisplayString(item.value.name)} `}
            <br />
            {` ${toDisplayString(frontendLoginUrl.value)} `}
            {frontendLoginUrl.value
              ? withDirectives(
                  <BButton
                    variant='secondary'
                    title={t('copy-to-clipboard')}
                    aria-label={t('copy-to-clipboard')}
                    onClick={withModifiers(
                      () => copyToClipboard(frontendLoginUrl.value as string),
                      ['stop'],
                    )}
                  >
                    <IBiCopy />
                  </BButton>,
                  [[...hoverTooltip]],
                )
              : null}
          </BCol>
          <BCol cols='12' lg='2' class='text-break'>
            {phoneLabel(t('alias'))}
            {item.value.alias}
          </BCol>
          <BCol cols='12' lg='2'>
            {phoneLabel(t('projectBranding.newUserToSpace'))}
            {item.value.newUserToSpace ? (
              <span class='text-success'>
                <IBiCheck />
              </span>
            ) : (
              <span class='text-danger'>
                <IBiX />
              </span>
            )}
          </BCol>
          <BCol cols='12' lg='3' class='me-lg-2'>
            {phoneLabel(t('logo'))}
            <img class='img-fluid' src={item.value.logoUrl} alt={item.value.logoUrl} />
          </BCol>
          {store.moderator!.role === 'ADMIN' ? (
            <BCol cols='12' lg='1'>
              {withDirectives(
                <BButton
                  variant='danger'
                  title={t('delete')}
                  aria-label={t('delete')}
                  onClick={withModifiers(deleteItem, ['stop'])}
                >
                  <IBiTrash />
                </BButton>,
                [[...hoverTooltip]],
              )}
            </BCol>
          ) : null}
        </BRow>
        {details.value || item.value.id === undefined ? (
          <BRow class='details'>
            {/* no prop of BCol: it lands on the element */}
            <BCol {...({ colspan: '5' } as object)}>
              <BCard>
                <ProjectBrandingForm
                  modelValue={item.value}
                  onUpdate:modelValue={(form: ProjectBranding) => update(form)}
                />
              </BCard>
            </BCol>
          </BRow>
        ) : null}
      </div>
    )
  },
})
