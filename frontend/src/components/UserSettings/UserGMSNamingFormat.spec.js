import { mount } from '@vue/test-utils'
import UserGMSNamingFormat from './UserGMSNamingFormat.vue'
import { toastErrorSpy } from '@test/testSetup'

const mockAPIcall = jest.fn()

const storeCommitMock = jest.fn()

const localVue = global.localVue

describe('UserGMSNamingFormat', () => {
  let wrapper
  beforeEach(() => {
    wrapper = mount(UserGMSNamingFormat, {
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
        selectedOption: 'GMS_PUBLISH_NAME_ALIAS_OR_INITALS',
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
      'settings.GMS.publish-name.alias-or-initials',
      'settings.GMS.publish-name.initials',
      'settings.GMS.publish-name.first',
      'settings.GMS.publish-name.first-initial',
      'settings.GMS.publish-name.name-full',
    ])
  })

  it('updates selected option on click', async () => {
    const dropdownItem = wrapper.findAll('.dropdown-item').at(3) // Click the fourth item
    await dropdownItem.trigger('click')

    expect(wrapper.emitted().gmsPublishName).toBeTruthy()
    expect(wrapper.emitted().gmsPublishName.length).toBe(1)
    expect(wrapper.emitted().gmsPublishName[0]).toEqual(['GMS_PUBLISH_NAME_FIRST_INITIAL'])
  })

  it('does not update when clicking on already selected option', async () => {
    const dropdownItem = wrapper.findAll('.dropdown-item').at(0) // Click the first item (which is already selected)
    await dropdownItem.trigger('click')

    expect(wrapper.emitted().gmsPublishName).toBeFalsy()
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
