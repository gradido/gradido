// AI-GENERATED — not an architecture reference
import { flushPromises, mount } from '@vue/test-utils'
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import ChatVideoCall from './ChatVideoCall.vue'
import { chatVideoServerChoices } from '@/graphql/chat.graphql'
import { chatVideoInviteBody, chatVideoRescheduledBody } from '@/utils/chatVideoInvite'
import { withChatVideoTopic } from '@/utils/chatVideoTopic'

/**
 * A video invitation of one's own, changed (Bernd, 01.10.2026, E-060: "Wichtig ist, dass wir dabei
 * auch zum Beispiel einen Termin für eine Videokonferenz bearbeiten können"): the question's
 * dialog opens on the gear's view with the invitation's topic and time; "Save" writes the
 * invitation's words anew into the SAME message, and a changed time is followed by a short
 * message of its own (B4). How the dialog asks, plans and opens a room is ContactWindow.spec.js's;
 * here: what changing an invitation does.
 *
 * The words are the keys (`t` answers with them); which call they are written for -- room, topic,
 * time, who runs the server, what the calendars need -- is what counts here, so the expected
 * messages are written by the wallet's own function with this file's `t`. How the words read in
 * the ten languages is utils/chatVideoInvite.spec.js's.
 */
const words = vi.hoisted(() => ({ 'chatThread.videoTopicDefault': 'Videoanruf' }))
const i18n = vi.hoisted(() => ({
  t: (key, values) => (values ? `${key} ${JSON.stringify(values)}` : (words[key] ?? key)),
  d: (date, format) => `${format}(${date.toISOString()})`,
  locale: 'de',
}))
vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: i18n.t, d: i18n.d, locale: { value: i18n.locale } }),
}))
vi.mock('vuex', () => ({ useStore: () => ({ state: { gradidoID: 'me-id' } }) }))

const serverRooms = vi.fn()
const serverChoices = vi.fn()
vi.mock('@vue/apollo-composable', () => ({
  useApolloClient: () => ({
    client: {
      query: (options) =>
        options.query === chatVideoServerChoices ? serverChoices(options) : serverRooms(options),
    },
  }),
}))

// The calendar file is handed to the browser to be saved: here a test reads what was handed.
const savedFiles = vi.hoisted(() => vi.fn())
vi.mock('@/utils/chatVideoCalendar', async (original) => ({
  ...(await original()),
  saveChatVideoCalendarFile: (...args) => savedFiles(...args),
}))

const ROOM = 'https://meet.ffmuc.net/k7m2x9q4t8wz'
const OPERATOR = 'Freifunk München (Freie Netze München e. V.)'
// 14:00–15:00 on a clock in Berlin.
const WHEN = {
  start: new Date('2026-10-05T12:00:00.000Z'),
  end: new Date('2026-10-05T13:00:00.000Z'),
}
const A_DAY_LATER = {
  start: new Date('2026-10-06T12:00:00.000Z'),
  end: new Date('2026-10-06T13:00:00.000Z'),
}
const MESSAGE = { id: 7, messageUuid: 'uuid-7' }
const PLANNED = {
  room: ROOM,
  topic: 'Projektbesprechung',
  when: WHEN,
  operator: OPERATOR,
  revision: null,
}
const NOW = { ...PLANNED, when: null }

/** The invitation's words for a call, and the message that follows a changed time. */
const invitationFor = (call) => chatVideoInviteBody(i18n, call).body
const rescheduledTo = (call) => chatVideoRescheduledBody(i18n, call)

describe('ChatVideoCall, a video invitation changed (E-060)', () => {
  let wrapper
  let zoneBefore
  const delivered = vi.fn()
  const changed = vi.fn()

  /**
   * `fading`: the dialog as the real one is while it closes -- its content still drawn, for the
   * quarter of a second it takes to fade out. Otherwise the content goes with the dialog.
   */
  const mountCall = (props = {}, { fading = false } = {}) => {
    wrapper = mount(ChatVideoCall, {
      props: { name: 'Lena', canMail: true, deliver: delivered, change: changed, ...props },
      global: {
        mocks: { $t: i18n.t },
        stubs: {
          BModal: {
            name: 'BModal',
            props: { modelValue: Boolean },
            emits: ['update:modelValue', 'shown'],
            template: fading
              ? '<div :data-open="String(modelValue)"><slot /><slot name="footer" /></div>'
              : '<div v-if="modelValue"><slot /><slot name="footer" /></div>',
          },
          IMdiCogOutline: true,
          IMdiLinkVariant: true,
          IMdiCheck: true,
          IMdiServerOutline: true,
          IMdiCalendarPlusOutline: true,
        },
      },
    })
    return wrapper
  }
  const inDialog = (name) => wrapper.find(`[data-test="chat-video-${name}"]`)
  const open = () => inDialog('settings-title').exists() || inDialog('title').exists()
  const problem = () => inDialog('settings-problem')

  /** "Bearbeiten" at an invitation of one's own, as the window hands it over. */
  const edit = async (invitation = PLANNED, message = MESSAGE) => {
    wrapper.vm.edit({ message, invitation })
    await flushPromises()
  }
  const save = async () => {
    await inDialog('edit-save').trigger('click')
    await flushPromises()
  }
  /** A promise a test settles when it wants. */
  const deferred = () => {
    let settle
    const promise = new Promise((resolve) => {
      settle = resolve
    })
    return { promise, resolve: settle }
  }

  beforeEach(() => {
    zoneBefore = process.env.TZ
    process.env.TZ = 'Europe/Berlin'
    serverChoices.mockResolvedValue({ data: { chatVideoServerChoices: [] } })
    serverRooms.mockResolvedValue({ data: { chatVideoRoom: null } })
    delivered.mockResolvedValue(true)
    changed.mockResolvedValue('')
  })

  afterEach(() => {
    wrapper?.unmount()
    process.env.TZ = zoneBefore
    serverChoices.mockReset()
    serverRooms.mockReset()
    delivered.mockReset()
    changed.mockReset()
    savedFiles.mockReset()
    vi.restoreAllMocks()
  })

  describe('the dialog', () => {
    it('opens on the gear’s view with what the invitation says', async () => {
      mountCall()

      await edit()

      expect(inDialog('settings-title').text()).toBe('chatThread.videoEditTitle')
      expect(inDialog('dialog').attributes('aria-label')).toBe('chatThread.videoEditTitle')
      expect(inDialog('edit-topic').element.value).toBe('Projektbesprechung')
      expect(inDialog('day').element.value).toBe('2026-10-05')
      expect(inDialog('from').element.value).toBe('14:00')
      expect(inDialog('to').element.value).toBe('15:00')
      // What happens with it, and the box for the message about a changed time.
      expect(inDialog('plan-body').text()).toBe('chatThread.videoEditBody {"name":"Lena"}')
      expect(inDialog('plan-email').element.checked).toBe(false)
      expect(inDialog('plan-email').element.closest('label').textContent.trim()).toBe(
        'chatThread.alsoByEmail',
      )
      // "Cancel" and "Save" -- not the question's "Back" and "Plan".
      expect(inDialog('edit-cancel').text()).toBe('form.cancel')
      expect(inDialog('edit-save').text()).toBe('form.save')
      expect(inDialog('back').exists()).toBe(false)
      expect(inDialog('plan').exists()).toBe(false)
    })

    /**
     * ⛔ The room stays: the link everybody has goes on leading to the call. Its server stands
     * there as words -- nothing to change it with, and readable whole: a field greyed out cut a
     * long name off (measured in the bundle) --, no list of servers is asked for and no room, and
     * the member's own choice of server is not touched.
     */
    it('shows the invitation’s server as words, and asks the server for nothing', async () => {
      const stored = vi.spyOn(Storage.prototype, 'setItem')
      mountCall()

      await edit()

      expect(inDialog('edit-server').text()).toBe(`meet.ffmuc.net – ${OPERATOR}`)
      expect(inDialog('edit-server').element.tagName).toBe('P')
      expect(wrapper.findAll('select')).toHaveLength(0)
      expect(wrapper.findAll('input[disabled]')).toHaveLength(0)
      expect(inDialog('edit-room-hint').text()).toBe('chatThread.videoEditRoomHint')
      expect(inDialog('server').exists()).toBe(false)
      expect(serverChoices).not.toHaveBeenCalled()
      expect(serverRooms).not.toHaveBeenCalled()
      expect(stored).not.toHaveBeenCalled()
    })

    // Where the list named nobody, the invitation names the host: not said twice.
    it('names a server nobody is named for by its host alone', async () => {
      mountCall()

      await edit({ ...PLANNED, operator: 'meet.ffmuc.net' })

      expect(inDialog('edit-server').text()).toBe('meet.ffmuc.net')
    })

    it('opens a call without a time with its fields empty', async () => {
      mountCall()

      await edit(NOW)

      expect(inDialog('edit-topic').element.value).toBe('Projektbesprechung')
      expect(inDialog('day').element.value).toBe('')
      expect(inDialog('from').element.value).toBe('')
      expect(inDialog('to').element.value).toBe('')
    })

    // The box is empty for every question (E-024), whatever the last one left ticked.
    it('opens with the box empty, whatever the last question left', async () => {
      mountCall()
      wrapper.vm.ask()
      await flushPromises()
      await inDialog('email').setValue(true)
      await inDialog('cancel').trigger('click')
      await flushPromises()

      await edit()

      expect(inDialog('plan-email').element.checked).toBe(false)
    })

    it('speaks of the group, and offers its announcement, in a group', async () => {
      mountCall({ name: 'Gradido-Café Berlin', group: true })

      await edit()

      expect(inDialog('plan-body').text()).toBe('chatGroup.videoEditBody')
      expect(inDialog('plan-email').element.closest('label').textContent.trim()).toBe(
        'chatGroup.announce',
      )
    })

    it('lets it go by "Cancel": nothing changed, and the next question is the ordinary one', async () => {
      mountCall()
      await edit()
      await inDialog('edit-topic').setValue('Etwas anderes')

      await inDialog('edit-cancel').trigger('click')
      await flushPromises()

      expect(open()).toBe(false)
      expect(changed).not.toHaveBeenCalled()
      expect(delivered).not.toHaveBeenCalled()

      wrapper.vm.ask()
      await flushPromises()
      expect(inDialog('title').text()).toBe('chatThread.videoAskTitle {"name":"Lena"}')
      expect(inDialog('topic').element.value).toBe('Videoanruf')
      await inDialog('gear').trigger('click')
      await flushPromises()
      expect(inDialog('edit-save').exists()).toBe(false)
      expect(inDialog('plan').exists()).toBe(true)
      expect(inDialog('day').element.value).toBe('')
    })
  })

  describe('"Save"', () => {
    /**
     * The SAME message gets the invitation's words anew: the room and who runs it as before, and
     * for the calendars the start the call had first, with one change counted. Only the topic
     * changed: the invitation says "bearbeitet", and no message follows.
     */
    it('changes the topic in the message itself, and nothing follows', async () => {
      mountCall()
      await edit()
      await inDialog('edit-topic').setValue('  Lesekreis „Momo“ ')

      await save()

      expect(changed).toHaveBeenCalledTimes(1)
      expect(changed).toHaveBeenCalledWith({
        messageUuid: 'uuid-7',
        body: invitationFor({
          ...PLANNED,
          topic: 'Lesekreis „Momo“',
          revision: { first: WHEN.start, sequence: 1 },
        }),
      })
      expect(delivered).not.toHaveBeenCalled()
      expect(open()).toBe(false)
    })

    // B4: "ein geänderter Video-Termin schreibt von selbst 'Termin geändert'".
    it('changes the time, and says so in a message of its own, after the change', async () => {
      mountCall()
      await edit()
      await inDialog('day').setValue('2026-10-06')

      await save()

      expect(changed).toHaveBeenCalledWith({
        messageUuid: 'uuid-7',
        body: invitationFor({
          ...PLANNED,
          when: A_DAY_LATER,
          revision: { first: WHEN.start, sequence: 1 },
        }),
      })
      expect(delivered).toHaveBeenCalledTimes(1)
      expect(delivered).toHaveBeenCalledWith({
        body: rescheduledTo({ topic: 'Projektbesprechung', when: A_DAY_LATER }),
        notify: 'NONE',
      })
      // First the invitation, then the word about it.
      expect(changed.mock.invocationCallOrder[0]).toBeLessThan(
        delivered.mock.invocationCallOrder[0],
      )
      expect(open()).toBe(false)
    })

    it('counts an end that moved as a changed time too', async () => {
      mountCall()
      await edit()
      await inDialog('to').setValue('15:30')

      await save()

      const when = { start: WHEN.start, end: new Date('2026-10-05T13:30:00.000Z') }
      expect(changed.mock.calls[0][0].body).toBe(
        invitationFor({ ...PLANNED, when, revision: { first: WHEN.start, sequence: 1 } }),
      )
      expect(delivered).toHaveBeenCalledWith({
        body: rescheduledTo({ topic: 'Projektbesprechung', when }),
        notify: 'NONE',
      })
    })

    // The box is for the message about the time -- the invitation is not sent again.
    it('sends the message about the time by mail as well where the box is ticked', async () => {
      mountCall()
      await edit()
      await inDialog('day').setValue('2026-10-06')
      await inDialog('plan-email').setValue(true)

      await save()

      expect(delivered).toHaveBeenCalledWith(expect.objectContaining({ notify: 'EMAIL' }))
    })

    it('names the new topic in the message about the time where both changed', async () => {
      mountCall()
      await edit()
      await inDialog('edit-topic').setValue('Lesekreis')
      await inDialog('day').setValue('2026-10-06')

      await save()

      expect(delivered).toHaveBeenCalledWith({
        body: rescheduledTo({ topic: 'Lesekreis', when: A_DAY_LATER }),
        notify: 'NONE',
      })
    })

    // An emptied topic falls back to the default, as in the question.
    it('takes the default for an emptied topic', async () => {
      mountCall()
      await edit()
      await inDialog('edit-topic').setValue('   ')

      await save()

      expect(changed.mock.calls[0][0].body).toBe(
        invitationFor({
          ...PLANNED,
          topic: 'Videoanruf',
          revision: { first: WHEN.start, sequence: 1 },
        }),
      )
    })

    // The calendars know the call by its FIRST start: a second change keeps it and counts on.
    it('counts on from a call that was changed before', async () => {
      const first = new Date('2026-10-01T08:00:00.000Z')
      mountCall()
      await edit({ ...PLANNED, revision: { first, sequence: 2 } })
      await inDialog('day').setValue('2026-10-06')

      await save()

      expect(changed.mock.calls[0][0].body).toBe(
        invitationFor({ ...PLANNED, when: A_DAY_LATER, revision: { first, sequence: 3 } }),
      )
    })

    /**
     * A call without a time gets one: a planned call from now on, named for the calendars as one
     * newly planned -- no calendar holds it yet. The message about its time follows.
     */
    it('gives a call without a time its first time, with nothing counted', async () => {
      mountCall()
      await edit(NOW)
      await inDialog('day').setValue('2026-10-06')
      await inDialog('from').setValue('14:00')
      await inDialog('to').setValue('15:00')

      await save()

      expect(changed.mock.calls[0][0].body).toBe(
        invitationFor({ ...NOW, when: A_DAY_LATER, revision: null }),
      )
      expect(delivered).toHaveBeenCalledWith({
        body: rescheduledTo({ topic: 'Projektbesprechung', when: A_DAY_LATER }),
        notify: 'NONE',
      })
    })

    it('leaves a call without a time without one where only its topic changed', async () => {
      mountCall()
      await edit(NOW)
      await inDialog('edit-topic').setValue('Lesekreis')

      await save()

      expect(changed.mock.calls[0][0].body).toBe(invitationFor({ ...NOW, topic: 'Lesekreis' }))
      expect(delivered).not.toHaveBeenCalled()
      expect(open()).toBe(false)
    })

    // The same words: nothing to change, and nothing to ask the thread or the server for.
    it('closes and changes nothing where nothing was changed', async () => {
      mountCall()
      await edit()

      await save()

      expect(changed).not.toHaveBeenCalled()
      expect(delivered).not.toHaveBeenCalled()
      expect(open()).toBe(false)
    })

    // A planned call stays a planned one; half a time is none.
    it.each([
      ['a planned call’s day was emptied', PLANNED, { day: '' }],
      ['a planned call’s end was emptied', PLANNED, { to: '' }],
      ['a planned call’s time was emptied whole', PLANNED, { day: '', from: '', to: '' }],
      ['a planned call ends before it begins', PLANNED, { to: '13:00' }],
      ['a call without a time got only a day', NOW, { day: '2026-10-06' }],
    ])('says what is missing where %s, and changes nothing', async (_, invitation, fields) => {
      mountCall()
      await edit(invitation)
      for (const [name, value] of Object.entries(fields)) {
        await inDialog(name).setValue(value)
      }

      await save()

      expect(problem().text()).toBe('chatThread.videoPlanIncomplete')
      expect(problem().attributes('role')).toBe('alert')
      expect(changed).not.toHaveBeenCalled()
      expect(delivered).not.toHaveBeenCalled()
      expect(open()).toBe(true)
    })

    /**
     * ⛔ The time is the invitation's own, to the second, while its fields stand untouched. The
     * fields hold one day: a call that runs past midnight on this device's clock ends at 23:59
     * in them -- read from the fields, a change of the topic alone would cut the call short and
     * announce a new time nobody chose.
     */
    it('keeps the time whole where the fields cannot show it, and announces no change of it', async () => {
      const pastMidnight = {
        start: new Date('2026-10-05T21:30:00.000Z'),
        end: new Date('2026-10-05T22:30:00.000Z'),
      }
      mountCall()
      await edit({ ...PLANNED, when: pastMidnight })
      expect(inDialog('from').element.value).toBe('23:30')
      expect(inDialog('to').element.value).toBe('23:59')
      await inDialog('edit-topic').setValue('Lesekreis')

      await save()

      expect(changed.mock.calls[0][0].body).toBe(
        invitationFor({
          ...PLANNED,
          topic: 'Lesekreis',
          when: pastMidnight,
          revision: { first: pastMidnight.start, sequence: 1 },
        }),
      )
      expect(delivered).not.toHaveBeenCalled()
    })

    it('waits while the change is on its way, and turns a second press away', async () => {
      const answer = deferred()
      changed.mockReturnValue(answer.promise)
      mountCall()
      await edit()
      await inDialog('edit-topic').setValue('Lesekreis')

      await save()
      expect(inDialog('edit-save').attributes('aria-disabled')).toBe('true')
      await save()
      expect(changed).toHaveBeenCalledTimes(1)

      answer.resolve('')
      await flushPromises()
      expect(open()).toBe(false)
    })

    // Without the thread's way to change a message there is nothing "Save" could do.
    it('does nothing without a way to change the message', async () => {
      mountCall({ change: null })
      await edit()
      await inDialog('day').setValue('2026-10-06')

      await save()

      expect(delivered).not.toHaveBeenCalled()
      expect(open()).toBe(true)
    })
  })

  /** B5: across the border a change counts only once the other server has taken it. */
  describe('a change that did not go through', () => {
    it.each([
      ['NOT_CONFIRMED', 'chatThread.editNotConfirmed {"name":"Lena"}'],
      ['PENDING', 'chatThread.editPending'],
      ['OTHER', 'chatThread.videoEditNotSaved'],
    ])('says why (%s), stays open, and tells nobody of a new time', async (reason, words) => {
      changed.mockResolvedValue(reason)
      mountCall()
      await edit()
      await inDialog('day').setValue('2026-10-06')

      await save()

      expect(problem().text()).toBe(words)
      expect(delivered).not.toHaveBeenCalled()
      expect(open()).toBe(true)
      // What was typed stays, and "Save" can be pressed again.
      expect(inDialog('day').element.value).toBe('2026-10-06')
      expect(inDialog('edit-save').attributes('aria-disabled')).toBe('false')
    })

    it('goes through at the second press, from the invitation as it was', async () => {
      changed.mockResolvedValueOnce('OTHER').mockResolvedValueOnce('')
      mountCall()
      await edit()
      await inDialog('day').setValue('2026-10-06')
      await save()

      await save()

      expect(changed).toHaveBeenCalledTimes(2)
      // The same change both times: nothing was counted for the one that failed.
      expect(changed.mock.calls[1][0]).toEqual(changed.mock.calls[0][0])
      expect(delivered).toHaveBeenCalledTimes(1)
      expect(problem().exists()).toBe(false)
      expect(open()).toBe(false)
    })
  })

  /**
   * ⚠️ The invitation changed, and the message about its time did not go: the dialog says so and
   * stays, and "Save" once more sends the message -- the invitation is not changed a second time.
   */
  describe('the message about the time that did not go', () => {
    it('says so and stays; "Save" once more sends it, and changes the invitation no second time', async () => {
      delivered.mockResolvedValueOnce(false).mockResolvedValueOnce(true)
      mountCall()
      await edit()
      await inDialog('day').setValue('2026-10-06')

      await save()
      expect(problem().text()).toBe('chatThread.videoRescheduledNotSent')
      expect(open()).toBe(true)
      expect(changed).toHaveBeenCalledTimes(1)

      await save()

      expect(changed).toHaveBeenCalledTimes(1)
      expect(delivered).toHaveBeenCalledTimes(2)
      expect(delivered.mock.calls[1][0]).toEqual({
        body: rescheduledTo({ topic: 'Projektbesprechung', when: A_DAY_LATER }),
        notify: 'NONE',
      })
      expect(open()).toBe(false)
    })

    // What the invitation says NOW is what a further change counts from.
    it('counts a further change in the same dialog from what the invitation says now', async () => {
      delivered.mockResolvedValueOnce(false).mockResolvedValueOnce(true)
      mountCall()
      await edit()
      await inDialog('day').setValue('2026-10-06')
      await save()
      await inDialog('edit-topic').setValue('Lesekreis')

      await save()

      expect(changed).toHaveBeenCalledTimes(2)
      expect(changed.mock.calls[1][0].body).toBe(
        invitationFor({
          ...PLANNED,
          topic: 'Lesekreis',
          when: A_DAY_LATER,
          revision: { first: WHEN.start, sequence: 2 },
        }),
      )
      // The message still owed, with the topic as it is now.
      expect(delivered.mock.calls[1][0].body).toBe(
        rescheduledTo({ topic: 'Lesekreis', when: A_DAY_LATER }),
      )
      expect(open()).toBe(false)
    })
  })

  /**
   * ⚠️ The dialog let go while the change is on its way: the change cannot be called back, and
   * the message about a changed time follows it all the same -- nobody is left with a moved call
   * they were not told of.
   */
  describe('the dialog let go while the change is on its way', () => {
    it('still tells of the changed time once the change went through', async () => {
      const answer = deferred()
      changed.mockReturnValue(answer.promise)
      mountCall()
      await edit()
      await inDialog('day').setValue('2026-10-06')
      await save()

      await inDialog('edit-cancel').trigger('click')
      await flushPromises()
      expect(open()).toBe(false)
      answer.resolve('')
      await flushPromises()

      expect(delivered).toHaveBeenCalledWith({
        body: rescheduledTo({ topic: 'Projektbesprechung', when: A_DAY_LATER }),
        notify: 'NONE',
      })
      expect(open()).toBe(false)
    })

    it('tells nobody where the change did not go through, and leaves the next question alone', async () => {
      const answer = deferred()
      changed.mockReturnValue(answer.promise)
      mountCall()
      await edit()
      await inDialog('day').setValue('2026-10-06')
      await save()
      await inDialog('edit-cancel').trigger('click')
      await flushPromises()
      wrapper.vm.ask()
      await flushPromises()

      answer.resolve('NOT_CONFIRMED')
      await flushPromises()

      expect(delivered).not.toHaveBeenCalled()
      // The question opened since says nothing about a change that was not its own.
      expect(inDialog('problem').exists()).toBe(false)
      expect(inDialog('start').attributes('aria-disabled')).toBe('false')
    })
  })

  /**
   * ⛔ The dialog fades out for a quarter of a second after it closed, and the question's state is
   * let go the moment it closes. Drawn from that state, the dialog flipped to the question's first
   * view while fading -- "Anruf starten" under the member's eyes at the end of changing an
   * invitation (measured in the bundle). It keeps the view it had until it is gone.
   */
  describe('while the dialog fades out', () => {
    const isOpen = () => wrapper.find('[data-open]').attributes('data-open') === 'true'

    it('keeps the view of a changed invitation, and is the question again at the next opening', async () => {
      mountCall({}, { fading: true })
      await edit()
      expect(isOpen()).toBe(true)

      await inDialog('edit-cancel').trigger('click')
      await flushPromises()

      expect(isOpen()).toBe(false)
      expect(inDialog('settings-title').text()).toBe('chatThread.videoEditTitle')
      expect(inDialog('edit-topic').element.value).toBe('Projektbesprechung')
      expect(inDialog('edit-server').text()).toBe(`meet.ffmuc.net – ${OPERATOR}`)
      expect(inDialog('plan-body').text()).toBe('chatThread.videoEditBody {"name":"Lena"}')
      expect(inDialog('edit-save').exists()).toBe(true)
      // Not the question's first view, and not the gear's own.
      expect(inDialog('title').exists()).toBe(false)
      expect(inDialog('start').exists()).toBe(false)
      expect(inDialog('plan').exists()).toBe(false)

      wrapper.vm.ask()
      await flushPromises()
      expect(isOpen()).toBe(true)
      expect(inDialog('title').text()).toBe('chatThread.videoAskTitle {"name":"Lena"}')
      expect(inDialog('edit-save').exists()).toBe(false)
    })

    it('keeps it after "Save" as well', async () => {
      mountCall({}, { fading: true })
      await edit()
      await inDialog('edit-topic').setValue('Lesekreis')

      await save()

      expect(isOpen()).toBe(false)
      expect(changed).toHaveBeenCalledTimes(1)
      expect(inDialog('settings-title').text()).toBe('chatThread.videoEditTitle')
      expect(inDialog('title').exists()).toBe(false)
    })

    /**
     * ⛔ What it keeps for the fade are words -- the view, and the server's name. Not the
     * invitation: the room's address is the call's secret, and goes with the question.
     */
    it('keeps no room’s address once the dialog has closed', async () => {
      mountCall({}, { fading: true })
      await edit()
      await inDialog('edit-cancel').trigger('click')
      await flushPromises()

      expect(wrapper.html()).not.toContain('k7m2x9q4t8wz')
      expect(JSON.stringify(wrapper.vm.$.setupState.videoShown)).not.toContain('k7m2x9q4t8wz')
      expect(wrapper.vm.$.setupState.videoShown).toEqual({
        settings: true,
        editing: true,
        server: `meet.ffmuc.net – ${OPERATOR}`,
      })
    })

    // What still fades is only drawn: a press on its "Save" finds no invitation being changed.
    it('does nothing on a press on a button still fading', async () => {
      mountCall({}, { fading: true })
      await edit()
      await inDialog('day').setValue('2026-10-06')
      await inDialog('edit-cancel').trigger('click')
      await flushPromises()

      await save()
      await inDialog('calendar').trigger('click')
      await flushPromises()

      expect(changed).not.toHaveBeenCalled()
      expect(delivered).not.toHaveBeenCalled()
      expect(isOpen()).toBe(false)
    })

    // The same for the gear's own view: it does not flip back to the question while it fades.
    it('keeps the gear’s view of a call that was planned', async () => {
      serverRooms.mockResolvedValue({
        data: { chatVideoRoom: { url: ROOM, host: 'meet.ffmuc.net', operator: OPERATOR } },
      })
      mountCall({}, { fading: true })
      wrapper.vm.ask()
      await flushPromises()
      await inDialog('gear').trigger('click')
      await flushPromises()
      await inDialog('day').setValue('2026-10-06')
      await inDialog('from').setValue('14:00')
      await inDialog('to').setValue('15:00')

      await inDialog('plan').trigger('click')
      await flushPromises()

      expect(delivered).toHaveBeenCalledTimes(1)
      expect(isOpen()).toBe(false)
      expect(inDialog('plan').exists()).toBe(true)
      expect(inDialog('title').exists()).toBe(false)
      // "Back" in the open dialog still leads to the question, as ever.
      wrapper.vm.ask()
      await flushPromises()
      await inDialog('gear').trigger('click')
      await flushPromises()
      expect(inDialog('plan').exists()).toBe(true)
      await inDialog('back').trigger('click')
      await flushPromises()
      expect(inDialog('title').exists()).toBe(true)
      expect(inDialog('plan').exists()).toBe(false)
    })
  })

  /**
   * The tools of the gear's view work on the invitation's own room: the calendar file names the
   * call as the invitation will once it is saved, the link is the room with the topic as the
   * field says it.
   */
  describe('the calendar file and the link', () => {
    const fileLines = () => savedFiles.mock.calls[0][1].replace(/\r\n /g, '').split('\r\n')

    it('names a changed call by its first start, one more change counted', async () => {
      mountCall()
      await edit()
      await inDialog('day').setValue('2026-10-06')

      await inDialog('calendar').trigger('click')
      await flushPromises()

      const lines = fileLines()
      // The room's name and the FIRST start, 2026-10-05T12:00Z.
      expect(lines).toContain('UID:k7m2x9q4t8wz-1791201600@gradido')
      expect(lines).toContain('SEQUENCE:1')
      expect(lines).toContain('DTSTART:20261006T120000Z')
      expect(lines).toContain('DTEND:20261006T130000Z')
      expect(lines).toContain(
        `URL:${withChatVideoTopic(ROOM, 'Projektbesprechung', A_DAY_LATER, { first: WHEN.start, sequence: 1 })}`,
      )
      // Nothing was changed by it, and nothing sent.
      expect(changed).not.toHaveBeenCalled()
      expect(delivered).not.toHaveBeenCalled()
      expect(serverRooms).not.toHaveBeenCalled()
    })

    // Nothing changed: the file is the one the invitation's own button gives.
    it('counts nothing where nothing was changed', async () => {
      mountCall()
      await edit()

      await inDialog('calendar').trigger('click')
      await flushPromises()

      const lines = fileLines()
      expect(lines).toContain('UID:k7m2x9q4t8wz-1791201600@gradido')
      expect(lines).toContain('SEQUENCE:0')
      expect(lines).toContain(`URL:${withChatVideoTopic(ROOM, 'Projektbesprechung', WHEN)}`)
    })

    it('copies the invitation’s room with the topic as the field says it, and no time', async () => {
      const copied = vi.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: copied },
        configurable: true,
      })
      mountCall()
      await edit()
      await inDialog('edit-topic').setValue('Lesekreis')

      await inDialog('copy').trigger('click')
      await flushPromises()

      expect(copied).toHaveBeenCalledWith(withChatVideoTopic(ROOM, 'Lesekreis'))
      expect(serverRooms).not.toHaveBeenCalled()
      delete navigator.clipboard
    })
  })
})
