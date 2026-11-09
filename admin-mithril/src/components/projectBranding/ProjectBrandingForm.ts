// AI-GENERATED — not an architecture reference
import { spaces, spaceWithNameAndDescription } from '@admin/graphql/projectBranding.graphql'
import m, { type ClassComponent, type Vnode } from 'mithril'
import * as v from 'valibot'
import { Modal } from '@/components/bootstrap/Modal'
import { toastError } from '@/components/Toasts'
import {
  chosenSpaceSchema,
  fieldCheck,
  formMessage,
  type ProjectBranding,
  type ProjectBrandingField,
  projectBrandingFormSchema,
  type SpacesPage,
  spacesSchema,
} from '@/data/ProjectBranding.schema'
import { graphqlRequest } from '@/graphql/client'
import { t } from '@/i18n'
import { ListHumhubSpaces, SPACES_PER_PAGE } from './ListHumhubSpaces'

interface Attrs {
  item: ProjectBranding
  /** the form is valid: what it holds, with the id of the entry */
  onsave: (form: ProjectBranding) => void
}

// the length a field allows, as the old admin wrote it onto the input
const LIMITS: Record<ProjectBrandingField, { min?: number; max?: number }> = {
  name: { min: 3, max: 255 },
  alias: { min: 3, max: 32 },
  description: {},
  logoUrl: { max: 255 },
}

/** The fields of an entry, the Humhub space to add its new members to, and saving them. */
export class ProjectBrandingForm implements ClassComponent<Attrs> {
  private item!: ProjectBranding
  private form!: ProjectBranding
  private message = ''
  // the chosen space by its id, null where it could not be read
  private space: { id: number; name: string; description: string } | null = null
  private choosing = false
  // the page of spaces last shown: the list opens on it again
  private spaces: SpacesPage | null = null

  oninit({ attrs: { item } }: Vnode<Attrs>) {
    this.takeItem(item)
  }

  // the entry anew, also where the list brought it fresh while the form is open
  private takeItem(item: ProjectBranding) {
    this.item = item
    this.form = { ...item }
    this.message = ''
    this.loadSpace()
  }

  private async loadSpace() {
    const id = this.form.spaceId
    if (!id) {
      return
    }
    const answer = await graphqlRequest(spaceWithNameAndDescription, { id })
    const parsed = answer.success ? v.safeParse(chosenSpaceSchema, answer.value) : null
    // an answer for a space chosen since is dropped
    if (id === this.form.spaceId) {
      this.space = parsed?.success ? { id, ...parsed.output.space } : null
    }
  }

  private async loadSpaces(page: number) {
    const answer = await graphqlRequest(spaces, { page, limit: SPACES_PER_PAGE })
    if (!answer.success) {
      toastError(answer.error.message)
      return
    }
    this.spaces = v.parse(spacesSchema, answer.value).spaces
  }

  // The list opens on the page of the chosen space, reckoned from its id as before.
  private openSpaces() {
    this.choosing = true
    if (!this.spaces) {
      this.loadSpaces(this.form.spaceId ? Math.ceil(this.form.spaceId / SPACES_PER_PAGE) : 1)
    }
  }

  private submit(onsave: Attrs['onsave']) {
    const result = v.safeParse(projectBrandingFormSchema, this.form)
    if (!result.success) {
      this.message = formMessage(result.issues) ?? ''
      return
    }
    onsave({ ...result.output, id: this.item.id })
  }

  private input(field: ProjectBrandingField, label: string) {
    const value = this.form[field] ?? ''
    const { valid, message } = fieldCheck(field, value)
    const id = `${field}-input-field`
    const required = field === 'name' || field === 'alias'
    const attributes = {
      id,
      name: field,
      class: valid === null ? '' : valid ? 'is-valid' : 'is-invalid',
      value,
      oninput: (event: Event) => {
        this.form[field] = (event.target as HTMLInputElement).value
      },
    }
    return m(
      `.input-${field}`,
      m('.b-form-group', { role: 'group' }, [
        m('label.form-label.d-block', { for: id }, label),
        field === 'description'
          ? m('textarea.form-control.mb-3', {
              ...attributes,
              rows: 4,
              wrap: 'soft',
              style: { resize: 'none', height: '110px' },
            })
          : m('input.form-control.mb-3', {
              ...attributes,
              ...LIMITS[field],
              type: 'text',
              required,
              'aria-required': required ? 'true' : undefined,
            }),
        message ? m('.invalid-feedback', { 'aria-live': 'assertive' }, message) : null,
      ]),
    )
  }

  private spaceText() {
    const { spaceId } = this.form
    if (!spaceId) {
      return t('projectBranding.selectSpace')
    }
    return this.space?.id === spaceId
      ? t('projectBranding.chosenSpace', { space: this.space.name })
      : t('projectBranding.noAccessRightSpace', { spaceId })
  }

  view({ attrs: { item, onsave } }: Vnode<Attrs>) {
    if (item !== this.item) {
      this.takeItem(item)
    }
    const { form } = this
    return m('.project-branding-form', [
      m(
        'form',
        {
          onsubmit: (event: Event) => {
            event.preventDefault()
            this.submit(onsave)
          },
          // the fields show what the form holds again, not what the page first wrote into them
          onreset: (event: Event) => {
            event.preventDefault()
            this.takeItem(item)
          },
        },
        [
          this.input('name', t('name')),
          this.input('alias', t('alias')),
          this.input('description', t('description')),
          m(
            'button.btn.btn-md.btn-outline-secondary.mb-3',
            {
              type: 'button',
              title:
                this.space && this.space.id === form.spaceId ? this.space.description : undefined,
              onclick: () => this.openSpaces(),
            },
            this.spaceText(),
          ),
          m('.b-form-group.mb-3', { role: 'group' }, [
            m(
              'label.form-label.d-block',
              { for: 'newUserToSpace-input-field' },
              t('projectBranding.newUserToSpace'),
            ),
            m('.form-check', [
              m('input#newUserToSpace-input-field.form-check-input', {
                type: 'checkbox',
                name: 'newUserToSpace',
                checked: form.newUserToSpace,
                onchange: (event: Event) => {
                  form.newUserToSpace = (event.target as HTMLInputElement).checked
                },
              }),
              m(
                'label.form-check-label',
                { for: 'newUserToSpace-input-field' },
                t('projectBranding.newUserToSpaceTooltip'),
              ),
            ]),
          ]),
          this.input('logoUrl', t('logo')),
          this.message ? m('.invalid-feedback.d-block.mb-3', this.message) : null,
          m('.d-flex.gap-2', [
            m('button.btn.btn-md.btn-primary', { type: 'submit' }, t('save')),
            m('button.btn.btn-md.btn-secondary', { type: 'reset' }, t('reset')),
          ]),
        ],
      ),
      this.choosing
        ? m(
            Modal,
            {
              title: t('projectBranding.selectSpace'),
              onclose: () => {
                this.choosing = false
              },
            },
            this.spaces
              ? m(ListHumhubSpaces, {
                  spaces: this.spaces,
                  chosen: form.spaceId,
                  onchoose: ({ id, url }) => {
                    form.spaceId = id
                    form.spaceUrl = url
                    this.loadSpace()
                  },
                  onpage: (page) => this.loadSpaces(page),
                })
              : null,
          )
        : null,
    ])
  }
}
