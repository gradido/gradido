// AI-GENERATED — not an architecture reference
import {
  creaSettings,
  setCreaMatchingKeying,
  setCreaSettings,
  setFirstCreationSigner,
  testCreaModel,
} from '@admin/graphql/crea.graphql'
import { searchUsers } from '@admin/graphql/searchUsers'
import classes from '@admin/pages/CreaSettings.module.css'
import m, { type Children, type ClassComponent } from 'mithril'
import * as v from 'valibot'
import { toastError, toastSuccess } from '@/components/Toasts'
import {
  fastModeNoteKey,
  maySign,
  refusedSignerCode,
  signerName,
  signerReasonKey,
} from '@/data/CreaSettings.logic'
import {
  creaModelTestSchema,
  creaSettingsSchema,
  type FirstCreationSigner,
  firstCreationSignerSchema,
  savedCreaSettingsSchema,
} from '@/data/CreaSettings.schema'
import { searchUsersSchema } from '@/data/SearchedMember.schema'
import { graphqlRequest } from '@/graphql/client'
import { t } from '@/i18n'

const MODEL_PRESETS = [
  'claude-sonnet-5',
  'claude-opus-5',
  'claude-haiku-4-5',
  'claude-fable-5',
  'claude-opus-4-8',
  'claude-sonnet-4-6',
]
const EFFORTS = [
  ['disabled', 'effortDisabled'],
  ['low', 'effortLow'],
  ['medium', 'effortMedium'],
  ['high', 'effortHigh'],
  ['xhigh', 'effortXhigh'],
  ['max', 'effortMax'],
]
// a member search costs the server: asked once the typing pauses
const SEARCH_PAUSE_MS = 300

const hint = (text: string) => m('small.text-muted.d-block.mt-1', text)
const checked = (event: Event) => (event.target as HTMLInputElement).checked
const value = (event: Event) => (event.target as HTMLInputElement).value
const reasonText = (code: string) => {
  const key = signerReasonKey(code)
  return key ? t(key) : code
}

// a group with a field its label names, and one of several controls under a heading
const labelledGroup = (id: string, label: string, children: Children) =>
  m('.b-form-group.mb-3', { role: 'group' }, [
    m('label.form-label.d-block', { for: id }, label),
    children,
  ])
const fieldset = (legend: string | null, children: Children) =>
  m('fieldset.b-form-group.mb-3', [
    legend
      ? m('legend.form-label.bv-no-focus-ring.col-form-label.pt-0', { tabindex: -1 }, legend)
      : null,
    children,
  ])
const checkbox = (
  id: string,
  label: string,
  isChecked: boolean,
  onchange: (event: Event) => void,
) =>
  m('.form-check', [
    m('input.form-check-input', { id, type: 'checkbox', checked: isChecked, onchange }),
    m('label.form-check-label', { for: id }, label),
  ])

/**
 * Crea's settings, for administrators: the model of the moderation's support, who signs first
 * creations, and whether Crea keys matching entries -- each saved on its own, so that saving one
 * cannot carry a stale value of another. Nothing is sent before the server's values are read: the
 * form holds display defaults until then, and saving them would clear what is set.
 */
export class CreaSettings implements ClassComponent {
  private loaded = false
  private form = { model: '', effort: 'disabled', fastMode: false, keying: false }
  private defaultModel = ''
  // the switch as the server holds it, apart from the box a click moves; null until read
  private keyingStored: boolean | null = null
  private signer: FirstCreationSigner | null = null
  private saving = false
  private testing = false
  private savingKeying = false
  private savingSigner = false
  private signerQuery = ''
  private signerOptions: { value: number; text: string }[] = []
  private signerChoice: number | null = null
  private searchPause: ReturnType<typeof setTimeout> | undefined
  // the search last asked: an answer to one before is dropped
  private searched = 0

  async oninit() {
    const answer = await graphqlRequest(creaSettings)
    if (!answer.success) {
      toastError(answer.error.message)
      return
    }
    const settings = v.parse(
      v.object({ creaSettings: creaSettingsSchema }),
      answer.value,
    ).creaSettings
    this.form = {
      model: settings.model ?? '',
      effort: settings.effort,
      fastMode: settings.fastMode,
      keying: settings.matchingKeyingActive,
    }
    this.defaultModel = settings.defaultModel
    this.signer = settings.firstCreationSigner
    this.keyingStored = settings.matchingKeyingActive
    this.loaded = true
  }

  onremove() {
    clearTimeout(this.searchPause)
  }

  // the keying switch is not in here: it has its own mutation and its own button
  private input() {
    const { model, effort, fastMode } = this.form
    return { model: model.trim() || null, effort, fastMode }
  }

  private async save() {
    this.saving = true
    const answer = await graphqlRequest(setCreaSettings, { input: this.input() })
    this.saving = false
    if (!answer.success) {
      toastError(answer.error.message)
      return
    }
    const saved = v.parse(
      v.object({ setCreaSettings: savedCreaSettingsSchema }),
      answer.value,
    ).setCreaSettings
    this.form = {
      ...this.form,
      model: saved.model ?? '',
      effort: saved.effort,
      fastMode: saved.fastMode,
    }
    this.defaultModel = saved.defaultModel
    toastSuccess(t('crea.settings.savedModeration'))
  }

  private async test() {
    this.testing = true
    const answer = await graphqlRequest(testCreaModel, { input: this.input() })
    this.testing = false
    if (!answer.success) {
      toastError(answer.error.message)
      return
    }
    const result = v.parse(
      v.object({ testCreaModel: creaModelTestSchema }),
      answer.value,
    ).testCreaModel
    if (result.code === 'api_inactive') {
      toastError(t('crea.settings.testInactive'))
    } else if (result.ok) {
      const note = fastModeNoteKey(result.fastMode)
      toastSuccess(
        t('crea.settings.testOk', { message: result.message || t('crea.settings.testNoText') }) +
          (note ? ` ${t(note, { detail: result.fastModeDetail })}` : ''),
      )
    } else {
      toastError(t('crea.settings.testFail', { message: result.message }))
    }
  }

  private async saveKeying() {
    this.savingKeying = true
    // what is sent, read before the answer: a click meanwhile is the moderator's, unsaved
    const asked = this.form.keying
    const answer = await graphqlRequest(setCreaMatchingKeying, { active: asked })
    this.savingKeying = false
    if (!answer.success) {
      toastError(answer.error.message)
      return
    }
    const stored = v.parse(
      v.object({ setCreaMatchingKeying: v.boolean() }),
      answer.value,
    ).setCreaMatchingKeying
    this.keyingStored = stored
    if (this.form.keying === asked) {
      this.form.keying = stored
    }
    // stored otherwise than asked: somebody else switched in between
    if (stored === asked) {
      toastSuccess(t('crea.settings.savedMatching'))
    } else {
      toastError(t('crea.settings.matchingChangedElsewhere'))
    }
  }

  private typeSignerQuery(query: string) {
    this.signerQuery = query
    clearTimeout(this.searchPause)
    if (query.trim().length < 2) {
      this.searched += 1
      this.showSigners([])
      return
    }
    this.searchPause = setTimeout(() => this.searchSigners(query.trim()), SEARCH_PAUSE_MS)
  }

  private async searchSigners(query: string) {
    const search = ++this.searched
    const answer = await graphqlRequest(searchUsers, {
      query,
      filters: { byActivated: true, byDeleted: false },
      currentPage: 1,
      pageSize: 25,
      order: 'ASC',
    })
    if (search !== this.searched || !answer.success) {
      return
    }
    this.showSigners(
      v
        .parse(searchUsersSchema, answer.value)
        .searchUsers.userList.filter(({ role }) => maySign(role))
        .map(({ userId, firstName, lastName, role }) => ({
          value: userId,
          text: `${firstName} ${lastName} · ${role}`,
        })),
    )
  }

  // a choice stands only while it is on the list: Save would send one the list no longer shows
  private showSigners(options: CreaSettings['signerOptions']) {
    this.signerOptions = options
    if (!options.some(({ value }) => value === this.signerChoice)) {
      this.signerChoice = null
    }
  }

  // `userId` null takes the signer away
  private async setSigner(userId: number | null) {
    this.savingSigner = true
    const answer = await graphqlRequest(setFirstCreationSigner, { userId })
    this.savingSigner = false
    if (!answer.success) {
      const code = refusedSignerCode(answer.error.message)
      toastError(
        code
          ? t('crea.settings.signerRefused', { reason: reasonText(code) })
          : answer.error.message,
      )
      return
    }
    this.signer = v.parse(
      v.object({ setFirstCreationSigner: v.nullable(firstCreationSignerSchema) }),
      answer.value,
    ).setFirstCreationSigner
    if (userId === null) {
      toastSuccess(t('crea.settings.removedSigner'))
    } else {
      this.typeSignerQuery('')
      toastSuccess(t('crea.settings.savedSigner'))
    }
  }

  view() {
    const { form, loaded } = this
    return m('.crea-settings', [
      m('.h2.mb-3', t('crea.settings.title')),
      m('div', { class: classes.creaSettingsForm }, [
        m('.h4.mt-4.mb-1', t('crea.settings.sectionModeration')),
        m('small.text-muted.d-block.mb-3', t('crea.settings.sectionModerationHint')),
        labelledGroup('crea-model', t('crea.settings.model'), [
          m('input.form-control#crea-model', {
            type: 'text',
            placeholder: t('crea.settings.modelPlaceholder', { model: this.defaultModel }),
            value: form.model,
            oninput: (event: Event) => {
              form.model = value(event)
            },
          }),
          // a preset fills the field; the list keeps what was picked
          m(
            'select.form-select.mt-2',
            {
              onchange: (event: Event) => {
                if (value(event)) {
                  form.model = value(event)
                }
              },
            },
            [
              m('option', { value: '' }, t('crea.settings.presetPlaceholder')),
              ...MODEL_PRESETS.map((preset) => m('option', { value: preset }, preset)),
            ],
          ),
          hint(t('crea.settings.modelHint', { model: this.defaultModel })),
        ]),
        fieldset(t('crea.settings.effort'), [
          m(
            'select.form-select',
            {
              value: form.effort,
              onchange: (event: Event) => {
                form.effort = value(event)
              },
            },
            EFFORTS.map(([effort, word]) =>
              m('option', { value: effort }, t(`crea.settings.${word}`)),
            ),
          ),
          hint(t('crea.settings.effortHint')),
        ]),
        fieldset(null, [
          checkbox('crea-fast-mode', t('crea.settings.fastMode'), form.fastMode, (event) => {
            form.fastMode = checked(event)
          }),
          hint(t('crea.settings.fastModeHint')),
        ]),
        m(
          'button.btn.btn-md.btn-primary',
          { type: 'button', disabled: this.saving || !loaded, onclick: () => this.save() },
          t('save'),
        ),
        m(
          'button.btn.btn-md.btn-secondary.ms-2',
          { type: 'button', disabled: this.testing || !loaded, onclick: () => this.test() },
          t('crea.settings.testModel'),
        ),
        m('hr.my-4'),
        this.signerSection(),
        m('hr.my-4'),
        m('.h4.mb-1', t('crea.settings.sectionMatching')),
        m('small.text-muted.d-block.mb-3', t('crea.settings.sectionMatchingHint')),
        // what the server holds, not what the box shows; nothing while that is unknown
        this.keyingStored === false
          ? m(
              '.text-warning.mb-3',
              { 'data-test': 'matching-keying-off' },
              t('crea.settings.matchingKeyingOff'),
            )
          : null,
        fieldset(null, [
          checkbox('crea-keying', t('crea.settings.matchingKeying'), form.keying, (event) => {
            form.keying = checked(event)
          }),
          hint(t('crea.settings.matchingKeyingHint')),
        ]),
        m(
          'button.btn.btn-md.btn-primary',
          {
            type: 'button',
            disabled: this.savingKeying || !loaded,
            'data-test': 'matching-keying-save',
            onclick: () => this.saveKeying(),
          },
          t('save'),
        ),
        loaded ? null : m('small.text-muted.d-block.mt-2', t('crea.settings.unavailable')),
      ]),
    ])
  }

  private signerSection() {
    const { signer, loaded } = this
    return [
      m('.h4.mb-1', t('crea.settings.sectionFirstCreation')),
      m('small.text-muted.d-block.mb-3', t('crea.settings.sectionFirstCreationHint')),
      m(
        '.mb-3',
        { 'data-test': 'first-creation-signer' },
        signer
          ? [
              m(
                'strong',
                t('crea.settings.signerCurrent', {
                  name: signerName(signer),
                  role: signer.role ?? '-',
                }),
              ),
              signer.eligible
                ? null
                : m(
                    'span.text-danger.d-block',
                    t('crea.settings.signerNotEligible', { reason: reasonText(signer.reason) }),
                  ),
            ]
          : m('span.text-warning', t('crea.settings.noSigner')),
      ),
      labelledGroup('crea-signer-query', t('crea.settings.signerSearch'), [
        m('input.form-control#crea-signer-query', {
          type: 'text',
          placeholder: t('crea.settings.signerSearchPlaceholder'),
          'data-test': 'signer-query',
          value: this.signerQuery,
          oninput: (event: Event) => this.typeSignerQuery(value(event)),
        }),
        this.signerOptions.length > 0
          ? m(
              'select.form-select.mt-2',
              {
                'data-test': 'signer-choice',
                // nobody chosen: no option shows as picked
                value: this.signerChoice === null ? '' : String(this.signerChoice),
                onchange: (event: Event) => {
                  this.signerChoice = Number(value(event))
                },
              },
              this.signerOptions.map(({ value, text }) => m('option', { value }, text)),
            )
          : this.signerQuery.trim().length >= 2
            ? hint(t('crea.settings.signerNoMatch'))
            : null,
      ]),
      m(
        'button.btn.btn-md.btn-primary',
        {
          type: 'button',
          disabled: this.savingSigner || !loaded || this.signerChoice === null,
          'data-test': 'signer-save',
          onclick: () => this.setSigner(this.signerChoice),
        },
        t('save'),
      ),
      m(
        'button.btn.btn-md.btn-outline-danger.ms-2',
        {
          type: 'button',
          disabled: this.savingSigner || !loaded || signer === null,
          'data-test': 'signer-remove',
          onclick: () => this.setSigner(null),
        },
        t('crea.settings.signerRemove'),
      ),
    ]
  }
}
