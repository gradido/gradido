import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import Name from './Name'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key) => key,
  }),
}))

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}))

const mockToastError = vi.fn()
vi.mock('@/composables/useToast', () => ({
  useAppToast: vi.fn(() => ({
    toastError: mockToastError,
  })),
}))

const propsData = {
  text: 'Plaintext Name',
}

describe('Name', () => {
  let wrapper

  const createWrapper = () => mount(Name, { props: propsData })

  describe('mount', () => {
    beforeEach(() => {
      wrapper = createWrapper()
    })

    it('renders the component', () => {
      expect(wrapper.find('div.name').exists()).toBe(true)
    })

    describe('without linked user', () => {
      it('has a span with the text', () => {
        expect(wrapper.find('div.gdd-transaction-list-item-name').text()).toBe('Plaintext Name')
      })

      it('has no control', () => {
        expect(wrapper.find('div.gdd-transaction-list-item-name').find('button').exists()).toBe(
          false,
        )
      })
    })

    describe('with linked user', () => {
      beforeEach(async () => {
        await wrapper.setProps({
          linkedUser: {
            alias: 'bibi',
            gradidoID: 'gradido-ID',
            communityUuid: 'community UUID',
          },
        })
      })

      it('names the member by their alias', () => {
        expect(wrapper.find('div.gdd-transaction-list-item-name').text()).toBe('bibi')
      })

      // NU-018: without an alias the FULL gradidoID -- usable, copyable, resolvable.
      // A shortened one would be decoration; the row is protected by CSS clipping.
      it('falls back to the full gradidoID without one', async () => {
        await wrapper.setProps({
          linkedUser: { alias: null, gradidoID: 'gradido-ID', communityUuid: 'community UUID' },
        })
        expect(wrapper.find('div.gdd-transaction-list-item-name').text()).toBe('gradido-ID')
      })

      it('appends the community name for a foreign row', async () => {
        await wrapper.setProps({
          linkedUser: {
            alias: 'bibi',
            gradidoID: 'gradido-ID',
            communityUuid: 'community UUID',
            communityName: 'Nachbarort',
          },
        })
        expect(wrapper.find('div.gdd-transaction-list-item-name').text()).toBe('bibi / Nachbarort')
      })

      /**
       * ⛔ A button, not an anchor, and NOT a way into the send form any more (KF-010). A
       * tap on a member means "this person" wherever it happens; the send form is one of
       * the two ways out of the window that opens. The list above this component owns that
       * window, so all this control does is say who was tapped.
       */
      it('is a button rather than a link', () => {
        const name = wrapper.find('div.gdd-transaction-list-item-name')
        expect(name.find('button').exists()).toBe(true)
        expect(name.find('a').exists()).toBe(false)
      })

      it('hands the member up when it is tapped', async () => {
        await wrapper.find('[data-test="member-name-open"]').trigger('click')

        expect(wrapper.emitted('open')).toHaveLength(1)
        // The member it was drawing, so no call site has to name them a second time.
        expect(wrapper.emitted('open')[0][0]).toMatchObject({ gradidoID: 'gradido-ID' })
      })

      /**
       * ⛔ The row AROUND this one must not act as well. A booking row opens and closes the
       * booking's details on click, and this control sits inside it -- without the `.stop`
       * one tap did both, opening the window and unfolding the row behind it.
       */
      it('keeps the click off the row around it', async () => {
        const onRow = vi.fn()
        const parent = mount(
          {
            components: { Name },
            template: '<div @click="onRow"><Name :linked-user="user" /></div>',
            props: { user: Object, onRow: Function },
          },
          {
            props: {
              user: { alias: 'bibi', gradidoID: 'gradido-ID', communityUuid: 'community UUID' },
              onRow,
            },
          },
        )

        await parent.find('[data-test="member-name-open"]').trigger('click')

        expect(parent.findComponent(Name).emitted('open')).toHaveLength(1)
        expect(onRow).not.toHaveBeenCalled()
        // And the guard measures something: the same row, clicked anywhere else, does act.
        await parent.trigger('click')
        expect(onRow).toHaveBeenCalledTimes(1)
      })

      /**
       * ⛔ The control can be switched off, and the name still stands. The contact list and
       * the contacts column are rows that are THEMSELVES the button (KF-010); a button
       * nested in one would reach both handlers and make the row's accessible name the sum
       * of two controls.
       */
      it('is plain text where the row around it is the control', async () => {
        await wrapper.setProps({ opens: false })

        const name = wrapper.find('div.gdd-transaction-list-item-name')
        expect(name.find('button').exists()).toBe(false)
        expect(name.text()).toBe('bibi')
      })

      // A booking whose counterparty the backend could not resolve names nobody, so there
      // is nothing to open a window about -- the name is text, whatever `opens` says.
      it('is plain text for a counterparty without a gradidoID', async () => {
        await wrapper.setProps({ linkedUser: { alias: 'bibi', gradidoID: null } })

        expect(wrapper.find('div.gdd-transaction-list-item-name').find('button').exists()).toBe(
          false,
        )
      })
    })
  })
})
