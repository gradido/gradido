// AI-GENERATED — not an architecture reference
import {
  addCreationGroup,
  adoptLegacyHashtags,
  creationGroups,
  editCreationGroup,
  legacyHashtagCounts,
} from '@admin/graphql/creationGroups.graphql'
import classes from '@admin/pages/CreationGroups.module.css'
import m, { type Children, type ClassComponent } from 'mithril'
import * as v from 'valibot'
import { Modal } from '@/components/bootstrap/Modal'
import { toastError, toastSuccess } from '@/components/Toasts'
import { adoptionState, adoptionTotal, tagFromName } from '@/data/CreationGroup.logic'
import {
  type CreationGroup,
  creationGroupSchema,
  type HashtagCounts,
  hashtagCountsSchema,
} from '@/data/CreationGroup.schema'
import { graphqlRequest } from '@/graphql/client'
import { d, t } from '@/i18n'

type Adoption = {
  group: CreationGroup
  // null while they are counted
  counts: HashtagCounts | null
  includeLoose: boolean
  adopting: boolean
}

const value = (event: Event) => (event.target as HTMLInputElement).value

// a labelled field of the form, its hint below
const formGroup = (id: string, label: string, input: Children, hint?: string) =>
  m('.b-form-group.mb-2', { role: 'group' }, [
    m('label.form-label.d-block', { for: id }, label),
    input,
    hint ? m('small.text-muted.d-block.mt-1', hint) : null,
  ])

/**
 * The creation groups, for administrators: added, renamed, and -- once per group -- the hashtags
 * older contributions wrote for it taken over into the group field.
 */
export class CreationGroups implements ClassComponent {
  private groups: CreationGroup[] = []
  private newName = ''
  private newTag = ''
  // typed by hand: the name no longer suggests it
  private tagTouched = false
  private creating = false
  private editing: { id: number; name: string; tag: string } | null = null
  private saving = false
  private adoption: Adoption | null = null

  oninit() {
    this.load()
  }

  private async load() {
    const answer = await graphqlRequest(creationGroups)
    if (!answer.success) {
      toastError(answer.error.message)
      return
    }
    this.groups = v.parse(
      v.object({ creationGroups: v.array(creationGroupSchema) }),
      answer.value,
    ).creationGroups
  }

  private async create() {
    this.creating = true
    const answer = await graphqlRequest(addCreationGroup, {
      tag: this.newTag.trim(),
      name: this.newName.trim() || null,
    })
    this.creating = false
    if (!answer.success) {
      toastError(answer.error.message)
      return
    }
    toastSuccess(t('creationGroupsAdmin.created'))
    this.newName = ''
    this.newTag = ''
    this.tagTouched = false
    await this.load()
  }

  private async save(editing: NonNullable<CreationGroups['editing']>) {
    this.saving = true
    const answer = await graphqlRequest(editCreationGroup, {
      id: editing.id,
      tag: editing.tag.trim(),
      name: editing.name.trim() || null,
    })
    this.saving = false
    if (!answer.success) {
      toastError(answer.error.message)
      return
    }
    toastSuccess(t('creationGroupsAdmin.updated'))
    this.editing = null
    await this.load()
  }

  // Counted anew at each opening. An answer for a window closed or opened anew since changes
  // nothing: neither its counts nor its failure.
  private async openAdoption(group: CreationGroup) {
    const adoption: Adoption = { group, counts: null, includeLoose: true, adopting: false }
    this.adoption = adoption
    const answer = await graphqlRequest(legacyHashtagCounts, { id: group.id })
    if (this.adoption !== adoption) {
      return
    }
    if (answer.success) {
      adoption.counts = v.parse(
        v.object({ legacyHashtagCounts: hashtagCountsSchema }),
        answer.value,
      ).legacyHashtagCounts
    } else {
      toastError(answer.error.message)
      this.adoption = null
    }
  }

  // Also where nothing was found: that writes the day it was looked at.
  private async adopt(adoption: Adoption) {
    adoption.adopting = true
    const answer = await graphqlRequest(adoptLegacyHashtags, {
      id: adoption.group.id,
      includeLoose: adoption.includeLoose,
    })
    adoption.adopting = false
    if (!answer.success) {
      toastError(answer.error.message)
      return
    }
    toastSuccess(t('creationGroupsAdmin.adoption.done'))
    this.adoption = null
    await this.load()
  }

  view() {
    return m('.creation-groups', [
      m('.h2.mb-3', t('creationGroupsAdmin.title')),
      m('div', { class: classes.creationGroupsBody }, [
        m('p.text-muted', t('creationGroupsAdmin.intro')),
        m('.mb-4', { class: classes.creationGroupsForm }, [
          m('.h5.mb-2', t('creationGroupsAdmin.addTitle')),
          formGroup(
            'creation-group-name',
            t('creationGroupsAdmin.name'),
            m('input.form-control#creation-group-name', {
              type: 'text',
              placeholder: t('creationGroupsAdmin.namePlaceholder'),
              value: this.newName,
              oninput: (event: Event) => {
                this.newName = value(event)
                if (!this.tagTouched) {
                  this.newTag = tagFromName(this.newName)
                }
              },
            }),
          ),
          formGroup(
            'creation-group-tag',
            t('creationGroupsAdmin.tag'),
            m('input.form-control#creation-group-tag', {
              type: 'text',
              placeholder: t('creationGroupsAdmin.tagPlaceholder'),
              value: this.newTag,
              oninput: (event: Event) => {
                this.newTag = value(event)
                this.tagTouched = true
              },
            }),
            t('creationGroupsAdmin.tagHint'),
          ),
          m(
            'button.btn.btn-md.btn-primary',
            {
              type: 'button',
              disabled: this.creating || this.newTag.trim() === '',
              onclick: () => this.create(),
            },
            t('creationGroupsAdmin.add'),
          ),
        ]),
        m('.h5.mb-2', t('creationGroupsAdmin.existingTitle')),
        this.groups.length === 0
          ? m('.text-muted', t('creationGroupsAdmin.empty'))
          : m(
              'ul.creation-group-list.list-unstyled',
              this.groups.map((group) =>
                m('li', { key: group.id, class: classes.creationGroupRow }, this.row(group)),
              ),
            ),
      ]),
      this.adoption ? this.adoptionWindow(this.adoption) : null,
    ])
  }

  private row(group: CreationGroup) {
    const { editing } = this
    if (editing?.id === group.id) {
      const field = (key: 'name' | 'tag') =>
        m('input.form-control', {
          type: 'text',
          class: classes.creationGroupInput,
          placeholder: t(`creationGroupsAdmin.${key}`),
          value: editing[key],
          oninput: (event: Event) => {
            editing[key] = value(event)
          },
        })
      return [
        field('name'),
        field('tag'),
        m(
          'button.btn.btn-sm.btn-primary',
          { type: 'button', disabled: this.saving, onclick: () => this.save(editing) },
          t('creationGroupsAdmin.save'),
        ),
        m(
          'button.btn.btn-sm.btn-secondary',
          {
            type: 'button',
            onclick: () => {
              this.editing = null
            },
          },
          t('creationGroupsAdmin.cancel'),
        ),
      ]
    }
    const { key, date, count } = adoptionState(group)
    return [
      m('span', { class: classes.creationGroupName }, group.name || '—'),
      m('span.text-muted', { class: classes.creationGroup }, `#${group.tag}`),
      m(
        'span.text-muted',
        { class: classes.adoptionState, 'data-test': `adoption-state-${group.id}` },
        t(key, date ? { date: d(date, 'short'), count: count ?? 0 } : {}),
      ),
      // on a phone the line its buttons start below
      m('span', { class: classes.creationGroupBreak, 'aria-hidden': 'true' }),
      m(
        'button.btn.btn-sm.btn-outline-secondary.ms-auto',
        { type: 'button', onclick: () => this.openAdoption(group) },
        t('creationGroupsAdmin.adoption.check'),
      ),
      m(
        'button.btn.btn-sm.btn-outline-secondary',
        {
          type: 'button',
          onclick: () => {
            this.editing = { id: group.id, name: group.name ?? '', tag: group.tag }
          },
        },
        t('creationGroupsAdmin.edit'),
      ),
    ]
  }

  // Its own step on purpose: it reads every memo, and writes onto other members' contributions.
  private adoptionWindow(adoption: Adoption) {
    const { group, counts } = adoption
    const close = () => {
      this.adoption = null
    }
    const total = counts ? adoptionTotal(counts, adoption.includeLoose) : 0
    return m(
      Modal,
      {
        title: t('creationGroupsAdmin.adoption.title', { group: group.name || `#${group.tag}` }),
        onclose: close,
        footer: [
          m(
            'button.btn.btn-md.btn-secondary',
            { type: 'button', onclick: close },
            t('creationGroupsAdmin.cancel'),
          ),
          m(
            'button.btn.btn-md.btn-primary',
            {
              type: 'button',
              disabled: adoption.adopting || counts === null,
              onclick: () => this.adopt(adoption),
            },
            total > 0
              ? t('creationGroupsAdmin.adoption.adopt', { count: total })
              : t('creationGroupsAdmin.adoption.markChecked'),
          ),
        ],
      },
      counts === null
        ? m('.text-muted', t('creationGroupsAdmin.adoption.searching'))
        : [
            m(
              'p',
              t('creationGroupsAdmin.adoption.foundExact', { count: counts.exact, tag: group.tag }),
            ),
            counts.loose > 0
              ? m('.form-check.mb-2', [
                  m('input.form-check-input#adopt-loose', {
                    type: 'checkbox',
                    checked: adoption.includeLoose,
                    onchange: (event: Event) => {
                      adoption.includeLoose = (event.target as HTMLInputElement).checked
                    },
                  }),
                  m(
                    'label.form-check-label',
                    { for: 'adopt-loose' },
                    t('creationGroupsAdmin.adoption.foundLoose', {
                      count: counts.loose,
                      tag: group.tag,
                    }),
                  ),
                ])
              : null,
            counts.exact === 0 && counts.loose === 0
              ? m('p.text-muted', t('creationGroupsAdmin.adoption.foundNothing'))
              : null,
            m('small.text-muted.d-block', t('creationGroupsAdmin.adoption.hint')),
          ],
    )
  }
}
