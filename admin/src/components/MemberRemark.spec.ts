// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { type Plugin, ref } from 'vue'
import type { RemarkStatus, UserRemark, UserRemarkState } from '@/composables/useUserRemark'
import { CONFIG } from '@/config'
import { i18n } from '@/i18n'
import IMdiNoteText from '~icons/mdi/note-text'
import IMdiNoteTextOutline from '~icons/mdi/note-text-outline'
import { MemberRemarkEditor, MemberRemarkLine, MemberRemarkToggle } from './MemberRemark'

const BY_BERND: UserRemark = {
  remark: 'Bürgermeisterin von Lieblingsstadt.\nTochter von Ramona.',
  updatedAt: '2026-10-28T08:40:00.000Z',
  updatedByName: 'Bernd Hückstädt',
}

/** A state as the card's composable holds it, with its actions as spies. */
const stateWith = (fields: {
  loaded?: boolean
  saved?: UserRemark | null
  draft?: string
  open?: boolean
  status?: RemarkStatus
}): UserRemarkState => ({
  loaded: ref(fields.loaded ?? true),
  saved: ref(fields.saved ?? null),
  draft: ref(fields.draft ?? fields.saved?.remark ?? ''),
  open: ref(fields.open ?? false),
  status: ref(fields.status ?? 'idle'),
  take: vi.fn(),
  input: vi.fn(),
  toggle: vi.fn(),
  close: vi.fn(),
  retry: vi.fn(),
  flush: vi.fn(async () => undefined),
})

describe('MemberRemarkToggle', () => {
  const button = (state: UserRemarkState) =>
    mount(MemberRemarkToggle, { props: { state, name: 'Leoni', controls: 'remark-field' } }).find(
      'button',
    )

  it('is the empty sign of a note where there is no remark, the filled one where there is', () => {
    const empty = mount(MemberRemarkToggle, { props: { state: stateWith({}), name: 'Leoni' } })
    expect(empty.findComponent(IMdiNoteTextOutline).exists()).toBe(true)
    expect(empty.findComponent(IMdiNoteText).exists()).toBe(false)

    const filled = mount(MemberRemarkToggle, {
      props: { state: stateWith({ saved: BY_BERND }), name: 'Leoni' },
    })
    expect(filled.findComponent(IMdiNoteText).exists()).toBe(true)
    expect(filled.findComponent(IMdiNoteTextOutline).exists()).toBe(false)
  })

  it('is named after the member, as a tooltip and for a screen reader', () => {
    const toggle = button(stateWith({}))
    expect(toggle.attributes('title')).toBe('remark.title')
    expect(toggle.attributes('aria-label')).toBe('remark.title')
    expect(toggle.attributes('type')).toBe('button')
  })

  // Drawn at once, so that what comes with the answer moves nothing in the line -- but not to be
  // pressed before the remark is read.
  it('stands there before the remark is read, and cannot be pressed until then', () => {
    expect(button(stateWith({ loaded: false })).attributes('disabled')).toBeDefined()
    expect(button(stateWith({ loaded: true })).attributes('disabled')).toBeUndefined()
  })

  it('says whether the field is open, and names it while it is', () => {
    const closed = button(stateWith({}))
    expect(closed.attributes('aria-expanded')).toBe('false')
    expect(closed.attributes('aria-controls')).toBeUndefined()
    const opened = button(stateWith({ open: true }))
    expect(opened.attributes('aria-expanded')).toBe('true')
    expect(opened.attributes('aria-controls')).toBe('remark-field')
  })

  it('opens and closes the field', async () => {
    const state = stateWith({})
    await button(state).trigger('click')
    expect(state.toggle).toHaveBeenCalledTimes(1)
  })

  // Edge to edge with the arrow or the bubble before it, as the arrow stands behind the pin.
  it('takes back the 2 px the button before it gives', () => {
    expect(button(stateWith({})).attributes('style')).toContain('margin-left: 0.125rem')
  })
})

describe('MemberRemarkLine', () => {
  it('shows nothing where there is no remark', () => {
    const line = mount(MemberRemarkLine, { props: { state: stateWith({}) } })
    expect(line.find('[data-test="member-remark"]').exists()).toBe(false)
  })

  it('shows the remark with its line breaks, named for a screen reader', () => {
    const line = mount(MemberRemarkLine, { props: { state: stateWith({ saved: BY_BERND }) } })
    const item = line.find('[data-test="member-remark"]')
    expect(item.exists()).toBe(true)
    expect(item.classes()).toContain('list-group-item')
    expect(item.find('.visually-hidden').text()).toBe('remark.label:')
    expect(item.text()).toContain('Bürgermeisterin von Lieblingsstadt.\nTochter von Ramona.')
  })
})

describe('MemberRemarkEditor', () => {
  let wrapper: ReturnType<typeof mount>

  const mountEditor = (state: UserRemarkState, plugins: Plugin[] = []) => {
    wrapper = mount(MemberRemarkEditor, {
      props: { state, name: 'Leoni', fieldId: 'remark-field' },
      attachTo: document.body,
      ...(plugins.length ? { global: { plugins } } : {}),
    })
    return wrapper
  }
  const field = () => wrapper.find('textarea')

  afterEach(() => {
    wrapper.unmount()
    i18n.global.locale.value = 'en'
  })

  beforeEach(() => {
    i18n.global.locale.value = 'en'
  })

  it('opens with the words, under its label, and takes the keyboard at their end', () => {
    mountEditor(stateWith({ saved: BY_BERND, open: true }))
    expect(field().element.value).toBe(BY_BERND.remark)
    expect(document.activeElement).toBe(field().element)
    expect(field().element.selectionStart).toBe(BY_BERND.remark.length)
    expect(field().attributes('id')).toBe('remark-field')
    expect(wrapper.find('label').attributes('for')).toBe('remark-field')
  })

  it('lets through as many letters as the server takes', () => {
    mountEditor(stateWith({ open: true }))
    expect(field().attributes('maxlength')).toBe('2000')
  })

  it('hands every key to the state', async () => {
    const state = stateWith({ open: true })
    mountEditor(state)
    await field().setValue('Tochter von Ramona')
    expect(state.input).toHaveBeenLastCalledWith('Tochter von Ramona')
  })

  // Escape closes the field wherever the keyboard stands in it, not only in the words.
  it('closes with Escape from "Fertig" and from "Noch einmal" as well', async () => {
    mountEditor(stateWith({ open: true, status: 'failed' }))
    await wrapper.find('[data-test="member-remark-done"]').trigger('keydown', { key: 'Escape' })
    await wrapper.find('[data-test="member-remark-retry"]').trigger('keydown', { key: 'Escape' })
    expect(wrapper.emitted('done')).toHaveLength(2)
  })

  it('closes with "Fertig" and with Escape', async () => {
    mountEditor(stateWith({ open: true }))
    await wrapper.find('[data-test="member-remark-done"]').trigger('click')
    await field().trigger('keydown', { key: 'Escape' })
    expect(wrapper.emitted('done')).toHaveLength(2)
  })

  it('says who sees it, and the field names that line', () => {
    mountEditor(stateWith({ open: true }))
    const describedBy = field().attributes('aria-describedby') as string
    expect(wrapper.find(`#${describedBy}`).text()).toBe('remark.private')
  })

  it('says who wrote it last and when, in the moderator’s language', () => {
    mountEditor(stateWith({ saved: BY_BERND, open: true }), [i18n])
    i18n.global.locale.value = 'de'
    return wrapper.vm.$nextTick().then(() => {
      expect(wrapper.find('[data-test="member-remark-last-changed"]').text()).toBe(
        'Zuletzt: Bernd Hückstädt, 28.10.2026, 08:40',
      )
    })
  })

  it('says when, where the moderator who wrote it is gone', async () => {
    mountEditor(stateWith({ saved: { ...BY_BERND, updatedByName: null }, open: true }), [i18n])
    i18n.global.locale.value = 'de'
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-test="member-remark-last-changed"]').text()).toBe(
      'Zuletzt: 28.10.2026, 08:40',
    )
  })

  it('says nothing about a last change where there is no remark yet', () => {
    mountEditor(stateWith({ open: true }))
    expect(wrapper.find('[data-test="member-remark-last-changed"]').exists()).toBe(false)
  })

  it('shows that it saves and that it saved, without announcing either', () => {
    mountEditor(stateWith({ open: true, status: 'saving' }))
    const status = wrapper.find('[data-test="member-remark-status"]')
    expect(status.text()).toBe('remark.saving')
    expect(status.attributes('role')).toBeUndefined()
    wrapper.unmount()
    mountEditor(stateWith({ open: true, status: 'saved' }))
    expect(wrapper.find('[data-test="member-remark-status"]').text()).toBe('remark.saved')
  })

  it('announces a failed save, ties it to the field, and offers to try again', async () => {
    const state = stateWith({ open: true, status: 'failed' })
    mountEditor(state)
    const alert = wrapper.find('[role="alert"]')
    expect(alert.text()).toContain('remark.failed')
    expect(field().attributes('aria-describedby')).toContain(alert.attributes('id'))
    await wrapper.find('[data-test="member-remark-retry"]').trigger('click')
    expect(state.retry).toHaveBeenCalledTimes(1)
  })

  it('ties no trouble to the field while there is none', () => {
    mountEditor(stateWith({ open: true }))
    expect((field().attributes('aria-describedby') as string).split(' ')).toHaveLength(1)
  })
})

// Crea's window has a frame of its own (Bernd's choice "A, ohne Rahmen", 28.10.2026).
describe('plain', () => {
  it('draws the line and the field without the frame of a list row', () => {
    const line = mount(MemberRemarkLine, {
      props: { state: stateWith({ saved: BY_BERND }), plain: true },
    })
    expect(line.find('[data-test="member-remark"]').classes()).not.toContain('list-group-item')
    const field = mount(MemberRemarkEditor, {
      props: {
        state: stateWith({ saved: BY_BERND, open: true }),
        name: 'Leoni',
        fieldId: 'f',
        plain: true,
      },
    })
    expect(field.find('[data-test="member-remark-editor"]').classes()).not.toContain(
      'list-group-item',
    )
  })

  it('keeps the frame in the card', () => {
    const line = mount(MemberRemarkLine, { props: { state: stateWith({ saved: BY_BERND }) } })
    expect(line.find('[data-test="member-remark"]').classes()).toContain('list-group-item')
  })
})

describe('who reads the remark', () => {
  const hint = () => {
    const wrapper = mount(MemberRemarkEditor, {
      props: { state: stateWith({ open: true }), name: 'Leoni', fieldId: 'f' },
    })
    const describedBy = wrapper.find('textarea').attributes('aria-describedby') ?? ''
    return wrapper.find(`#${describedBy}`).text()
  }
  const was = CONFIG.ANTHROPIC_ACTIVE

  afterEach(() => {
    CONFIG.ANTHROPIC_ACTIVE = was
  })

  it('names Crea where she is switched on', () => {
    CONFIG.ANTHROPIC_ACTIVE = true
    expect(hint()).toBe('remark.privateWithCrea')
  })

  it('names the moderators only where she is not', () => {
    CONFIG.ANTHROPIC_ACTIVE = false
    expect(hint()).toBe('remark.private')
  })
})
