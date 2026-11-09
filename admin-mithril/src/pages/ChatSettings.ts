// AI-GENERATED — not an architecture reference
import {
  chatVideoServers,
  checkChatVideoServersNow,
  createChatVideoServer,
  deleteChatVideoServer,
  updateChatVideoServer,
} from '@admin/graphql/chatVideoServers.graphql'
import classes from '@admin/pages/ChatSettings.module.css'
import m, { type Children, type ClassComponent } from 'mithril'
import * as v from 'valibot'
import { Modal } from '@/components/bootstrap/Modal'
import { toastError, toastSuccess } from '@/components/Toasts'
import { checkReasonKey, refusalWords, serverInput } from '@/data/ChatVideoServer.logic'
import {
  type ChatVideoServer,
  chatVideoServerSchema,
  type ServerValues,
} from '@/data/ChatVideoServer.schema'
import { graphqlRequest } from '@/graphql/client'
import { distanceToNow, t } from '@/i18n'

// `max`: the columns of chat_video_servers -- the fields cannot take more, the server refuses more.
const FIELDS = {
  baseUrl: { label: 'chatAdmin.form.baseUrl', test: 'base-url', max: 255 },
  operator: { label: 'chatAdmin.form.operator', test: 'operator', max: 120 },
  roomPrefix: { label: 'chatAdmin.form.prefix', test: 'prefix', max: 40 },
  note: { label: 'chatAdmin.form.note', test: 'note', max: 255 },
}

type Editing = ServerValues & { id: number }
type Removal = { server: ChatVideoServer; removing: boolean }

const emptyForm = () => ({ baseUrl: '', operator: '', roomPrefix: '', note: '', active: true })
const value = (event: Event) => (event.target as HTMLInputElement).value

const details = ({ operator, roomPrefix, note }: ChatVideoServer) =>
  [
    operator || t('chatAdmin.servers.noOperator'),
    roomPrefix ? t('chatAdmin.servers.prefix', { prefix: roomPrefix }) : null,
    note,
  ]
    .filter(Boolean)
    .join(' · ')

const state = ({ check }: ChatVideoServer): [string, string] => {
  if (!check) {
    return ['text-secondary', t('chatAdmin.state.unchecked')]
  }
  if (check.ok) {
    return ['text-success', t('chatAdmin.state.ok', { ms: check.latencyMs ?? '–' })]
  }
  const reason = check.reason ?? ''
  const key = checkReasonKey(reason)
  return ['text-danger', t('chatAdmin.state.failed', { reason: key ? t(key) : reason })]
}

/**
 * The Jitsi servers the chat's video calls take a room from, for administrators: listed with how
 * they answered the last check, switched in and out of the random choice, edited, removed, added.
 * The page shows what the running server holds: after every change and every check it asks anew.
 */
export class ChatSettings implements ClassComponent {
  private servers: ChatVideoServer[] = []
  // "Nothing there" is only said once the server has answered.
  private loaded = false
  private checking = false
  private form = emptyForm()
  private creating = false
  private editing: Editing | null = null
  private saving = false
  private removal: Removal | null = null
  // What a box shows while its change is under way: refused, it goes back to what the server holds.
  // Fixed: one entry per row -- the old page locked only the row switched last, and the first
  // answer freed it.
  private readonly pendingActive = new Map<number, boolean>()

  oninit() {
    this.load()
  }

  private async load() {
    const answer = await graphqlRequest(chatVideoServers)
    if (!answer.success) {
      toastError(answer.error.message)
      return
    }
    this.servers = v.parse(
      v.object({ chatVideoServers: v.array(chatVideoServerSchema) }),
      answer.value,
    ).chatVideoServers
    this.loaded = true
  }

  // A refusal leaves the list as it may no longer be: another tab may have changed it.
  private async failed(message: string) {
    const words = refusalWords(message)
    toastError(words ? t(...words) : message)
    await this.load()
  }

  private async checkNow() {
    this.checking = true
    const answer = await graphqlRequest(checkChatVideoServersNow)
    this.checking = false
    if (!answer.success) {
      await this.failed(answer.error.message)
      return
    }
    const rows = v.parse(
      v.object({ checkChatVideoServersNow: v.array(chatVideoServerSchema) }),
      answer.value,
    ).checkChatVideoServersNow
    toastSuccess(
      t('chatAdmin.servers.checked', {
        ok: rows.filter((row) => row.check?.ok).length,
        count: rows.length,
      }),
    )
    await this.load()
  }

  private async setActive(server: ChatVideoServer, active: boolean) {
    this.pendingActive.set(server.id, active)
    // the fields as the row holds them, untrimmed: only the tick changes
    const { baseUrl, operator, roomPrefix, note } = server
    const answer = await graphqlRequest(updateChatVideoServer, {
      id: server.id,
      input: { baseUrl, operator, roomPrefix, note, active },
    })
    if (answer.success) {
      toastSuccess(
        t(active ? 'chatAdmin.servers.activeOn' : 'chatAdmin.servers.activeOff', {
          host: server.host,
        }),
      )
      await this.load()
    } else {
      await this.failed(answer.error.message)
    }
    this.pendingActive.delete(server.id)
  }

  // No tick: the edit row does not show it, and the box beside the row may have switched it since,
  // in another tab. The server keeps the row's own.
  private async save(editing: Editing) {
    this.saving = true
    const answer = await graphqlRequest(updateChatVideoServer, {
      id: editing.id,
      input: serverInput(editing),
    })
    this.saving = false
    if (!answer.success) {
      await this.failed(answer.error.message)
      return
    }
    toastSuccess(t('chatAdmin.updated'))
    // Fixed: only this edit closes -- the old page closed whichever row was opened meanwhile.
    if (this.editing === editing) {
      this.editing = null
    }
    await this.load()
  }

  private async remove(removal: Removal) {
    removal.removing = true
    const answer = await graphqlRequest(deleteChatVideoServer, { id: removal.server.id })
    removal.removing = false
    // Fixed: only this question closes -- the old page closed whichever was asked meanwhile.
    if (this.removal === removal) {
      this.removal = null
    }
    if (!answer.success) {
      await this.failed(answer.error.message)
      return
    }
    toastSuccess(t('chatAdmin.removed'))
    await this.load()
  }

  private async create() {
    this.creating = true
    const answer = await graphqlRequest(createChatVideoServer, {
      input: { ...serverInput(this.form), active: this.form.active },
    })
    this.creating = false
    if (!answer.success) {
      await this.failed(answer.error.message)
      return
    }
    toastSuccess(t('chatAdmin.created'))
    this.form = emptyForm()
    await this.load()
  }

  view() {
    const { form } = this
    const formGroup = (key: keyof ServerValues, input: object, hint?: string) =>
      m('.b-form-group.mb-2', { role: 'group' }, [
        m('label.form-label.d-block', { for: `chat-server-${key}` }, t(FIELDS[key].label)),
        m(`input.form-control#chat-server-${key}`, {
          type: 'text',
          maxlength: FIELDS[key].max,
          'data-test': `form-${FIELDS[key].test}`,
          value: form[key],
          oninput: (event: Event) => {
            form[key] = value(event)
          },
          ...input,
        }),
        hint ? m('small.text-muted.d-block.mt-1', hint) : null,
      ])
    return m('.chat-settings', [
      m('.h2.mb-3', t('chatAdmin.title')),
      m('div', { class: classes.chatSettingsBody }, [
        m('.h4.mt-4.mb-1', t('chatAdmin.servers.title')),
        m('small.text-muted.d-block', t('chatAdmin.servers.hint')),
        m('small.text-muted.d-block.mb-3', t('chatAdmin.servers.fairness')),
        m(
          'button.btn.btn-md.btn-outline-primary.mb-3',
          {
            type: 'button',
            disabled: this.checking,
            'data-test': 'check-now',
            onclick: () => this.checkNow(),
          },
          t(this.checking ? 'chatAdmin.servers.checking' : 'chatAdmin.servers.checkNow'),
        ),
        this.loaded && this.servers.length === 0
          ? m('.text-muted.mb-3', { 'data-test': 'servers-empty' }, t('chatAdmin.servers.empty'))
          : m(
              'ul.chat-server-list.list-unstyled',
              this.servers.map((server) =>
                m(
                  'li',
                  {
                    key: server.id,
                    class: classes.chatServerRow,
                    'data-test': `server-${server.id}`,
                  },
                  this.editing?.id === server.id ? this.editRow(this.editing) : this.row(server),
                ),
              ),
            ),
        m('.h5.mt-4.mb-2', t('chatAdmin.form.addTitle')),
        m('div', { class: classes.chatServerForm }, [
          formGroup('baseUrl', { placeholder: 'https://' }, t('chatAdmin.form.baseUrlHint')),
          formGroup('operator', {}, t('chatAdmin.form.operatorHint')),
          formGroup('roomPrefix', {}, t('chatAdmin.form.prefixHint')),
          formGroup('note', {}),
          m('.form-check.mb-3', [
            m('input.form-check-input#chat-server-active', {
              type: 'checkbox',
              'data-test': 'form-active',
              checked: form.active,
              onchange: (event: Event) => {
                form.active = (event.target as HTMLInputElement).checked
              },
            }),
            m('label.form-check-label', { for: 'chat-server-active' }, t('chatAdmin.form.active')),
          ]),
          m(
            'button.btn.btn-md.btn-primary',
            {
              type: 'button',
              disabled: this.creating || form.baseUrl.trim() === '',
              'data-test': 'form-add',
              onclick: () => this.create(),
            },
            t('chatAdmin.form.add'),
          ),
        ]),
      ]),
      this.removal ? this.removeDialog(this.removal) : null,
    ])
  }

  private row(server: ChatVideoServer): Children {
    const [stateClass, stateText] = state(server)
    const { check } = server
    return [
      m('div', { class: classes.chatServerWhat }, [
        m('div', { class: classes.chatServerAddress }, server.baseUrl),
        m(
          '.text-muted',
          { class: classes.chatServerDetails, 'data-test': `details-${server.id}` },
          details(server),
        ),
      ]),
      m('div', { class: classes.chatServerState, 'data-test': `state-${server.id}` }, [
        m('span.chat-server-state-word', { class: stateClass }, stateText),
        check
          ? [
              m(
                'small.d-block.text-muted',
                t('chatAdmin.state.checkedAt', { when: distanceToNow(check.checkedAt) }),
              ),
              m('small.d-block.text-muted', t('chatAdmin.servers.picks', { count: check.picks })),
            ]
          : null,
      ]),
      m('div', { class: classes.chatServerControls }, [
        m('.form-check.chat-server-active', [
          m(`input.form-check-input#chat-server-active-${server.id}`, {
            type: 'checkbox',
            title: t('chatAdmin.servers.activeTitle'),
            'data-test': `active-${server.id}`,
            checked: this.pendingActive.get(server.id) ?? server.active,
            disabled: this.pendingActive.has(server.id),
            onchange: (event: Event) =>
              this.setActive(server, (event.target as HTMLInputElement).checked),
          }),
          m(
            'label.form-check-label',
            { for: `chat-server-active-${server.id}` },
            t('chatAdmin.servers.active'),
          ),
        ]),
        m(
          'button.btn.btn-sm.btn-outline-secondary',
          {
            type: 'button',
            'data-test': `edit-${server.id}`,
            onclick: () => {
              const { id, baseUrl, operator, roomPrefix, note } = server
              this.editing = {
                id,
                baseUrl,
                operator: operator ?? '',
                roomPrefix: roomPrefix ?? '',
                note: note ?? '',
              }
            },
          },
          t('chatAdmin.edit'),
        ),
        m(
          'button.btn.btn-sm.btn-outline-danger',
          {
            type: 'button',
            'data-test': `remove-${server.id}`,
            onclick: () => {
              this.removal = { server, removing: false }
            },
          },
          t('chatAdmin.remove'),
        ),
      ]),
    ]
  }

  private editRow(editing: Editing) {
    const field = (key: keyof ServerValues) =>
      m('input.form-control', {
        type: 'text',
        'aria-label': t(FIELDS[key].label),
        // the address has none: an address is plain to see
        placeholder: key === 'baseUrl' ? undefined : t(FIELDS[key].label),
        maxlength: FIELDS[key].max,
        'data-test': `edit-${FIELDS[key].test}`,
        value: editing[key],
        oninput: (event: Event) => {
          editing[key] = value(event)
        },
      })
    return m('div', { class: classes.chatServerEdit }, [
      field('baseUrl'),
      field('operator'),
      field('roomPrefix'),
      field('note'),
      m('div', { class: classes.chatServerButtons }, [
        m(
          'button.btn.btn-sm.btn-primary',
          {
            type: 'button',
            disabled: this.saving || editing.baseUrl.trim() === '',
            'data-test': 'edit-save',
            onclick: () => this.save(editing),
          },
          t('chatAdmin.save'),
        ),
        m(
          'button.btn.btn-sm.btn-secondary',
          {
            type: 'button',
            'data-test': 'edit-cancel',
            onclick: () => {
              this.editing = null
            },
          },
          t('overlay.cancel'),
        ),
      ]),
    ])
  }

  private removeDialog(removal: Removal) {
    const close = () => {
      this.removal = null
    }
    return m(
      Modal,
      {
        title: t('chatAdmin.removeDialog.title'),
        onclose: close,
        footer: [
          m(
            'button.btn.btn-md.btn-secondary',
            { type: 'button', onclick: close },
            t('overlay.cancel'),
          ),
          m(
            'button.btn.btn-md.btn-danger',
            { type: 'button', disabled: removal.removing, onclick: () => this.remove(removal) },
            t('chatAdmin.removeDialog.confirm'),
          ),
        ],
      },
      [
        m('p', t('chatAdmin.removeDialog.question', { host: removal.server.host })),
        m('small.text-muted', t('chatAdmin.removeDialog.hint')),
      ],
    )
  }
}
