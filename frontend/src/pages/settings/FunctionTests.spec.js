// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { ref } from 'vue'
import FunctionTests from './FunctionTests.vue'
import { firstCreationStatus } from '@/graphql/firstCreation.graphql'

/**
 * The function-test area (ES-014). What is worth measuring here is who gets in and what
 * the two buttons do — not the wording, which lives in the locale files.
 *
 * ⚠️ The route to this page is registered unconditionally (routes.js says why), so the
 * page itself is the gate. Both halves are measured in both directions: an admin on a
 * server that offers it gets the area, and neither a member nor an admin on a server that
 * switched it off does — a one-sided test would stay green if the area vanished entirely.
 */
vi.mock('bootstrap-vue-next', () => ({
  // `emits`, or one click runs the handler twice and "sent once" becomes a lie.
  BButton: {
    emits: ['click'],
    props: ['disabled'],
    template: '<button :disabled="disabled" @click="$emit(`click`)"><slot></slot></button>',
  },
  BAlert: { template: '<div><slot></slot></div>' },
}))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key) => key }) }))

const storeState = { role: null }
vi.mock('vuex', () => ({ useStore: () => ({ state: storeState }) }))

const pushed = []
const replaced = []
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: (to) => {
      pushed.push(to)
    },
    replace: (to) => {
      replaced.push(to)
    },
  }),
}))

const statusMock = ref(null)
const startMock = vi.fn()
let mutationOptions = null
vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({ result: statusMock }),
  useMutation: (_document, options) => {
    mutationOptions = options
    return { mutate: startMock }
  },
}))

/**
 * ⚠️ Kept and unmounted after every test. The status is one ref for the whole file, so a
 * wrapper left standing keeps watching it — and the next test's setup, which writes that
 * ref, would set the OLD page's watcher off and file a redirect the new page never made.
 * Two of the four gate tests were green-then-red on exactly that.
 */
let mounted = []
const mountArea = () => {
  const wrapper = mount(FunctionTests, {
    global: {
      stubs: { 'settings-section': { template: '<div><slot></slot></div>' } },
      mocks: { $t: (key) => key },
    },
  })
  mounted.push(wrapper)
  return wrapper
}

afterEach(() => {
  mounted.forEach((wrapper) => wrapper.unmount())
  mounted = []
})

const status = (over = {}) => ({
  firstCreationStatus: {
    state: 'DONE',
    eligible: false,
    functionTestsEnabled: true,
    testRunsLeft: 7,
    isFirstCreationSigner: false,
    ...over,
  },
})

const area = (wrapper) => wrapper.find('[data-test="function-tests-first-creation"]')

beforeEach(() => {
  storeState.role = 'ADMIN'
  statusMock.value = status()
  startMock.mockReset()
  startMock.mockResolvedValue({})
  pushed.length = 0
  replaced.length = 0
})

describe('the function-test area', () => {
  describe('who gets in', () => {
    it('lets an admin in where the server offers it', () => {
      const wrapper = mountArea()

      expect(area(wrapper).exists()).toBe(true)
      expect(replaced).toEqual([])
    })

    it('sends a member back to the settings', () => {
      storeState.role = null
      const wrapper = mountArea()

      expect(area(wrapper).exists()).toBe(false)
      expect(replaced).toEqual(['/settings'])
    })

    it('sends an admin back where the server switched it off', () => {
      statusMock.value = status({ functionTestsEnabled: false })
      const wrapper = mountArea()

      expect(area(wrapper).exists()).toBe(false)
      expect(replaced).toEqual(['/settings'])
    })

    /**
     * ⛔ Not while the answer is still on its way. Sending an admin back for the second it
     * takes to answer would make the entry unreachable by clicking it — the page would
     * bounce off before it ever knew it was allowed.
     */
    it('waits for the answer rather than bouncing', () => {
      statusMock.value = null
      mountArea()

      expect(replaced).toEqual([])
    })
  })

  describe('the counter and the two buttons', () => {
    it('shows how many runs the month still has room for', () => {
      const wrapper = mountArea()

      expect(wrapper.find('[data-test="function-tests-runs-left"]').text()).toBe(
        'settings.functionTests.firstCreation.runsLeft',
      )
    })

    it('says so when the month is used up, and both buttons go dead', () => {
      statusMock.value = status({ testRunsLeft: 0 })
      const wrapper = mountArea()

      expect(wrapper.find('[data-test="function-tests-runs-left"]').text()).toBe(
        'settings.functionTests.firstCreation.noRunsLeft',
      )
      expect(
        wrapper.find('[data-test="function-tests-with-booking"]').attributes('disabled'),
      ).toBeDefined()
      expect(
        wrapper.find('[data-test="function-tests-without-booking"]').attributes('disabled'),
      ).toBeDefined()
    })

    it('sends the two variants apart', async () => {
      const wrapper = mountArea()

      await wrapper.find('[data-test="function-tests-with-booking"]').trigger('click')
      expect(startMock).toHaveBeenCalledWith({ withBooking: true })

      await wrapper.find('[data-test="function-tests-without-booking"]').trigger('click')
      expect(startMock).toHaveBeenLastCalledWith({ withBooking: false })
    })

    /**
     * The window hangs in the layout and keeps away from every /settings route, so the
     * whole point of the press is met somewhere else.
     */
    it('goes to the overview, where the window opens', async () => {
      const wrapper = mountArea()

      await wrapper.find('[data-test="function-tests-with-booking"]').trigger('click')
      await wrapper.vm.$nextTick()

      expect(pushed).toEqual(['/overview'])
    })

    /**
     * ⛔ The window's own query answered long ago and nothing about a mutation makes it ask
     * again. Without this the member arrives at the overview before the window knows it may
     * open — and sees nothing at all.
     */
    it('asks the status afresh, and waits for it, before it moves', () => {
      mountArea()

      expect(mutationOptions.awaitRefetchQueries).toBe(true)
      expect(mutationOptions.refetchQueries).toEqual([{ query: firstCreationStatus }])
    })

    it('says so when it did not work, and stays put', async () => {
      startMock.mockRejectedValue(new Error('nope'))
      const wrapper = mountArea()

      await wrapper.find('[data-test="function-tests-with-booking"]').trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.find('[data-test="function-tests-failed"]').exists()).toBe(true)
      expect(pushed).toEqual([])
    })
  })

  describe('the signer', () => {
    it('is warned before pressing, and the buttons are dead', () => {
      statusMock.value = status({ isFirstCreationSigner: true })
      const wrapper = mountArea()

      expect(wrapper.find('[data-test="function-tests-signer-hint"]').exists()).toBe(true)
      expect(
        wrapper.find('[data-test="function-tests-with-booking"]').attributes('disabled'),
      ).toBeDefined()
    })

    it('is not warned when they are somebody else', () => {
      const wrapper = mountArea()

      expect(wrapper.find('[data-test="function-tests-signer-hint"]').exists()).toBe(false)
      expect(
        wrapper.find('[data-test="function-tests-with-booking"]').attributes('disabled'),
      ).toBeUndefined()
    })
  })
})
