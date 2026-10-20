import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { CreationFormular } from './CreationFormular'

const mocks = vi.hoisted(() => ({
  mutate: vi.fn(),
  refetch: vi.fn(),
  useQuery: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
  openCreationsPlus: vi.fn(),
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key) => key,
  }),
}))

vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({
    toastError: mocks.toastError,
    toastSuccess: mocks.toastSuccess,
  }),
}))

vi.mock('@vue/apollo-composable', () => ({
  useMutation: () => ({
    mutate: mocks.mutate,
  }),
  useQuery: (...args) => {
    mocks.useQuery(...args)
    return { refetch: mocks.refetch }
  },
}))

vi.mock('@/store/useAdminStore', () => ({
  useAdminStore: () => ({
    openCreationsPlus: mocks.openCreationsPlus,
  }),
}))

vi.mock('../composables/useCreationMonths', () => ({
  useCreationMonths: () => ({
    creationDateObjects: ref([
      { short: 'Jan', year: '2024', date: '2024-01-01' },
      { short: 'Feb', year: '2024', date: '2024-02-01' },
    ]),
  }),
}))

const item = { userId: 7, email: 'bob@baumeister.de' }

describe('CreationFormular', () => {
  let wrapper

  const mountFormular = (props = {}) =>
    mount(CreationFormular, {
      global: {
        mocks: {
          $t: (key) => key,
        },
      },
      props: {
        pagetype: '',
        item,
        items: [],
        creationUserData: {},
        creation: [100, 200],
        ...props,
      },
    })

  const textarea = () => wrapper.find('#textarea-state')
  const submitButton = () => wrapper.find('.test-submit')
  const selectJanuary = async () => {
    await wrapper.findAll('input[type="radio"]')[0].setValue()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    wrapper = mountFormular()
  })

  it('renders correctly', () => {
    expect(wrapper.find('.component-creation-formular').exists()).toBe(true)
  })

  it('asks for the open creations of the member', () => {
    expect(mocks.useQuery).toHaveBeenCalledWith(expect.anything(), { userId: 7 })
  })

  it('initializes with default values', () => {
    expect(textarea().element.value).toBe('')
    expect(wrapper.find('input[type="number"]').exists()).toBe(false)
    expect(wrapper.findAll('input[type="radio"]').some((radio) => radio.element.checked)).toBe(
      false,
    )
  })

  it('takes memo and amount of the user data it is handed', () => {
    wrapper = mountFormular({ creationUserData: { memo: 'a memo of ten', amount: 30 } })
    expect(textarea().element.value).toBe('a memo of ten')
  })

  it('offers the months with what is left of each', () => {
    const labels = wrapper.findAll('.form-check-label').map((label) => label.text())
    expect(labels).toEqual(['Jan 100 GDD', 'Feb 200 GDD'])
  })

  it('handles month selection', async () => {
    await selectJanuary()
    expect(textarea().element.value).toBe('creation_form.creation_for Jan 2024')
    const amount = wrapper.find('input[type="number"]')
    expect(amount.attributes('max')).toBe('100')
    expect(amount.attributes('min')).toBe('0')
    expect(wrapper.find('input[type="range"]').attributes('max')).toBe('100')
  })

  it('disables submit button when form is invalid', () => {
    expect(submitButton().attributes('disabled')).toBeDefined()
  })

  it('keeps submit disabled while the amount is zero', async () => {
    await selectJanuary()
    expect(submitButton().attributes('disabled')).toBeDefined()
  })

  it('keeps submit disabled while the memo is shorter than ten characters', async () => {
    await selectJanuary()
    await wrapper.find('input[type="number"]').setValue('50')
    await textarea().setValue('too short')
    expect(submitButton().attributes('disabled')).toBeDefined()
  })

  it('enables submit button when form is valid', async () => {
    await selectJanuary()
    await wrapper.find('input[type="number"]').setValue('50')
    expect(submitButton().attributes('disabled')).toBeUndefined()
  })

  it('resets form on reset button click', async () => {
    await selectJanuary()
    await wrapper.find('input[type="number"]').setValue('50')
    await wrapper.find('button[type="reset"]').trigger('click')
    expect(textarea().element.value).toBe('')
    expect(wrapper.find('input[type="number"]').exists()).toBe(false)
    expect(wrapper.findAll('input[type="radio"]').some((radio) => radio.element.checked)).toBe(
      false,
    )
  })

  it('displays different button text based on pagetype', async () => {
    await wrapper.setProps({ pagetype: 'PageCreationConfirm' })
    expect(submitButton().text()).toBe('creation_form.update_creation')

    await wrapper.setProps({ pagetype: '' })
    expect(submitButton().text()).toBe('creation_form.submit_creation')
  })

  describe('submitting', () => {
    beforeEach(async () => {
      await selectJanuary()
      await wrapper.find('input[type="number"]').setValue('50')
    })

    it('creates the contribution, tells the table and resets', async () => {
      mocks.mutate.mockResolvedValueOnce({ data: { adminCreateContribution: [1, 2, 3] } })
      await submitButton().trigger('click')
      await flushPromises()
      expect(mocks.mutate).toHaveBeenCalledWith({
        email: 'bob@baumeister.de',
        creationDate: '2024-01-01',
        amount: '50',
        memo: 'creation_form.creation_for Jan 2024',
      })
      expect(wrapper.emitted('update-user-data')).toEqual([[item, [1, 2, 3]]])
      expect(mocks.openCreationsPlus).toHaveBeenCalledWith(1)
      expect(mocks.toastSuccess).toHaveBeenCalledWith('creation_form.toasted')
      expect(mocks.refetch).toHaveBeenCalled()
      expect(textarea().element.value).toBe('')
      expect(submitButton().attributes('disabled')).toBeDefined()
    })

    it('names a project account that may not create', async () => {
      mocks.mutate.mockRejectedValueOnce(new Error('GraphQL error: CREATION_NOT_ALLOWED'))
      await submitButton().trigger('click')
      await flushPromises()
      expect(mocks.toastError).toHaveBeenCalledWith('creation_form.not_allowed')
      expect(mocks.refetch).toHaveBeenCalled()
      expect(textarea().element.value).toBe('')
    })

    it('shows any other failure as it comes', async () => {
      mocks.mutate.mockRejectedValueOnce(new Error('Ouch'))
      await submitButton().trigger('click')
      await flushPromises()
      expect(mocks.toastError).toHaveBeenCalledWith('Ouch')
      expect(wrapper.emitted('update-user-data')).toBeUndefined()
    })
  })

  it('offers submitCreation to its parent', () => {
    expect(typeof wrapper.vm.submitCreation).toBe('function')
  })
})
