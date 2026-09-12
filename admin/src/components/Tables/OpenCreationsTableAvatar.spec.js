// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createStore } from 'vuex'
import MemberAvatar from '@/components/MemberAvatar.vue'
import { fetchMemberAvatars, forgetAllMemberAvatars } from '@/composables/useMemberAvatars'
import { closeMemberAvatarZoom, memberAvatarZoomState } from '@/composables/useMemberAvatarZoom'
import { LIST_AVATAR_SIZE } from '@/constants'
import { BTableLite } from 'bootstrap-vue-next'
import OpenCreationsTable from './OpenCreationsTable.vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key) }),
}))

const WHEN = '2026-09-12T04:00:00.000Z'
const margret = {
  id: 42,
  alias: 'margret',
  firstName: 'Margret',
  lastName: 'von Gradido',
  gradidoID: 'g-margret',
  communityUuid: 'home',
  avatarUpdatedAt: WHEN,
}

/**
 * ⛔ The REAL table, not a stub of it. What is measured here is that the circle reaches the
 * amount column at all -- and `cell(amount)` is a slot name bootstrap-vue-next gives, which
 * a stub would answer to whatever one wrote into it. The rest of this table has its own spec;
 * this one is about the face.
 */
const mountTable = () =>
  mount(OpenCreationsTable, {
    props: {
      items: [
        {
          id: 1,
          amount: '260',
          memo: 'Arbeit im Gemeinschaftsgarten',
          contributionStatus: 'PENDING',
          contributionDate: new Date('2026-08-05T10:00:00.000Z'),
          createdAt: new Date('2026-08-05T10:00:00.000Z'),
          messagesCount: 0,
          user: margret,
        },
      ],
      fields: [{ key: 'amount', label: 'creation', formatter: (value) => `${value} GDD` }],
      hideResubmission: false,
    },
    global: {
      plugins: [createStore({ state: { moderator: {} } })],
      // ⚠️ The real table, handed over explicitly: the build auto-imports it
      // (unplugin-vue-components) and vitest does not, so without this it renders as an
      // unknown element and no cell slot is called at all.
      components: { BTableLite },
      mocks: { $t: (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key) },
      stubs: {
        IBiQuestionSquare: true,
        IBiBellFill: true,
        IBiCheck: true,
        IBiXCircle: true,
        IBiTrash: true,
        IBiPencilSquare: true,
        IBiChatDots: true,
        IBiExclamationCircleFill: true,
        IBiQuestionDiamond: true,
        IBiX: true,
        IBiSearch: true,
        BModal: true,
      },
    },
  })

describe('the member behind a contribution', () => {
  let wrapper

  beforeEach(() => {
    forgetAllMemberAvatars()
    closeMemberAvatarZoom()
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  it('stands under the amount, at the one size this interface uses', () => {
    wrapper = mountTable()

    const avatar = wrapper.findComponent(MemberAvatar)
    expect(avatar.exists()).toBe(true)
    expect(avatar.props('size')).toBe(LIST_AVATAR_SIZE)
    // In the amount column, under the number -- not in a column of its own.
    expect(wrapper.find('td').text()).toContain('260 GDD')
    expect(wrapper.find('td').findComponent(MemberAvatar).exists()).toBe(true)
  })

  it('shows the face once the page has fetched it, and opens it on a tap', async () => {
    const client = {
      query: vi.fn().mockResolvedValue({
        data: {
          memberAvatars: [
            {
              gradidoID: 'g-margret',
              communityUuid: 'home',
              avatar: 'her-face',
              avatarUpdatedAt: WHEN,
            },
          ],
        },
      }),
    }
    wrapper = mountTable()
    // The same order the moderation meets: the row is painted, the picture arrives after.
    expect(wrapper.findComponent(MemberAvatar).props('src')).toBe('')

    await fetchMemberAvatars(client, [margret])
    await wrapper.vm.$nextTick()

    const avatar = wrapper.findComponent(MemberAvatar)
    expect(avatar.props('src')).toBe('data:image/jpeg;base64,her-face')

    await avatar.trigger('click')
    expect(memberAvatarZoomState.value).toMatchObject({
      member: { gradidoID: 'g-margret', communityUuid: 'home' },
      src: 'data:image/jpeg;base64,her-face',
    })
  })
})
