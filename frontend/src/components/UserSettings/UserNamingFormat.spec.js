import { mount } from '@vue/test-utils'
import UserNamingFormat from './UserNamingFormat.vue'
import { toastErrorSpy } from '@test/testSetup'

const mockAPIcall = jest.fn()

const storeCommitMock = jest.fn()

const localVue = global.localVue

describe('UserNamingFormat', () => {
  let wrapper
  beforeEach(() => {
    wrapper = mount(UserNamingFormat, {
      mocks: {
        $t: (key) => key, // Mocking the translation function
        $store: {
          state: {
            gmsPublishName: null,
          },
          commit: storeCommitMock,
        },
        $apollo: {
          mutate: mockAPIcall,
        },
      },
      localVue,
      propsData: {
        selectedOption: 'PUBLISH_NAME_ALIAS_OR_INITALS',
        initialValue: 'PUBLISH_NAME_ALIAS_OR_INITALS',
        attrName: 'gmsPublishName',
        successMessage: 'success message',
      },
    })
  })

  afterEach(() => {
    wrapper.destroy()
  })

  it('renders the correct dropdown options', () => {
    const dropdownItems = wrapper.findAll('.dropdown-item')
    expect(dropdownItems.length).toBe(5)

    const labels = dropdownItems.wrappers.map((item) => item.text())
    expect(labels).toEqual([
      'settings.publish-name.alias-or-initials',
      'settings.publish-name.initials',
      'settings.publish-name.first',
      'settings.publish-name.first-initial',
      'settings.publish-name.name-full',
    ])
  })

  it('updates selected option on click', async () => {
    const dropdownItem = wrapper.findAll('.dropdown-item').at(3) // Click the fourth item
    await dropdownItem.trigger('click')

    expect(wrapper.emitted().valueChanged).toBeTruthy()
    expect(wrapper.emitted().valueChanged.length).toBe(1)
    expect(wrapper.emitted().valueChanged[0]).toEqual(['PUBLISH_NAME_FIRST_INITIAL'])
  })

  it('does not update when clicking on already selected option', async () => {
    const dropdownItem = wrapper.findAll('.dropdown-item').at(0) // Click the first item (which is already selected)
    await dropdownItem.trigger('click')

    expect(wrapper.emitted().valueChanged).toBeFalsy()
  })

  describe('update with error', () => {
    beforeEach(async () => {
      mockAPIcall.mockRejectedValue({
        message: 'Ouch',
      })
      const dropdownItem = wrapper.findAll('.dropdown-item').at(2) // Click the third item
      await dropdownItem.trigger('click')
    })

    it('toasts an error message', () => {
      expect(toastErrorSpy).toBeCalledWith('Ouch')
    })
  })
})
