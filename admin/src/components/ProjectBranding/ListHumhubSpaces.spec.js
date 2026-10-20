// AI-GENERATED — not an architecture reference
import { useQuery } from '@vue/apollo-composable'
import { mount } from '@vue/test-utils'
import { BPagination } from 'bootstrap-vue-next'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { spaces as spacesQuery } from '@/graphql/projectBranding.graphql'
import { ListHumhubSpaces } from './ListHumhubSpaces'

vi.mock('@vue/apollo-composable')
vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key) => key }),
}))

const space = (id) => ({
  id,
  name: `Space ${id}`,
  description: `About space ${id}`,
  url: `https://humhub.example/s/${id}`,
})

describe('ListHumhubSpaces', () => {
  let result
  let refetch

  const answer = (spaces, total = spaces.length, page = 1) => ({
    spaces: { results: spaces, pagination: { total, page } },
  })

  const createWrapper = (props = {}) =>
    mount(ListHumhubSpaces, {
      props,
      global: {
        mocks: { $t: (key) => key },
        stubs: { BPagination },
      },
    })

  beforeEach(() => {
    vi.clearAllMocks()
    result = ref(answer([space(1), space(2)]))
    refetch = vi.fn()
    useQuery.mockReturnValue({ result, refetch })
  })

  it('asks for the first page of twenty spaces', () => {
    createWrapper()
    expect(useQuery).toHaveBeenCalledWith(spacesQuery, { page: 1, limit: 20 })
  })

  it('lists the spaces with their description and a link into HumHub', () => {
    const wrapper = createWrapper()
    const items = wrapper.findAll('li')
    expect(items.map((item) => item.text())).toEqual([
      'Space 1projectBranding.openSpaceInHumhub',
      'Space 2projectBranding.openSpaceInHumhub',
    ])
    expect(items[0].attributes('title')).toBe('About space 1')
    expect(items[0].find('a').attributes()).toMatchObject({
      href: 'https://humhub.example/s/1',
      target: '_blank',
    })
    expect(items[0].classes()).toEqual(
      expect.arrayContaining([
        'list-group-item',
        'list-group-item-action',
        'd-flex',
        'justify-content-between',
        'align-items-center',
        'cursor-pointer',
      ]),
    )
  })

  it('marks the space it is given as chosen', () => {
    const wrapper = createWrapper({ modelValue: 2 })
    const items = wrapper.findAll('li')
    expect(items.map((item) => item.classes().includes('active'))).toEqual([false, true])
    expect(items.map((item) => item.find('input').element.checked)).toEqual([false, true])
  })

  it('chooses a space that is clicked, and says which', async () => {
    const wrapper = createWrapper({ modelValue: 2 })
    await wrapper.findAll('li')[0].trigger('click')
    expect(wrapper.emitted('chooseSpace')).toEqual([[space(1)]])
    expect(wrapper.findAll('li').map((item) => item.classes().includes('active'))).toEqual([
      true,
      false,
    ])
    expect(wrapper.findAll('input').map((input) => input.element.checked)).toEqual([true, false])
  })

  it('chooses a space whose radio button is clicked', async () => {
    const wrapper = createWrapper()
    await wrapper.findAll('input')[1].setValue(true)
    await wrapper.findAll('input')[1].trigger('click')
    expect(wrapper.emitted('chooseSpace')).toEqual([[space(2)]])
    expect(wrapper.findAll('li')[1].classes()).toContain('active')
  })

  it('does not choose a space when its link is followed', async () => {
    const wrapper = createWrapper()
    await wrapper.findAll('a')[0].trigger('click')
    expect(wrapper.emitted('chooseSpace')).toBeUndefined()
  })

  it('pages only when there are more than twenty spaces', () => {
    expect(createWrapper().findComponent(BPagination).exists()).toBe(false)
    result.value = answer([space(1)], 45, 2)
    const pagination = createWrapper().findComponent(BPagination)
    expect(pagination.props()).toMatchObject({ modelValue: 2, totalRows: 45, perPage: 20 })
    expect(pagination.props('ariaControls')).toBe('list-humhub-spaces')
  })

  it('asks for the page that is paged to', async () => {
    result.value = answer([space(1)], 45)
    const wrapper = createWrapper()
    await wrapper.findComponent(BPagination).vm.$emit('update:modelValue', 3)
    expect(refetch).toHaveBeenCalledWith({ page: 3 })
  })

  it('asks for the page of the space it is given when that is not on the first one', () => {
    createWrapper({ modelValue: 45 })
    expect(refetch).toHaveBeenCalledWith({ page: 3 })
  })

  it('asks for nothing more when the space it is given is listed', () => {
    createWrapper({ modelValue: 2 })
    expect(refetch).not.toHaveBeenCalled()
  })
})
