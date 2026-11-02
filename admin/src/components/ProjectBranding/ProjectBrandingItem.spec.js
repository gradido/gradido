// AI-GENERATED — not an architecture reference
import { useMutation } from '@vue/apollo-composable'
import { flushPromises, mount } from '@vue/test-utils'
import { BButton, BCard, BCol, BRow, createBootstrap, vBTooltip } from 'bootstrap-vue-next'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createI18n } from 'vue-i18n'
import { useAppToast } from '@/composables/useToast'
import { deleteProjectBranding, upsertProjectBranding } from '@/graphql/projectBranding.graphql'
import { adminStore } from '../../../test/adminStore'
import { ProjectBrandingItem } from './ProjectBrandingItem'

vi.mock('@vue/apollo-composable')
vi.mock('@/composables/useToast')
vi.mock('@/config', () => ({ CONFIG: { WALLET_LOGIN_URL: 'https://wallet.example/login' } }))

const branding = (overrides = {}) => ({
  id: 7,
  name: 'Gradido Garden',
  alias: 'garden',
  description: 'Where it grows',
  newUserToSpace: true,
  logoUrl: 'https://example.org/logo.png',
  ...overrides,
})

describe('ProjectBrandingItem', () => {
  let mutate
  const toastSuccess = vi.fn()
  const toastError = vi.fn()

  const createWrapper = (item = branding(), role = 'ADMIN') =>
    mount(ProjectBrandingItem, {
      props: { item },
      global: {
        plugins: [
          adminStore({ moderator: { role } }),
          createBootstrap(),
          createI18n({ legacy: false, locale: 'en', missingWarn: false, fallbackWarn: false }),
        ],
        // in the build the resolver imports it where the template names it
        directives: { 'b-tooltip': vBTooltip },
        stubs: { BRow, BCol, BButton, BCard, ProjectBrandingForm: true },
      },
    })

  const firstRow = (wrapper) => wrapper.find('.project-branding-item > .row')
  const columns = (wrapper) => wrapper.findAll('.project-branding-item > .row:first-child > div')
  const form = (wrapper) => wrapper.findComponent({ name: 'ProjectBrandingForm' })
  // The value of a column, without the small name a phone shows above it (`d-lg-none`).
  const valueIn = (column) => {
    const label = column.find('.d-lg-none')
    return label.exists() ? column.text().slice(label.text().length).trim() : column.text()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mutate = vi.fn()
    useMutation.mockReturnValue({ mutate })
    useAppToast.mockReturnValue({ toastSuccess, toastError })
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue() } })
  })

  it('shows the branding in a row titled with its description', () => {
    const wrapper = createWrapper()
    expect(firstRow(wrapper).attributes('title')).toBe('Where it grows')
    expect(columns(wrapper)[0].text()).toContain('Gradido Garden')
    expect(columns(wrapper)[0].text()).toContain('https://wallet.example/login?project=garden')
    expect(valueIn(columns(wrapper)[1])).toBe('garden')
    expect(columns(wrapper)[2].find('span:not(.d-lg-none)').classes()).toEqual(['text-success'])
    expect(wrapper.find('img').attributes()).toMatchObject({
      class: 'img-fluid',
      src: 'https://example.org/logo.png',
      alt: 'https://example.org/logo.png',
    })
  })

  it('shows a branding without new members to the space as such', () => {
    const wrapper = createWrapper(branding({ newUserToSpace: false }))
    expect(columns(wrapper)[2].find('span:not(.d-lg-none)').classes()).toEqual(['text-danger'])
  })

  it('offers no link and no copy without an alias', () => {
    const wrapper = createWrapper(branding({ alias: '' }))
    expect(columns(wrapper)[0].text()).toBe('Gradido Garden')
    expect(columns(wrapper)[0].find('button').exists()).toBe(false)
  })

  it('names the buttons in their tooltips', () => {
    const buttons = createWrapper().findAll('button')
    expect(buttons.map((button) => button.attributes('data-original-title'))).toEqual([
      'copy-to-clipboard',
      'delete',
    ])
  })

  // The tooltip takes the `title` away, and left the two symbols without a name.
  it('the buttons have names', () => {
    const buttons = createWrapper().findAll('button')
    expect(buttons.map((button) => button.attributes('aria-label'))).toEqual([
      'copy-to-clipboard',
      'delete',
    ])
    expect(buttons.every((button) => button.text() === '')).toBe(true)
  })

  // On a phone an entry is a card: every column takes the whole width, and a value carries a
  // small name of its own; from 992px on the columns of before, under the head of the list.
  it('every value carries its small label below the boundary', () => {
    const wrapper = createWrapper()
    const label = (column) => column.find('.d-lg-none')
    expect(columns(wrapper).map((column) => column.classes().sort())).toEqual([
      ['col-12', 'col-lg-3', 'text-break'],
      ['col-12', 'col-lg-2', 'text-break'],
      ['col-12', 'col-lg-2'],
      ['col-12', 'col-lg-3', 'me-lg-2'],
      ['col-12', 'col-lg-1'],
    ])
    expect(
      columns(wrapper).map((column) => (label(column).exists() ? label(column).text() : null)),
    ).toEqual([null, 'alias', 'projectBranding.newUserToSpace', 'logo', null])
    for (const column of columns(wrapper).filter((c) => label(c).exists())) {
      expect(label(column).classes().sort()).toEqual(
        ['d-block', 'd-lg-none', 'small', 'text-body-secondary'].sort(),
      )
      // ... before the value.
      expect(column.element.firstElementChild).toBe(label(column).element)
    }
  })

  it('copies the link without opening the details', async () => {
    const wrapper = createWrapper()
    await columns(wrapper)[0].find('button').trigger('click')
    await flushPromises()
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'https://wallet.example/login?project=garden',
    )
    expect(toastSuccess).toHaveBeenCalledWith('copied-to-clipboard')
    expect(wrapper.find('.details').exists()).toBe(false)
  })

  it('says why the link could not be copied', async () => {
    navigator.clipboard.writeText.mockRejectedValue(new Error('denied'))
    const wrapper = createWrapper()
    await columns(wrapper)[0].find('button').trigger('click')
    await flushPromises()
    expect(toastError).toHaveBeenCalledWith('denied')
  })

  it('opens and closes the details for an administrator', async () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.details').exists()).toBe(false)
    await firstRow(wrapper).trigger('click')
    expect(form(wrapper).props('modelValue')).toEqual(branding())
    await firstRow(wrapper).trigger('click')
    expect(wrapper.find('.details').exists()).toBe(false)
  })

  it('opens nothing and offers no delete for a moderator', async () => {
    const wrapper = createWrapper(branding(), 'MODERATOR')
    await firstRow(wrapper).trigger('click')
    expect(wrapper.find('.details').exists()).toBe(false)
    expect(columns(wrapper)).toHaveLength(4)
  })

  it('shows a new branding open', () => {
    expect(
      createWrapper(branding({ id: undefined }), 'MODERATOR')
        .find('.details')
        .exists(),
    ).toBe(true)
  })

  it('deletes the branding without opening the details', async () => {
    mutate.mockResolvedValue({})
    const wrapper = createWrapper()
    await columns(wrapper)[4].find('button').trigger('click')
    await flushPromises()
    expect(useMutation).toHaveBeenCalledWith(deleteProjectBranding)
    expect(mutate).toHaveBeenCalledWith({ id: 7 })
    expect(wrapper.emitted('deleted:item')).toEqual([[7]])
    expect(wrapper.find('.details').exists()).toBe(false)
  })

  it('saves a changed branding, says so and closes', async () => {
    mutate.mockResolvedValue({ data: { upsertProjectBranding: branding({ name: 'Saved' }) } })
    const wrapper = createWrapper()
    await firstRow(wrapper).trigger('click')
    await form(wrapper).vm.$emit('update:modelValue', branding({ name: 'Changed' }))
    await flushPromises()
    expect(useMutation).toHaveBeenCalledWith(upsertProjectBranding)
    expect(mutate).toHaveBeenCalledWith({ input: branding({ name: 'Changed' }) })
    expect(wrapper.emitted('update:item')).toEqual([[branding({ name: 'Saved' })]])
    expect(toastSuccess).toHaveBeenCalledWith('projectBranding.updated')
    expect(wrapper.find('.details').exists()).toBe(false)
  })

  it('says a new branding was created', async () => {
    mutate.mockResolvedValue({ data: { upsertProjectBranding: branding() } })
    const wrapper = createWrapper(branding({ id: undefined }))
    await form(wrapper).vm.$emit('update:modelValue', branding({ id: undefined }))
    await flushPromises()
    expect(toastSuccess).toHaveBeenCalledWith('projectBranding.created')
  })

  it('says why a branding could not be saved', async () => {
    mutate.mockRejectedValue(new Error('taken'))
    const wrapper = createWrapper()
    await firstRow(wrapper).trigger('click')
    await form(wrapper).vm.$emit('update:modelValue', branding())
    await flushPromises()
    expect(toastError).toHaveBeenCalledWith('projectBranding.error')
    expect(wrapper.find('.details').exists()).toBe(true)
  })
})
