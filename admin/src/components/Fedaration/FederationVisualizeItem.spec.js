import { mount } from '@vue/test-utils'
import FederationVisualizeItem from './FederationVisualizeItem.vue'

const localVue = global.localVue
const today = new Date()
const createdDate = new Date()
createdDate.setDate(createdDate.getDate() - 3)

let propsData = {
  item: {
    id: 7590,
    foreign: false,
    publicKey: 'eaf6a426b24fd54f8fbae11c17700fc595080ca25159579c63d38dbc64284ba7',
    url: 'http://localhost/api/api/2_0',
    lastAnnouncedAt: createdDate,
    verifiedAt: today,
    lastErrorAt: null,
    createdAt: createdDate,
    updatedAt: null,
  },
}

const mocks = {
  $i18n: {
    locale: 'en',
  },
}

describe('FederationVisualizeItem', () => {
  let wrapper

  const Wrapper = () => {
    return mount(FederationVisualizeItem, { localVue, mocks, propsData })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the component', () => {
      expect(wrapper.find('div.federation-visualize-item').exists()).toBe(true)
    })

    describe('rendering item properties', () => {
      it('has the url', () => {
        expect(wrapper.find('.row > div:nth-child(2) > div').text()).toBe(
          'http://localhost/api/api/2_0',
        )
      })

      it('has the public key', () => {
        expect(wrapper.find('.row > div:nth-child(2) > small').text()).toContain(
          'eaf6a426b24fd54f8fbae11c17700fc595080ca25159579c63d38dbc64284ba7'.substring(0, 26),
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

      describe('not verified item', () => {
        beforeEach(() => {
          propsData = {
            item: {
              id: 7590,
              foreign: false,
              publicKey: 'eaf6a426b24fd54f8fbae11c17700fc595080ca25159579c63d38dbc64284ba7',
              url: 'http://localhost/api/api/2_0',
              lastAnnouncedAt: createdDate,
              verifiedAt: null,
              lastErrorAt: null,
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
                id: 7590,
                foreign: false,
                publicKey: 'eaf6a426b24fd54f8fbae11c17700fc595080ca25159579c63d38dbc64284ba7',
                url: 'http://localhost/api/api/2_0',
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

        describe('createdAt == null', () => {
          beforeEach(() => {
            propsData = {
              item: {
                id: 7590,
                foreign: false,
                publicKey: 'eaf6a426b24fd54f8fbae11c17700fc595080ca25159579c63d38dbc64284ba7',
                url: 'http://localhost/api/api/2_0',
                lastAnnouncedAt: createdDate,
                verifiedAt: null,
                lastErrorAt: null,
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
      })
    })
  })
})
