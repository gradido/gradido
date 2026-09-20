// AI-GENERATED — not an architecture reference
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import {
  closeMemberAvatarZoom,
  memberAvatarZoomState,
  openMemberAvatarZoom,
} from '@/composables/useMemberAvatarZoom'
import { BModal } from 'bootstrap-vue-next'
import MemberAvatarZoom from './MemberAvatarZoom.vue'

const { mockQuery } = vi.hoisted(() => ({ mockQuery: vi.fn() }))
vi.mock('@vue/apollo-composable', () => ({
  useApolloClient: () => ({ client: { query: mockQuery } }),
}))

const margret = { gradidoID: 'g-margret', communityUuid: 'home' }

// The modal teleports; what this asks about is the pictures it holds, so the stub renders
// its content in place and keeps the assertions on the two <img> elements.
let wrapper

const mountZoom = () => {
  wrapper = mount(MemberAvatarZoom, {
    global: {
      mocks: { $t: (key) => key },
      stubs: { BModal: { template: '<div><slot /></div>', props: ['modelValue'] } },
    },
  })
  return wrapper
}

describe('MemberAvatarZoom', () => {
  /**
   * ⚠️ Every window here watches the SAME module state, so one left mounted keeps answering
   * opens from later tests -- and each of them fires its own request. The count of requests
   * is what one of the tests below measures, so this is not tidiness: without it that test
   * measures how many windows the file has built so far.
   */
  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
    closeMemberAvatarZoom()
    mockQuery.mockReset()
  })

  it('shows nothing while no picture is open', () => {
    const wrapper = mountZoom()

    expect(wrapper.findAll('img')).toHaveLength(0)
    expect(mockQuery).not.toHaveBeenCalled()
  })

  /**
   * ⛔ The small rendition at once, the full size when it arrives. A tap answered with an
   * empty box while the 512 crop travels is the one behaviour this window exists to avoid.
   */
  it('shows the small picture at once and the full size when it arrives', async () => {
    mockQuery.mockResolvedValue({ data: { memberAvatarFull: 'the-big-one' } })
    const wrapper = mountZoom()

    openMemberAvatarZoom({ member: margret, src: 'data:image/jpeg;base64,small' })
    await nextTick()
    expect(wrapper.findAll('img')).toHaveLength(1)
    expect(wrapper.find('img').attributes('src')).toBe('data:image/jpeg;base64,small')

    await flushPromises()
    await nextTick()
    const images = wrapper.findAll('img')
    expect(images).toHaveLength(2)
    expect(images[1].attributes('src')).toBe('data:image/jpeg;base64,the-big-one')
    expect(mockQuery.mock.calls[0][0].variables).toEqual({
      ref: { gradidoID: 'g-margret', communityUuid: 'home' },
    })
  })

  /**
   * ⛔ A late answer must never land on the face that is open NOW. A moderator who closes
   * one picture and opens the next before the first arrives would otherwise be shown
   * somebody else's portrait, under the right name.
   */
  it('drops an answer that belongs to a picture nobody is looking at any more', async () => {
    // ⚠️ One promise PER CALL, not one for both: with a single shared promise the second
    // request would receive the first one's answer, and the test would be measuring its own
    // fixture rather than the guard in the component.
    const settlers = []
    mockQuery.mockImplementation(
      () =>
        new Promise((resolve) => {
          settlers.push(resolve)
        }),
    )
    const wrapper = mountZoom()

    openMemberAvatarZoom({ member: margret, src: 'data:image/jpeg;base64,small' })
    await nextTick()
    openMemberAvatarZoom({
      member: { gradidoID: 'g-bernd', communityUuid: 'home' },
      src: 'data:image/jpeg;base64,other',
    })
    await nextTick()

    // The FIRST request answers -- the one for the picture nobody is looking at any more.
    expect(settlers).toHaveLength(2)
    settlers[0]({ data: { memberAvatarFull: 'margrets-big-one' } })
    await flushPromises()
    await nextTick()

    const sources = wrapper.findAll('img').map((image) => image.attributes('src'))
    expect(sources).not.toContain('data:image/jpeg;base64,margrets-big-one')
  })

  /**
   * ⛔ The pair, not half of it. `users` is unique on (gradido_id, community_uuid), so the
   * SAME gradidoID can belong to two members of different communities -- and half a
   * comparison would let one of them answer for the other, under the right name.
   * (coderabbit, #3890.)
   */
  it('drops an answer from the same id in another community', async () => {
    const settlers = []
    mockQuery.mockImplementation(
      () =>
        new Promise((resolve) => {
          settlers.push(resolve)
        }),
    )
    const wrapper = mountZoom()

    openMemberAvatarZoom({ member: margret, src: 'data:image/jpeg;base64,small' })
    await nextTick()
    openMemberAvatarZoom({
      member: { gradidoID: 'g-margret', communityUuid: 'elsewhere' },
      src: 'data:image/jpeg;base64,other',
    })
    await nextTick()

    settlers[0]({ data: { memberAvatarFull: 'the-other-margret' } })
    await flushPromises()
    await nextTick()

    const sources = wrapper.findAll('img').map((image) => image.attributes('src'))
    expect(sources).not.toContain('data:image/jpeg;base64,the-other-margret')
  })

  // A failure says nothing: the small rendition is already showing the face.
  it('keeps the small picture when the full size cannot be had', async () => {
    mockQuery.mockRejectedValue(new Error('no'))
    const wrapper = mountZoom()

    openMemberAvatarZoom({ member: margret, src: 'data:image/jpeg;base64,small' })
    await flushPromises()
    await nextTick()

    expect(wrapper.findAll('img')).toHaveLength(1)
    expect(wrapper.find('img').attributes('src')).toBe('data:image/jpeg;base64,small')
  })

  /**
   * ⛔ Measured at the REAL modal, because what is measured is a NAME the library gives.
   * `hide-footer` is not a prop of bootstrap-vue-next -- it declares `noFooter` -- and a prop
   * it does not know is dropped in silence: the picture opened with a Cancel and an OK button
   * behind it, and no stub could ever have said so (Bernd, 12.09.2026).
   */
  it('opens as a picture and nothing else: no title bar, no buttons', async () => {
    mockQuery.mockResolvedValue({ data: { memberAvatarFull: null } })
    wrapper = mount(MemberAvatarZoom, {
      attachTo: document.body,
      global: { mocks: { $t: (key) => key }, components: { BModal } },
    })

    openMemberAvatarZoom({ member: margret, src: 'data:image/jpeg;base64,small' })
    await nextTick()
    await nextTick()

    const modal = document.body.querySelector('.modal')
    expect(modal).not.toBeNull()
    expect(modal.querySelector('.modal-footer')).toBeNull()
    expect(modal.querySelector('.modal-header')).toBeNull()
    // The picture is there, and it is the only thing that is.
    expect(modal.querySelector('[data-test="member-avatar-zoom-small"]')).not.toBeNull()
    expect(modal.querySelectorAll('button')).toHaveLength(0)
  })

  /**
   * The picture is shown ROUND and whole (Bernd, 12.09.2026): a square box of a fixed size,
   * the face filling it, the corners taken off. jsdom lays nothing out, so the rule is read
   * where it is written -- with the comments stripped first, or a note that names the very
   * declaration below it would answer this search instead of the code.
   */
  it('shows the face round, in a box that cannot overflow', () => {
    const here = dirname(fileURLToPath(import.meta.url))
    const source = readFileSync(join(here, 'MemberAvatarZoom.vue'), 'utf8').replace(
      /\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->/g,
      '',
    )
    const ruleOf = (selector) =>
      new RegExp(`(?:^|\\n)\\${selector}\\s*\\{([^}]*)\\}`).exec(source)?.[1] ?? ''

    const image = ruleOf('.member-avatar-zoom-image')
    expect(image).toContain('border-radius: 50%')
    expect(image).toContain('object-fit: cover')

    // A box of its own, square, and never wider than the window -- the old layout centred the
    // full size on a box the size of the SMALL rendition, and it spilled over the modal's
    // edges, above and below.
    const stage = ruleOf('.member-avatar-zoom-stage')
    expect(stage).toContain('aspect-ratio: 1')
    expect(stage).toMatch(/width:\s*min\(/)
  })

  // Nothing to open without a picture on this device -- enlarging letters is not a thing.
  it('cannot be opened for a member whose picture is not here', () => {
    openMemberAvatarZoom({ member: margret, src: '' })

    expect(memberAvatarZoomState.value).toBeNull()
  })
  /**
   * The picture is shown round and frameless, the way the wallet shows it and the way Bernd
   * asked for it -- and what carries that is not the declarations but the SELECTORS.
   *
   * ⛔ Written with one class each, these rules tie with Bootstrap's own `.modal-content`
   * and `.modal-body`, and a tie is decided by order. This side loses that: measured in the
   * built stylesheet on 20.09.2026, ours sat at byte 705 and 772 while Bootstrap's white
   * background and its 16px padding sat at 121028 and 122342. So the face came up on a white
   * square with a border and a ring of padding around it, while the stylesheet said
   * `background: transparent`. Naming both classes makes it 0,2,0 against 0,1,0 -- decided
   * by specificity, where order cannot reach it.
   *
   * A rendered assertion cannot see this: jsdom applies no stylesheet and the modal teleports
   * away. So the guard reads the source, with the comments stripped -- the block above
   * explains the trap in prose and would otherwise keep the search green after somebody had
   * simplified the selector back.
   */
  describe('the round, frameless presentation', () => {
    const here = dirname(fileURLToPath(import.meta.url))
    const code = readFileSync(resolve(here, 'MemberAvatarZoom.vue'), 'utf8')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')

    // The stripper took the comments and not the file.
    it('reads code, not the note beside it', () => {
      expect(code).toContain('member-avatar-zoom-content')
      expect(code).not.toContain('a tie is decided by order')
    })

    it('outranks the modal instead of racing it', () => {
      expect(code).toMatch(/\.modal-content\.member-avatar-zoom-content\s*\{/)
      expect(code).toMatch(/\.modal-body\.member-avatar-zoom-body\s*\{/)
    })

    // What those two selectors are for, so a later reader sees the point and not just a rule.
    it('takes the panel, its border and its padding away', () => {
      const panel = code.match(/\.modal-content\.member-avatar-zoom-content\s*\{([^}]*)\}/)[1]
      const body = code.match(/\.modal-body\.member-avatar-zoom-body\s*\{([^}]*)\}/)[1]

      expect(panel).toContain('background: transparent')
      expect(panel).toContain('border: 0')
      expect(body).toContain('padding: 0')
    })
  })
})
