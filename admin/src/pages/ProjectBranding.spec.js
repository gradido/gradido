// AI-GENERATED — not an architecture reference
import { useQuery } from '@vue/apollo-composable'
import { mount } from '@vue/test-utils'
import { BButton, BCol, BListGroup, BListGroupItem, BRow } from 'bootstrap-vue-next'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { createI18n } from 'vue-i18n'
import { ProjectBrandingItem } from '@/components/ProjectBranding/ProjectBrandingItem'
import { useAppToast } from '@/composables/useToast'
import { projectBrandings as projectBrandingsQuery } from '@/graphql/projectBranding.graphql'
import { adminStore } from '../../test/adminStore'
import { ProjectBranding } from './ProjectBranding'

vi.mock('@vue/apollo-composable')
vi.mock('@/composables/useToast')

const branding = (id, name = `Branding ${id}`) => ({ id, name, alias: `alias-${id}` })

describe('ProjectBranding', () => {
  let result
  let loading
  let error
  let refetch
  const toastError = vi.fn()

  const createWrapper = (role = 'ADMIN') =>
    mount(ProjectBranding, {
      global: {
        plugins: [
          adminStore({ moderator: { role } }),
          createI18n({ legacy: false, locale: 'en', missingWarn: false, fallbackWarn: false }),
        ],
        // the template names it without an import, the build resolves it
        components: { ProjectBrandingItem },
        stubs: { BButton, BCol, BRow, BListGroup, BListGroupItem, ProjectBrandingItem: true },
      },
    })

  const items = (wrapper) => wrapper.findAllComponents({ name: 'ProjectBrandingItem' })
  const addButton = (wrapper) => wrapper.find('[data-test="project-branding-add-btn"]')
  const refreshButton = (wrapper) => wrapper.find('[data-test="project-branding-refresh-btn"]')

  beforeEach(() => {
    vi.clearAllMocks()
    result = ref({ projectBrandings: [branding(1), branding(2)] })
    loading = ref(false)
    error = ref(null)
    refetch = vi.fn()
    useQuery.mockReturnValue({ result, loading, refetch, error })
    useAppToast.mockReturnValue({ toastError })
  })

  it('asks for the brandings, always from the network', () => {
    createWrapper()
    expect(useQuery).toHaveBeenCalledWith(projectBrandingsQuery, null, {
      fetchPolicy: 'network-only',
    })
  })

  it('shows the title and the columns, with the actions for an administrator', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.h2').text()).toBe('projectBranding.title')
    expect(wrapper.findAll('.list-group > .row > div').map((column) => column.text())).toEqual([
      'name + link',
      'alias',
      'projectBranding.newUserToSpace',
      'logo',
      'actions',
    ])
    expect(wrapper.findAll('.list-group > .row > div')[2].attributes('title')).toBe(
      'projectBranding.newUserToSpaceTooltip',
    )
  })

  // The head stands from 992px on; below that an entry is a card whose values carry their own
  // small names (ProjectBrandingItem). A head may break inside a word rather than run into the
  // column beside it.
  it('the header hides below the boundary and every head may break', () => {
    const wrapper = createWrapper()
    const head = wrapper.find('.list-group > .row')
    expect(head.classes()).toEqual(expect.arrayContaining(['d-none', 'd-lg-flex']))
    expect(head.findAll(':scope > div').every((column) => column.classes('text-break'))).toBe(true)
  })

  // A symbol and nothing else.
  it('the refresh button has a name', () => {
    const button = refreshButton(createWrapper())
    expect(button.attributes('aria-label')).toBe('refresh')
    expect(button.attributes('title')).toBe('refresh')
  })

  it('lists the brandings', () => {
    const wrapper = createWrapper()
    expect(items(wrapper).map((item) => item.props('item'))).toEqual([branding(1), branding(2)])
  })

  it('lists them anew when they come again', async () => {
    const wrapper = createWrapper()
    result.value = { projectBrandings: [branding(3)] }
    await nextTick()
    expect(items(wrapper).map((item) => item.props('item'))).toEqual([branding(3)])
  })

  it('offers a moderator neither adding nor actions', () => {
    const wrapper = createWrapper('MODERATOR')
    expect(addButton(wrapper).exists()).toBe(false)
    expect(wrapper.findAll('.list-group > .row > div')).toHaveLength(4)
  })

  it('adds an empty branding, and only one at a time', async () => {
    const wrapper = createWrapper()
    expect(addButton(wrapper).attributes()).toMatchObject({
      title: 'projectBranding.addTooltip',
      'font-scale': '2',
    })
    await addButton(wrapper).trigger('click')
    expect(items(wrapper).at(-1).props('item')).toEqual({
      id: undefined,
      name: '',
      alias: '',
      description: undefined,
      spaceId: undefined,
      spaceUrl: undefined,
      newUserToSpace: false,
      logoUrl: undefined,
    })
    expect(addButton(wrapper).attributes('disabled')).toBeDefined()
  })

  it('puts a saved branding where it was', async () => {
    const wrapper = createWrapper()
    await items(wrapper)[1].vm.$emit('update:item', branding(2, 'Renamed'))
    expect(items(wrapper).map((item) => item.props('item').name)).toEqual(['Branding 1', 'Renamed'])
  })

  it('puts a saved new branding where the empty one was', async () => {
    const wrapper = createWrapper()
    await addButton(wrapper).trigger('click')
    await items(wrapper)[2].vm.$emit('update:item', branding(9))
    expect(items(wrapper).map((item) => item.props('item').id)).toEqual([1, 2, 9])
    expect(addButton(wrapper).attributes('disabled')).toBeUndefined()
  })

  it('takes a deleted branding out', async () => {
    const wrapper = createWrapper()
    await items(wrapper)[0].vm.$emit('deleted:item', 1)
    expect(items(wrapper).map((item) => item.props('item').id)).toEqual([2])
  })

  it('asks again on refresh, handing the click on, and spins while it loads', async () => {
    const wrapper = createWrapper()
    expect(refreshButton(wrapper).attributes('animation')).toBe('')
    await refreshButton(wrapper).trigger('click')
    expect(refetch).toHaveBeenCalledTimes(1)
    expect(refetch.mock.calls[0][0]).toBeInstanceOf(MouseEvent)
    loading.value = true
    await nextTick()
    expect(refreshButton(wrapper).attributes()).toMatchObject({
      animation: 'spin',
      'font-scale': '2',
    })
  })

  it('says what went wrong', async () => {
    createWrapper()
    error.value = new Error('offline')
    await nextTick()
    expect(toastError).toHaveBeenCalledWith('offline')
  })
})
