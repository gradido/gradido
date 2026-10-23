import { mount } from '@vue/test-utils'
import {
  BButton,
  BCol,
  BForm,
  BFormGroup,
  BFormInput,
  BFormSelect,
  BFormTextarea,
  BRow,
} from 'bootstrap-vue-next'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ContributionLinkForm } from './ContributionLinkForm'

// Mock external dependencies
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key) => key,
  }),
}))

const mockMutate = vi.fn()
vi.mock('@vue/apollo-composable', () => ({
  useMutation: () => ({
    mutate: mockMutate,
  }),
}))

const mockToastError = vi.fn()
const mockToastSuccess = vi.fn()
vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({
    toastError: mockToastError,
    toastSuccess: mockToastSuccess,
  }),
}))

describe('ContributionLinkForm', () => {
  let wrapper

  const createWrapper = (props = {}) => {
    return mount(ContributionLinkForm, {
      props: {
        contributionLinkData: {},
        editContributionLink: false,
        ...props,
      },
      global: {
        mocks: {
          $t: (key) => key,
        },
        stubs: {
          BForm,
          BRow,
          BCol,
          BFormGroup,
          BFormInput,
          BFormTextarea,
          BFormSelect,
          BButton,
        },
      },
    })
  }

  const field = (name) => wrapper.find(`.test-${name}`)
  const fillIn = async (values) => {
    for (const [name, value] of Object.entries(values)) {
      await field(name).setValue(value)
    }
  }
  const submit = async () => {
    await wrapper.find('form').trigger('submit')
    await flushPromises()
  }
  const flushPromises = () => new Promise((resolve) => setTimeout(resolve))

  const validFormData = {
    validFrom: '2022-06-18',
    validTo: '2022-07-18',
    name: 'test name',
    memo: 'test memo',
    amount: '100',
  }

  beforeEach(() => {
    wrapper = createWrapper()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders the Div Element ".contribution-link-form"', () => {
    expect(wrapper.find('div.contribution-link-form').exists()).toBe(true)
  })

  describe('reset', () => {
    it('empties the fields', async () => {
      await fillIn(validFormData)
      await wrapper.find('form').trigger('reset')
      for (const name of Object.keys(validFormData)) {
        expect(field(name).element.value, name).toBe('')
      }
    })
  })

  describe('submit', () => {
    beforeEach(async () => {
      await fillIn(validFormData)
    })

    it('calls the API and toasts success message on successful submission', async () => {
      mockMutate.mockResolvedValue({
        data: {
          createContributionLink: {
            link: 'https://localhost/redeem/CL-1a2345678',
          },
        },
      })

      await submit()

      expect(mockMutate).toHaveBeenCalledWith({
        ...validFormData,
        cycle: 'ONCE',
        maxAmountPerMonth: '0',
        id: null,
      })

      expect(mockToastSuccess).toHaveBeenCalledWith('https://localhost/redeem/CL-1a2345678')
    })

    it('empties the fields, closes and asks for the list again after a submission', async () => {
      mockMutate.mockResolvedValue({
        data: { createContributionLink: { link: 'https://localhost/redeem/CL-1a2345678' } },
      })

      await submit()

      expect(field('name').element.value).toBe('')
      expect(wrapper.emitted('close-contribution-form')).toHaveLength(1)
      expect(wrapper.emitted('get-contribution-links')).toHaveLength(1)
    })

    it('toasts an error message on API error', async () => {
      mockMutate.mockRejectedValue({ message: 'OUCH!' })

      await submit()

      expect(mockToastError).toHaveBeenCalledWith('OUCH!')
      expect(wrapper.emitted('close-contribution-form')).toBeUndefined()
    })
  })

  it('shows error when validFrom is not set', async () => {
    await fillIn({ ...validFormData, validFrom: '' })
    await wrapper.find('form').trigger('reset')
    await submit()
    expect(mockToastError).toHaveBeenCalledWith('contributionLink.noStartDate')
    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('shows error when validTo is not set', async () => {
    const { validTo, ...withoutValidTo } = validFormData
    await wrapper.setProps({ contributionLinkData: { ...withoutValidTo, validTo: null } })
    await submit()
    expect(mockToastError).toHaveBeenCalledWith('contributionLink.noEndDate')
    expect(mockMutate).not.toHaveBeenCalled()
  })

  describe('editing a link', () => {
    const linkToEdit = {
      id: 7,
      name: 'Meditation',
      memo: 'Lorem ipsum',
      amount: '200',
      validFrom: '2022-04-01T00:00:00.000Z',
      validTo: '2022-08-01T00:00:00.000Z',
      cycle: 'ONCE',
      maxAmountPerMonth: '0',
    }

    beforeEach(async () => {
      wrapper = createWrapper({ editContributionLink: true })
      await wrapper.setProps({ contributionLinkData: { ...linkToEdit } })
    })

    it('shows the link, its dates without the time', () => {
      expect(field('name').element.value).toBe('Meditation')
      expect(field('validFrom').element.value).toBe('2022-04-01')
      expect(field('validTo').element.value).toBe('2022-08-01')
    })

    it('saves the change under the id of the link', async () => {
      mockMutate.mockResolvedValue({ data: { updateContributionLink: { link: 'ignored' } } })

      await submit()

      expect(mockMutate).toHaveBeenCalledWith({
        ...linkToEdit,
        validFrom: '2022-04-01',
        validTo: '2022-08-01',
        id: 7,
      })
      expect(mockToastSuccess).toHaveBeenCalledWith('contributionLink.changeSaved')
    })

    it('offers to save the change', () => {
      expect(wrapper.find('button[type="submit"]').text()).toBe('contributionLink.saveChange')
    })

    // The list hands over the row Apollo answered, and Apollo freezes it: writing the trimmed
    // dates into it threw, and both date fields stayed empty (measured in the built admin,
    // 23.10.2026). The form takes a copy.
    it('a frozen row fills the form without being written to', async () => {
      const row = Object.freeze({ ...linkToEdit, id: 8, name: 'Frozen' })
      await wrapper.setProps({ contributionLinkData: row })

      expect(field('name').element.value).toBe('Frozen')
      expect(field('validFrom').element.value).toBe('2022-04-01')
      expect(field('validTo').element.value).toBe('2022-08-01')
    })

    // The copy's second purpose, with a row that is not frozen: what is typed stays out of the
    // list's row until it is saved, and the row keeps its own dates. Writing into the row put the
    // typed name and the trimmed dates into the list before anything was saved.
    it('keeps what is typed out of the row it edits, and saves it', async () => {
      const row = { ...linkToEdit, id: 9 }
      await wrapper.setProps({ contributionLinkData: row })
      await field('name').setValue('Typed')

      expect(row).toEqual({ ...linkToEdit, id: 9 })
      mockMutate.mockResolvedValue({ data: { updateContributionLink: { link: 'ignored' } } })
      await submit()
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 9,
          name: 'Typed',
          validFrom: '2022-04-01',
          validTo: '2022-08-01',
        }),
      )
    })
  })

  // On a phone the two dates and the two cycle fields stand under each other, each in the whole
  // width; from 992px on side by side, as before. The real grid makes the classes.
  it('the date and cycle pairs stack below the boundary', () => {
    const columnOf = (element) => element.closest('.row > div')
    const cycles = wrapper.findAll('select').map((select) => columnOf(select.element))
    const dates = [field('validFrom').element, field('validTo').element].map(columnOf)
    expect(cycles).toHaveLength(2)
    for (const column of [...dates, ...cycles]) {
      expect([...column.classList].sort()).toEqual(['col-12', 'col-lg-6'])
    }
    // The form's margin: 8px on a phone, the 48px of before from 992px on.
    expect(wrapper.find('form').classes()).toEqual(expect.arrayContaining(['m-2', 'm-lg-5']))
    expect(wrapper.find('form').classes()).not.toContain('m-5')
  })

  // On a phone the buttons wrap with room between them; from 992px on the row of before.
  it('lets its buttons wrap on a phone', () => {
    const row = wrapper.find('button[type="submit"]').element.parentElement
    expect([...row.classList]).toEqual(
      expect.arrayContaining(['d-flex', 'flex-wrap', 'gap-2', 'd-lg-block']),
    )
    const buttons = [...row.querySelectorAll('button')]
    expect(buttons.map((button) => button.classList.contains('me-lg-2'))).toEqual([
      true,
      true,
      false,
    ])
    expect(buttons.some((button) => button.classList.contains('me-2'))).toBe(false)
  })

  it('offers to create a link', () => {
    expect(wrapper.find('button[type="submit"]').text()).toBe('contributionLink.create')
  })

  it('asks to be closed from its close button', async () => {
    const buttons = wrapper.findAll('button')
    await buttons[buttons.length - 1].trigger('click')
    expect(wrapper.emitted('close-contribution-form')).toHaveLength(1)
  })
})
