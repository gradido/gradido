import { mount } from '@vue/test-utils'
import UserGMSLocationFormat from './UserGMSLocationFormat.vue'
import { toastErrorSpy } from '@test/testSetup'

const mockAPIcall = jest.fn()

const storeCommitMock = jest.fn()

const localVue = global.localVue

describe('UserGMSLocationFormat', () => {
  let wrapper
  beforeEach(() => {
    wrapper = mount(UserGMSLocationFormat, {
      mocks: {
        $t: (key) => key, // Mocking the translation function
        $store: {
          state: {
            gmsPublishLocation: null,
          },
          commit: storeCommitMock,
        },
        $apollo: {
          mutate: mockAPIcall,
        },
      },
      localVue,
      propsData: {
        selectedOption: 'GMS_LOCATION_TYPE_RANDOM',
      },
    })
  })

  afterEach(() => {
    wrapper.destroy()
  })

  it('renders the correct dropdown options', () => {
    const dropdownItems = wrapper.findAll('.dropdown-item')
    expect(dropdownItems.length).toBe(3)

    const labels = dropdownItems.wrappers.map((item) => item.text())
    expect(labels).toEqual([
      'settings.GMS.publish-location.exact',
      'settings.GMS.publish-location.approximate',
      'settings.GMS.publish-location.random',
    ])
  })

  it('updates selected option on click', async () => {
    const dropdownItem = wrapper.findAll('.dropdown-item').at(1) // Click the second item
    await dropdownItem.trigger('click')

    expect(wrapper.emitted().gmsPublishLocation).toBeTruthy()
    expect(wrapper.emitted().gmsPublishLocation.length).toBe(1)
    expect(wrapper.emitted().gmsPublishLocation[0]).toEqual(['GMS_LOCATION_TYPE_APPROXIMATE'])
  })

  it('does not update when clicking on already selected option', async () => {
    const dropdownItem = wrapper.findAll('.dropdown-item').at(2) // Click the third item (which is already selected)
    await dropdownItem.trigger('click')

    expect(wrapper.emitted().gmsPublishLocation).toBeFalsy()
  })

  describe('update with error', () => {
    beforeEach(async () => {
      mockAPIcall.mockRejectedValue({
        message: 'Ouch',
      })
      const dropdownItem = wrapper.findAll('.dropdown-item').at(1) // Click the second item
      await dropdownItem.trigger('click')
    })

    it('toasts an error message', () => {
      expect(toastErrorSpy).toBeCalledWith('Ouch')
    })
  })
})
