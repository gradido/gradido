import { createMockClient } from 'mock-apollo-client'
import { mount } from '@vue/test-utils'
import VueApollo from 'vue-apollo'
import Vuex from 'vuex'
import CommunityVisualizeItem from './CommunityVisualizeItem.vue'
import { updateHomeCommunity } from '../../graphql/updateHomeCommunity'
import { toastSuccessSpy } from '../../../test/testSetup'
import { vi, describe, expect, beforeEach, it } from 'vitest'

const mockClient = createMockClient()
const apolloProvider = new VueApollo({
  defaultClient: mockClient,
})

const localVue = global.localVue
localVue.use(Vuex)
localVue.use(VueApollo)
const today = new Date()
const createdDate = new Date()
createdDate.setDate(createdDate.getDate() - 3)

// Mock für den Vuex-Store
const store = new Vuex.Store({
  state: {
    moderator: {
      roles: ['ADMIN'],
    },
  },
})

let propsData = {
  item: {
    uuid: 1,
    foreign: false,
    url: 'http://localhost/api/',
    publicKey: '4007170edd8d33fb009cd99ee4e87f214e7cd21b668d45540a064deb42e243c2',
    communityUuid: '5ab0befd-b150-4f31-a631-7f3637e47b21',
    authenticatedAt: null,
    name: 'Gradido Test',
    description: 'Gradido Community zum testen',
    gmsApiKey: '<api key>',
    creationDate: createdDate,
    createdAt: createdDate,
    updatedAt: createdDate,
    federatedCommunities: [
      {
        id: 2046,
        apiVersion: '2_0',
        endPoint: 'http://localhost/api/',
        lastAnnouncedAt: createdDate,
        verifiedAt: today,
        lastErrorAt: null,
        createdAt: createdDate,
        updatedAt: null,
      },
      {
        id: 2045,
        apiVersion: '1_1',
        endPoint: 'http://localhost/api/',
        lastAnnouncedAt: null,
        verifiedAt: null,
        lastErrorAt: null,
        createdAt: '2024-01-16T10:08:21.550Z',
        updatedAt: null,
      },
      {
        id: 2044,
        apiVersion: '1_0',
        endPoint: 'http://localhost/api/',
        lastAnnouncedAt: null,
        verifiedAt: null,
        lastErrorAt: null,
        createdAt: '2024-01-16T10:08:21.544Z',
        updatedAt: null,
      },
    ],
  },
}

const mocks = {
  $t: (key) => key,
  $i18n: {
    locale: 'en',
  },
}

describe('CommunityVisualizeItem', () => {
  let wrapper

  const updateHomeCommunityMock = vi.fn()
  mockClient.setRequestHandler(
    updateHomeCommunity,
    updateHomeCommunityMock.mockResolvedValue({
      data: {
        updateHomeCommunity: { id: 1 },
      },
    }),
  )

  const Wrapper = () => {
    return mount(CommunityVisualizeItem, { localVue, mocks, propsData, store, apolloProvider })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the component', () => {
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('div.community-visualize-item').exists()).toBe(true)
      expect(wrapper.find('.details').exists()).toBe(false)
    })

    it('toggles details on click', async () => {
      // Click the row to toggle details
      await wrapper.find('.row').trigger('click')

      // Assert that details are now open
      expect(wrapper.find('.details').exists()).toBe(true)

      // Click the row again to toggle details back
      await wrapper.find('.row').trigger('click')

      // Assert that details are now closed
      expect(wrapper.find('.details').exists()).toBe(false)
    })

    describe('rendering item properties', () => {
      it('has the url', () => {
        expect(wrapper.find('.row > div:nth-child(2) > div > a').text()).toBe(
          'http://localhost/api/',
        )
      })

      it('has the public key', () => {
        expect(wrapper.find('.row > div:nth-child(2) > small').text()).toContain(
          '4007170edd8d33fb009cd99ee4e87f214e7cd21b668d45540a064deb42e243c2'.substring(0, 26),
        )
      })

      describe('verified item', () => {
        it('has the check icon', () => {
          expect(wrapper.find('svg.bi-check').exists()).toBe(true)
        })

        it('has the text variant "success"', () => {
          expect(wrapper.find('.text-success').exists()).toBe(true)
        })
      })

      // describe('with different locales (de, en, fr, es, nl)', () => {
      describe('lastAnnouncedAt', () => {
        it('computes the time string for different locales (de, en, fr, es, nl)', () => {
          wrapper.vm.$i18n.locale = 'de'
          wrapper = Wrapper()
          expect(wrapper.vm.lastAnnouncedAt).toBe('vor 3 Tagen')

          wrapper.vm.$i18n.locale = 'fr'
          wrapper = Wrapper()
          expect(wrapper.vm.lastAnnouncedAt).toBe('il y a 3 jours')

          wrapper.vm.$i18n.locale = 'es'
          wrapper = Wrapper()
          expect(wrapper.vm.lastAnnouncedAt).toBe('hace 3 días')

          wrapper.vm.$i18n.locale = 'nl'
          wrapper = Wrapper()
          expect(wrapper.vm.lastAnnouncedAt).toBe('3 dagen geleden')
        })

        describe('lastAnnouncedAt == null', () => {
          beforeEach(() => {
            propsData = {
              item: {
                uuid: 7590,
                foreign: false,
                publicKey: 'eaf6a426b24fd54f8fbae11c17700fc595080ca25159579c63d38dbc64284ba7',
                url: 'http://localhost/api/2_0',
                lastAnnouncedAt: null,
                verifiedAt: null,
                lastErrorAt: null,
                createdAt: createdDate,
                updatedAt: null,
              },
            }
            wrapper = Wrapper()
          })

          it('computes empty string', async () => {
            expect(wrapper.vm.lastAnnouncedAt).toBe('')
          })
        })
      })

      describe('createdAt', () => {
        it('computes the time string for different locales (de, en, fr, es, nl)', () => {
          wrapper.vm.$i18n.locale = 'de'
          wrapper = Wrapper()
          expect(wrapper.vm.createdAt).toBe('vor 3 Tagen')

          wrapper.vm.$i18n.locale = 'fr'
          wrapper = Wrapper()
          expect(wrapper.vm.createdAt).toBe('il y a 3 jours')

          wrapper.vm.$i18n.locale = 'es'
          wrapper = Wrapper()
          expect(wrapper.vm.createdAt).toBe('hace 3 días')

          wrapper.vm.$i18n.locale = 'nl'
          wrapper = Wrapper()
          expect(wrapper.vm.createdAt).toBe('3 dagen geleden')
        })

        describe('not verified item', () => {
          beforeEach(() => {
            propsData = {
              item: {
                uuid: 7590,
                foreign: false,
                publicKey: 'eaf6a426b24fd54f8fbae11c17700fc595080ca25159579c63d38dbc64284ba7',
                url: 'http://localhost/api/',
                createdAt: createdDate,
                updatedAt: null,
              },
            }
            wrapper = Wrapper()
          })

          it('has the x-circle icon', () => {
            expect(wrapper.find('svg.bi-x-circle').exists()).toBe(true)
          })

          it('has the text variant "danger"', () => {
            expect(wrapper.find('.text-danger').exists()).toBe(true)
          })
        })

        describe('createdAt == null', () => {
          beforeEach(() => {
            propsData = {
              item: {
                uuid: 7590,
                foreign: false,
                publicKey: 'eaf6a426b24fd54f8fbae11c17700fc595080ca25159579c63d38dbc64284ba7',
                url: 'http://localhost/api/2_0',
                communityUuid: '5ab0befd-b150-4f31-a631-7f3637e47b21',
                authenticatedAt: null,
                creationDate: null,
                createdAt: null,
                updatedAt: null,
              },
            }
            wrapper = Wrapper()
          })

          it('computes empty string', async () => {
            expect(wrapper.vm.createdAt).toBe('')
          })
        })

        describe('test handleUpdateHomeCommunity', () => {
          describe('gms api key', () => {
            beforeEach(async () => {
              wrapper = Wrapper()
              wrapper.vm.originalGmsApiKey = 'original'
              wrapper.vm.gmsApiKey = 'changed key'

              await wrapper.vm.handleUpdateHomeCommunity()
              // Wait for the next tick to allow async operations to complete
              await wrapper.vm.$nextTick()
            })

            it('expect changed gms api key', () => {
              expect(updateHomeCommunityMock).toBeCalledWith({
                uuid: propsData.item.uuid,
                gmsApiKey: 'changed key',
                location: undefined,
              })
              expect(wrapper.vm.originalGmsApiKey).toBe('changed key')
              expect(toastSuccessSpy).toBeCalledWith('federation.toast_gmsApiKeyUpdated')
            })
          })

          describe('location', () => {
            beforeEach(async () => {
              wrapper = Wrapper()
              wrapper.vm.originalLocation = { latitude: 15.121, longitude: 1.212 }
              wrapper.vm.location = { latitude: 1.121, longitude: 17.212 }

              await wrapper.vm.handleUpdateHomeCommunity()
              // Wait for the next tick to allow async operations to complete
              await wrapper.vm.$nextTick()
            })

            it('expect changed location', () => {
              expect(updateHomeCommunityMock).toBeCalledWith({
                uuid: propsData.item.uuid,
                location: { latitude: 1.121, longitude: 17.212 },
                gmsApiKey: undefined,
              })
              expect(wrapper.vm.originalLocation).toStrictEqual({
                latitude: 1.121,
                longitude: 17.212,
              })
              expect(toastSuccessSpy).toBeCalledWith('federation.toast_gmsLocationUpdated')
            })
          })

          describe('gms api key and location', () => {
            beforeEach(async () => {
              wrapper = Wrapper()
              wrapper.vm.originalGmsApiKey = 'original'
              wrapper.vm.gmsApiKey = 'changed key'
              wrapper.vm.originalLocation = { latitude: 15.121, longitude: 1.212 }
              wrapper.vm.location = { latitude: 1.121, longitude: 17.212 }

              await wrapper.vm.handleUpdateHomeCommunity()
              // Wait for the next tick to allow async operations to complete
              await wrapper.vm.$nextTick()
            })

            it('expect changed gms api key and changed location', () => {
              expect(updateHomeCommunityMock).toBeCalledWith({
                uuid: propsData.item.uuid,
                gmsApiKey: 'changed key',
                location: undefined,
              })
              expect(wrapper.vm.originalGmsApiKey).toBe('changed key')
              expect(wrapper.vm.originalLocation).toStrictEqual({
                latitude: 1.121,
                longitude: 17.212,
              })
              expect(toastSuccessSpy).toBeCalledWith('federation.toast_gmsApiKeyAndLocationUpdated')
            })
          })
        })

        describe('test resetHomeCommunityEditable', () => {
          beforeEach(async () => {
            wrapper = Wrapper()
          })

          it('test', () => {
            wrapper.vm.originalGmsApiKey = 'original'
            wrapper.vm.gmsApiKey = 'changed key'
            wrapper.vm.originalLocation = { latitude: 15.121, longitude: 1.212 }
            wrapper.vm.location = { latitude: 1.121, longitude: 17.212 }
            wrapper.vm.resetHomeCommunityEditable()

            expect(wrapper.vm.location).toStrictEqual({ latitude: 15.121, longitude: 1.212 })
            expect(wrapper.vm.gmsApiKey).toBe('original')
          })
        })
      })
    })
  })
})
